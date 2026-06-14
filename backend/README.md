# NepAI Backend

FastAPI server and PyTorch ML pipeline for NEPSE stock data, LSTM training/inference, and user portfolios (via Supabase).

## Quick start

From the **repository root**:

```bash
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env   # fill Supabase credentials
python -m backend serve                # http://localhost:8000
```

Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Environment

Create `backend/.env` from `.env.example`:

| Variable | Required for |
|----------|----------------|
| `SUPABASE_URL` | Auth + portfolio |
| `SUPABASE_SERVICE_ROLE_KEY` | Auth + portfolio |

Stock endpoints, predictions, and training do not need Supabase. The server expects these variables when auth/portfolio routes are used.

## CLI

Run from repo root:

```bash
python -m backend train    --stock NABIL [--epochs 150] [--patience 15]
python -m backend predict  --stock NABIL [--days 5]
python -m backend evaluate --stock NABIL
python -m backend serve    [--host 0.0.0.0] [--port 8000] [--reload]
```

## API overview

Base URL: `http://localhost:8000/api` · Timestamps: Nepal Standard Time (UTC+5:45)

Responses include `stock_name` and `stock_sector` when metadata exists.

### Public — market & ML

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Status, ticker count, model count |
| GET | `/stocks` | All tickers, latest price |
| GET | `/stocks/{ticker}` | Full OHLC history |
| GET | `/stocks/{ticker}/ohlc` | OHLC; optional `?from=&to=` |
| GET | `/stocks/{ticker}/summary` | Latest price, 52w high/low |
| GET | `/stocks/{ticker}/indicators` | RSI, MACD, Bollinger, EMA |
| GET | `/predictions/{ticker}` | Forecast; `?days=1-14` (default 5) |
| GET | `/models` | All trained models + metrics |
| GET | `/model_status/{ticker}` | `trained` / `training` / `not_available` |
| POST | `/train` | Body: `{"stock_name": "NABIL"}` |

### Auth (Supabase proxy)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | `{ full_name, email, password }` |
| POST | `/auth/login` | `{ email, password }` |
| POST | `/auth/refresh` | `{ refresh_token }` |
| GET | `/auth/me` | Profile (Bearer JWT) |

### Portfolio (Bearer JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/portfolio` | Holdings + live P&amp;L |
| POST | `/portfolio` | `{ ticker, quantity, entry_price }` |
| DELETE | `/portfolio/{ticker}` | Remove holding |

### Common errors

| Code | When |
|------|------|
| 400 | Insufficient data (&lt;500 rows), validation error |
| 401 | Invalid/expired JWT or credentials |
| 404 | Unknown ticker or missing model |
| 409 | Training already in progress |

Example: `{"error": "Stock 'HEIPO' has 3 usable rows after preprocessing (minimum 500 required)", "ticker": "HEIPO"}`

## ML pipeline

**Model:** Stacked LSTM + multi-head attention (~100K params per ticker)

| Setting | Value |
|---------|-------|
| Sequence length | 60 trading days |
| Features | 11 (OHLC, volume, change + engineered) |
| Target | Next-day close |
| Scaler | RobustScaler (per stock) |
| Forecast | Recursive; ±15% circuit breaker per day |
| Min rows | 500 after preprocessing (from 2020+) |

**Artifacts** (`models/{TICKER}/`):

- `model.pt` — weights
- `scaler_feature.pkl`, `scaler_target.pkl`
- `metadata.json` — metrics, date range, epochs
- `predictions.png` — test-set plot

**Modules** (`backend/ml/`):

| Module | Role |
|--------|------|
| `model.py` | Network definition |
| `preprocessing.py` | Load CSV, engineer features, split |
| `dataset.py` | Sliding-window DataLoaders |
| `training.py` | Train loop + early stopping |
| `inference.py` | Multi-day recursive predict |
| `evaluation.py` | MAE, RMSE, MAPE, R², direction accuracy |
| `circuit_breaker.py` | NEPSE daily cap |
| `storage.py` | Save/load artifacts |

## Package layout

```
backend/
├── __main__.py       CLI entry
├── config.py         Paths, hyperparameters, features
├── requirements.txt
├── api/
│   ├── main.py       FastAPI app, CORS, routers
│   ├── state.py      CSV cache, training status
│   ├── metadata.py   Name/sector enrichment
│   ├── auth.py       JWT dependency
│   └── routers/      stocks, predictions, train, auth, portfolio, …
└── ml/               PyTorch pipeline (see above)
```

## Data sources

- **Prices:** `data/companies/{TICKER}.csv` (585 tickers)
- **Metadata:** `data/metadata/name_data.json`, `sector_mappings.json`
- **Updates:** `data_scraper/scrape_nepse.py` via GitHub Actions (Mon–Fri 18:00 NPT)

## Related docs

- [../README.md](../README.md) — monorepo quick start
- [../frontend/README.md](../frontend/README.md) — dashboard client
- [../report.md](../report.md) — full architecture & model metrics
