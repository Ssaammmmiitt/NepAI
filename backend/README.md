# NepAI Backend

FastAPI server with a PyTorch ML pipeline for NEPSE stock data. Handles LSTM model training, recursive multi-day inference, stock data serving, authentication (Supabase proxy), and portfolio CRUD.

## Quick Start

From the **repository root**:

```bash
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env   # fill in Supabase credentials
python -m backend serve                # http://localhost:8000
```

Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Environment

Create `backend/.env` from `.env.example`:

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | Yes | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (never expose to frontend) |

Both are required at import time. The server will crash on startup without them.

## Supabase Database Setup

The backend reads/writes three tables and one storage bucket. Create these in your Supabase project before running.

### Tables

#### `profiles`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, references `auth.users(id)` on delete cascade |
| `full_name` | `text` | |
| `email` | `text` | |

Auto-populated via trigger on `auth.users` insert:

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### `portfolio`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | References `auth.users(id)` on delete cascade |
| `ticker` | `text` | Not null |
| `quantity` | `integer` | Not null |
| `entry_price` | `numeric` | Not null |
| `added_at` | `timestamptz` | Default `now()` |

```sql
CREATE TABLE public.portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  quantity integer NOT NULL,
  entry_price numeric NOT NULL,
  added_at timestamptz DEFAULT now()
);

ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own portfolio"
  ON public.portfolio FOR ALL
  USING (auth.uid() = user_id);
```

#### `models`

Stores trained model metadata. Upserted on each training run, keyed by `ticker`.

| Column | Type | Constraints |
|--------|------|-------------|
| `ticker` | `text` | PK |
| `date_created` | `timestamptz` | When training completed |
| `mae` | `numeric` | Mean Absolute Error |
| `mape` | `numeric` | Mean Absolute Percentage Error |
| `r2` | `numeric` | R-squared |
| `rmse` | `numeric` | Root Mean Squared Error |
| `direction_accuracy` | `numeric` | % correct price direction predictions |
| `n_features` | `integer` | Number of input features |
| `feature_cols` | `jsonb` | All feature column names |
| `features` | `jsonb` | Base feature names |
| `engineered_features` | `jsonb` | Engineered feature names |
| `training_rows` | `integer` | Total data rows used |
| `seq_len` | `integer` | Sequence length |
| `date_range` | `jsonb` | `{"start": "...", "end": "..."}` |
| `split_sizes` | `jsonb` | `{"train": N, "val": N, "test": N}` |
| `training_time_sec` | `numeric` | Training wall-clock time |
| `epochs_trained` | `integer` | Actual epochs completed |
| `best_val_loss` | `numeric` | Best validation loss |

```sql
CREATE TABLE public.models (
  ticker text PRIMARY KEY,
  date_created timestamptz,
  mae numeric, mape numeric, r2 numeric, rmse numeric,
  direction_accuracy numeric,
  n_features integer, feature_cols jsonb, features jsonb,
  engineered_features jsonb, training_rows integer, seq_len integer,
  date_range jsonb, split_sizes jsonb,
  training_time_sec numeric, epochs_trained integer, best_val_loss numeric
);
```

### Storage Bucket

Create a bucket named **`model-artifacts`** in Supabase Dashboard -> Storage.

Contents per trained model:

| Path | Description |
|------|-------------|
| `{TICKER}/model.pt` | PyTorch model state dict |
| `{TICKER}/scaler_feature.pkl` | Fitted RobustScaler for input features |
| `{TICKER}/scaler_target.pkl` | Fitted RobustScaler for target (close price) |

The backend uploads/downloads artifacts using the service role key, so no RLS policies are needed on the bucket. Files are uploaded with `upsert: true` on each training run.

**Local cache:** Downloaded artifacts are cached in `backend/.model_cache/{TICKER}/` with a `metadata.json` sidecar for cache invalidation against the DB.

## API Reference

Base URL: `http://localhost:8000/api`

All timestamps are in Nepal Standard Time (UTC+5:45). Responses for stock-related endpoints include `stock_name` and `stock_sector` when metadata exists.

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server status, ticker count, model count, latest data date |

### Stocks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stocks` | All tickers with latest close, change %, volume |
| GET | `/stocks/{ticker}` | Full OHLC history for a stock |
| GET | `/stocks/{ticker}/ohlc` | OHLC data; optional `?from=YYYY-MM-DD&to=YYYY-MM-DD` |
| GET | `/stocks/{ticker}/summary` | Latest price, change, 52-week high/low, avg volume |
| GET | `/stocks/{ticker}/indicators` | RSI, MACD, Bollinger Bands, EMA (20/50) |

### ML / Predictions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/predictions/{ticker}` | Recursive forecast; `?days=1-14` (default 5) |
| GET | `/models` | All trained models with metrics and staleness flag |
| GET | `/model_status/{ticker}` | `trained` / `training` / `not_available` + metadata |
| POST | `/train` | Body: `{"stock_name": "NABIL"}` |

**Training lifecycle:**
1. Validates stock CSV exists
2. Checks no concurrent training for same ticker (409 if in progress)
3. Verifies >= 500 usable rows after preprocessing
4. Deletes existing model artifacts (DB + bucket + cache)
5. Trains in a background thread (server stays responsive)
6. Saves model weights to bucket, metrics to DB
7. Returns result with metrics when done

### Auth (Supabase Proxy)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | `{ full_name, email, password }` |
| POST | `/auth/login` | `{ email, password }` |
| POST | `/auth/refresh` | `{ refresh_token }` |
| GET | `/auth/me` | Profile from `profiles` table (Bearer JWT) |

### Portfolio (Bearer JWT Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/portfolio` | All holdings with live P&L from current market data |
| POST | `/portfolio` | `{ ticker, quantity, entry_price }` - adds or merges (weighted avg) |
| DELETE | `/portfolio/{ticker}` | Remove a holding entirely |

**Weighted-average merge:** Adding a stock you already hold merges via weighted average. Example: hold 10 NABIL @ Rs 500, add 5 @ Rs 600 -> 15 NABIL @ Rs 533.33.

### Error Codes

| Code | When |
|------|------|
| 400 | Insufficient data (< 500 rows), validation error, bad signup input |
| 401 | Invalid/expired JWT, wrong credentials, expired refresh token |
| 404 | Unknown ticker, missing model, profile not found |
| 409 | Training already in progress for the requested ticker |
| 500 | Supabase/internal server errors |

## ML Pipeline

**Model:** Stacked LSTM + Multi-Head Attention (~100K params per ticker)

```
Input (10 features) -> Linear Projection -> 2-Layer LSTM (hidden=64)
  -> Multi-Head Attention (4 heads) + LayerNorm
    -> Dropout -> FC Head -> Predicted Close
```

| Setting | Value |
|---------|-------|
| Sequence length | 60 trading days |
| Features | 10: open, high, low, close, per_change, traded_quantity, ma_7, ma_21, volatility, price_range |
| Target | Next-day close |
| Scaler | RobustScaler (per stock, separate for features and target) |
| Forecast | Recursive; ±15% NEPSE circuit breaker cap per day |
| Min rows | 500 after preprocessing (from 2020 onward) |

### ML Modules (`backend/ml/`)

| Module | Role |
|--------|------|
| `model.py` | `StackedLSTMAttention` network definition |
| `preprocessing.py` | CSV loading, feature engineering (MA, volatility, range), train/val/test split |
| `dataset.py` | Sliding-window `DataLoader` construction |
| `training.py` | Training loop with early stopping, evaluation, and artifact saving |
| `inference.py` | Recursive multi-day prediction with circuit breaker |
| `evaluation.py` | MAE, RMSE, MAPE, R-squared, Direction Accuracy |
| `circuit_breaker.py` | NEPSE ±15% daily price cap enforcement |
| `storage.py` | Save/load model artifacts via Supabase DB + Storage bucket + local cache |

## CLI

Run from the repo root:

```bash
python -m backend train    --stock NABIL [--epochs 150] [--patience 15]
python -m backend predict  --stock NABIL [--days 5]
python -m backend evaluate --stock NABIL
python -m backend serve    [--host 0.0.0.0] [--port 8000] [--reload]
```

## Package Layout

```
backend/
├── __main__.py          CLI entry (train, predict, evaluate, serve)
├── config.py            Paths, hyperparameters, feature lists
├── supabase_client.py   Supabase client singleton (reads .env)
├── requirements.txt
├── .model_cache/        Local cache for downloaded model artifacts
├── api/
│   ├── main.py          FastAPI app, CORS, router registration, startup
│   ├── state.py         In-memory data cache, ticker registry, training status
│   ├── metadata.py      Stock name/sector enrichment
│   ├── errors.py        Custom exceptions + FastAPI error handlers
│   ├── auth.py          JWT verification dependency (get_current_user)
│   └── routers/
│       ├── stocks.py        GET /stocks, /stocks/{ticker}, /ohlc, /summary, /indicators
│       ├── predictions.py   GET /predictions/{ticker}
│       ├── train.py         POST /train
│       ├── models.py        GET /models
│       ├── model_status.py  GET /model_status/{ticker}
│       ├── auth.py          POST /auth/signup, /login, /refresh; GET /auth/me
│       └── portfolio.py     GET/POST/DELETE /portfolio
└── ml/
    ├── model.py           StackedLSTMAttention network
    ├── preprocessing.py   CSV loading, feature engineering
    ├── dataset.py         Sliding-window DataLoaders
    ├── training.py        Train loop + early stopping + save
    ├── inference.py       Recursive multi-day prediction
    ├── evaluation.py      Metrics computation
    ├── circuit_breaker.py NEPSE daily cap
    └── storage.py         DB + bucket + cache model storage
```

## Data Sources

- **Prices:** `data/companies/{TICKER}.csv` (585 tickers, daily OHLC from ShareSansar)
- **Metadata:** `data/metadata/name_data.json` (ticker -> company name), `sector_mappings.json` (ticker -> sector)
- **Auto-updates:** `data_scraper/scrape_nepse.py` via GitHub Actions (Mon-Fri 6:00 PM NPT)

## Related Docs

- [../README.md](../README.md) - Project overview, model architecture, Supabase setup
- [../frontend/README.md](../frontend/README.md) - Dashboard client
- [../nepai-lstm-train.ipynb](../nepai-lstm-train.ipynb) - Training experiments notebook
