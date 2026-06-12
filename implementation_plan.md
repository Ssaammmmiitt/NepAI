# NepAI — Implementation Plan

> **LSTM-Based Stock Price Prediction for NEPSE**

---

## 1. Project Summary

NepAI is a **multi-user** stock prediction dashboard that:

1. Reads **NEPSE OHLC data** from CSV files in `data/`, updated daily by a GitHub Actions workflow.
2. Serves **pre-trained LSTM predictions** via FastAPI. Each model predicts **next-day close only**. Multi-day forecasts are produced by running inference recursively.
3. Tracks **model freshness** via `metadata.json` in each model's directory — the frontend shows when it was trained and allows retraining if stale (>7 days).
4. Renders an **interactive dashboard** with candlestick charts, prediction cards, and portfolio tracking.
5. **Authenticates users** via email/password (signup + login). The backend proxies all auth to **Supabase Auth** — the frontend has zero Supabase knowledge.
6. **Persists portfolios** in a Supabase PostgreSQL database. Each user's portfolio is isolated via Row Level Security. Adding the same stock again computes a **weighted-average entry price**.

**Storage**: CSVs for stock data, filesystem directories for models, Supabase PostgreSQL for users and portfolios.

### Model Specification

| Parameter | Value |
|-----------|-------|
| Architecture | **StackedLSTM_Attention** (LSTM + Multi-Head Attention) |
| Hidden size | 64 |
| Num layers | 2 |
| Dropout | 0.2 |
| Attention heads | 4 |
| Sequence length | 60 (last 60 trading days as input window) |
| Base features | open, high, low, close, per_change, traded_quantity |
| Engineered features | ma_7, ma_21, volatility, price_range, day_of_week |
| Total features | 11 |
| Target | next-day `close` price |
| Scaler | RobustScaler (separate feature + target scalers, fitted per-stock) |
| Forecast method | **Recursive** — for N-day forecast, run N sequential inferences, each time appending the predicted day to the input window |
| Circuit breaker | Predictions clamped to +/-15% of previous close (NEPSE daily limit) |

> **Hardware note**: ~100K parameters per model (<1MB). Loading all 124 simultaneously uses ~124MB. RTX 4050 (6GB) is overkill for inference — CPU is fine too.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────┐
│  GitHub Actions (daily cron)     │
│  Scrape NEPSE -> commit CSVs    │
│  to data/                        │
└──────────────────────────────────┘

┌─────────────────────────────┐
│  Frontend (React + Vite)    │
│  localhost:5173              │
│  ─────────────────────────  │
│  Login / Signup              │
│  Dashboard | StockDetail    │
│  Portfolio (DB-backed)      │
│  TradingView Charts         │
│  Retrain button (if stale)  │
└──────────┬──────────────────┘
           │ HTTP/JSON (Vite proxy -> :8000)
           │ Authorization: Bearer <JWT>
┌──────────▼──────────────────┐
│  Backend (FastAPI + ML)     │
│  localhost:8000              │
│  ─────────────────────────  │
│  /api/auth/*    (auth proxy)│
│  /api/stocks/*              │
│  /api/predictions/{ticker}  │
│  /api/portfolio  (CRUD)     │
│  /api/train                 │
│  CLI: python -m backend     │
└──────┬──────────┬───────┬───┘
       │          │       │
┌──────▼────┐ ┌──▼─────────────┐ ┌──▼──────────────────┐
│ CSV Files │ │ Supabase        │ │ Model Dirs           │
│ data/     │ │ Auth + Postgres │ │ models/{TICKER}/     │
│ *.csv     │ │ profiles table  │ │   model.pt           │
│           │ │ portfolio table │ │   scaler_feature.pkl │
│           │ │                 │ │   scaler_target.pkl  │
│           │ │                 │ │   metadata.json      │
│           │ │                 │ │   predictions.png    │
└───────────┘ └─────────────────┘ └──────────────────────┘
```

**Auth flow** (backend-only — no Supabase JS in frontend):

```
Signup:   Frontend --{full_name, email, password}--> POST /api/auth/signup
             --> Backend calls Supabase auth.sign_up()
             --> DB trigger auto-creates profiles row
             --> Backend returns {user, access_token, refresh_token}

Login:    Frontend --{email, password}--> POST /api/auth/login
             --> Backend calls Supabase auth.sign_in_with_password()
             --> Backend returns {user, access_token, refresh_token}

API Call: Frontend attaches "Authorization: Bearer <access_token>" header
             --> Backend auth dependency verifies JWT via Supabase
             --> Extracts user_id --> scopes DB queries to that user
```

---

## 3. What Exists (Frontend — ~90% Done)

### Pages

| Route | Page | Status |
|-------|------|--------|
| `/` | `Dashboard` | Working — market overview, gainers/losers, sector breakdown, ticker list |
| `/stock/:ticker` | `StockDetail` | Working — candlestick + volume charts, current snapshot, AI prediction card, add-to-portfolio |
| `/portfolio` | `Portfolio` | Working — add/remove holdings, summary cards. Uses `localStorage` |

### Components (built and in use)

| Category | Components |
|----------|-----------|
| Layout | `Sidebar`, `Header`, `PageWrapper` |
| Charts | `CandlestickChart` (TradingView), `VolumeChart` |
| Cards | `AIPrediction`, `CurrentSnapshot`, `TechnicalIndicators`, `PortfolioCard`, `StockSummaryCard` |
| Widgets | `MarketOverview`, `TopMovers`, `TickerList`, `SectorBreakdown`, `StockSearch`, `PortfolioSummary`, `LiveClock` |
| UI | `Button`, `Badge`, `Spinner`, `ThemeToggle` |

### Components (built but unused)

| Component | Notes |
|-----------|-------|
| `IndicatorOverlay` | Chart overlay for indicators — wire up when indicators are computed |
| `PredictionLine` | Chart overlay for prediction line — wire up to real predictions |
| `PredictionCard` | Alternative prediction display |
| `ModelHealthCard` | Model accuracy display |
| `Modal` | Generic modal |

### Current data flow (to be replaced)

```
frontend/public/data/tickers.json + *.csv
        ↓ (client-side CSV parsing)
mockData.ts → hooks → pages
```

- `useStockData` → calls `getOHLC()` from `mockData.ts` (parses CSV in browser)
- `usePrediction` → calls `generateMockPrediction()` (random numbers)
- `usePortfolio` → reads `localStorage`
- `api.ts` → defines the real backend contract (axios), but **nothing uses it yet**

---

## 4. What Needs to Be Built

### 4.1 Directory Structure

```
NepAI/
├── .github/
│   └── workflows/
│       └── scrape-data.yml              # Daily cron workflow
│
├── data/                                # 124 CSVs (source of truth, updated by GH Actions)
│   ├── NABIL.csv
│   ├── NMB.csv
│   └── ...
│
├── backend/                             # Python package: run via `python -m backend`
│   ├── __init__.py
│   ├── __main__.py                      # CLI entry (train / predict / evaluate)
│   ├── config.py                        # Paths, hyperparameters, feature lists
│   ├── requirements.txt                 # + supabase, python-dotenv
│   ├── .env                             # [NEW] SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
│   │
│   ├── ml/                              # ML pipeline (training, inference, storage)
│   │   ├── __init__.py
│   │   ├── model.py                     # StackedLSTMAttention architecture
│   │   ├── preprocessing.py             # CSV loading, feature engineering, splitting
│   │   ├── dataset.py                   # StockDataset + DataLoader construction
│   │   ├── circuit_breaker.py           # NEPSE +/-15% daily price cap
│   │   ├── training.py                  # Training loop, early stopping
│   │   ├── evaluation.py               # Test-set evaluation + metric computation
│   │   ├── inference.py                 # Recursive multi-day forecast
│   │   ├── plotting.py                  # Predicted-vs-actual visualization
│   │   └── storage.py                   # Save/load model artifacts to disk
│   │
│   └── api/                             # FastAPI server
│       ├── __init__.py
│       ├── main.py                      # FastAPI entry, CORS, startup, health (MODIFIED)
│       ├── errors.py                    # Custom exceptions + HTTP error handlers
│       ├── state.py                     # App state: data cache, ticker registry, training tracker
│       ├── supabase_client.py           # [NEW] Supabase Python client singleton
│       ├── auth.py                      # [NEW] get_current_user FastAPI dependency
│       └── routers/
│           ├── __init__.py
│           ├── stocks.py                # /api/stocks/* endpoints
│           ├── predictions.py           # /api/predictions/{ticker}
│           ├── train.py                 # POST /api/train endpoint
│           ├── models.py               # /api/models endpoint
│           ├── model_status.py          # /api/model_status/{ticker} endpoint
│           ├── auth.py                  # [NEW] /api/auth/signup, /login, /refresh, /me
│           └── portfolio.py             # [NEW] /api/portfolio CRUD endpoints
│
├── models/                              # One directory per trained stock
│   ├── NABIL/
│   │   ├── model.pt                     # Trained weights (state dict)
│   │   ├── scaler_feature.pkl           # Fitted RobustScaler for 11 input features
│   │   ├── scaler_target.pkl            # Fitted RobustScaler for close target
│   │   ├── metadata.json                # Training metadata + accuracy metrics
│   │   └── predictions.png              # Predicted-vs-actual 2x2 plot
│   └── ...
│
├── data_scraper/                        # Daily price scraper
│   ├── dailyscraper.py                  # Scrapes sharesansar.com, appends to CSVs
│   └── requirements.txt                 # pandas, requests, lxml, beautifulsoup4
│
└── frontend/                            # React app
    └── src/
        ├── services/
        │   ├── api.ts                   # (MODIFIED) add auth token interceptor + 401 refresh
        │   └── mockData.ts              # (to be removed after backend rewire)
        ├── store/
        │   ├── authStore.ts             # [NEW] user, tokens, signIn/signUp/signOut/initialize
        │   ├── portfolioStore.ts        # (MODIFIED) replace localStorage with API calls
        │   ├── stockStore.ts
        │   └── themeStore.ts
        ├── hooks/
        │   ├── usePortfolio.ts          # (MODIFIED) replace localStorage with API calls
        │   └── ...
        ├── pages/
        │   ├── Login.tsx                # [NEW] login + signup page
        │   ├── Dashboard.tsx
        │   ├── StockDetail.tsx
        │   └── Portfolio.tsx
        ├── components/
        │   └── layout/
        │       ├── ProtectedRoute.tsx   # [NEW] auth route guard
        │       ├── Sidebar.tsx          # (MODIFIED) add user info + sign out
        │       └── ...
        └── App.tsx                      # (MODIFIED) add /login route, wrap with ProtectedRoute
```

### 4.2 Model Directory — `metadata.json`

Each trained model has a directory under `models/{TICKER}/` containing:

```
models/NABIL/
├── model.pt              # PyTorch state dict
├── scaler_feature.pkl    # RobustScaler for 11 input features
├── scaler_target.pkl     # RobustScaler for close target
├── metadata.json         # Training metadata
└── predictions.png       # Generated on train & evaluate
```

`metadata.json` contents:

```json
{
  "ticker": "NABIL",
  "date_created": "2026-06-11T15:37:03Z",
  "accuracy": {
    "mae": 15.39,
    "mape": 3.0,
    "r2": -0.57,
    "rmse": 18.33,
    "direction_accuracy": 47.7
  },
  "n_features": 11,
  "feature_cols": ["open","high","low","close","per_change","traded_quantity",
                    "ma_7","ma_21","volatility","price_range","day_of_week"],
  "training_rows": 1435,
  "seq_len": 60,
  "features": ["open","high","low","close","per_change","traded_quantity"],
  "engineered_features": ["ma_7","ma_21","volatility","price_range","day_of_week"],
  "date_range": { "start": "2020-01-02", "end": "2026-05-15" },
  "split_sizes": { "train": 1004, "val": 215, "test": 216 },
  "training_time_sec": 42.5,
  "epochs_trained": 87,
  "best_val_loss": 0.003421
}
```

The backend reads `date_created` to compute the `stale` flag. The training pipeline writes this file when it finishes.

### 4.2.1 CLI — `python -m backend`

The backend includes a CLI for training, inference, and evaluation without needing the FastAPI server:

```bash
# Train a model (runs evaluation + saves predictions.png automatically)
python -m backend train --stock NABIL [--epochs 150] [--patience 15]

# Recursive N-day prediction with circuit breaker cap
python -m backend predict --stock NABIL [--days 5]

# Re-evaluate a trained model on the test set (regenerates predictions.png)
python -m backend evaluate --stock NABIL
```

### 4.2.2 Circuit Breaker

NEPSE enforces a +/-15% daily price movement limit. This is applied as a post-processing step:

- **During inference**: each recursive prediction is clamped to +/-15% of the previous day's close before being used as input for the next step.
- **During evaluation**: predictions are clamped before computing accuracy metrics. Both capped and raw metrics are reported for comparison.
- **During training**: gradients flow through unclamped predictions (clamping is non-differentiable). The cap is only applied when computing test-set metrics.

### 4.3 API Endpoints

All timestamps use Nepal Standard Time (UTC+5:45).

#### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server status, ticker count, model count |

#### Auth (backend-only — proxies to Supabase Auth) `(DONE)`

| Method | Endpoint | Auth? | Body | Description |
|--------|----------|-------|------|-------------|
| `POST` | `/api/auth/signup` | No | `{full_name, email, password}` | Create account |
| `POST` | `/api/auth/login` | No | `{email, password}` | Sign in, returns tokens |
| `POST` | `/api/auth/refresh` | No | `{refresh_token}` | Refresh an expired access token |
| `GET` | `/api/auth/me` | Yes | — | Get current user profile |

**Signup flow**:
1. Validate input: all three fields required, password ≥ 6 chars.
2. Call `supabase.auth.sign_up(email=email, password=password, options={"data": {"full_name": full_name}})`.
3. The DB trigger `handle_new_user()` auto-creates the `profiles` row.
4. Return: `{user: {id, email, full_name}, access_token, refresh_token}`.
5. On failure (e.g. email already registered): return HTTP 400 with Supabase's error message.

**Signup response**:

```json
{
  "user": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com",
    "full_name": "Ram Shrestha"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "v1.MjU2..."
}
```

**Login flow**:
1. Call `supabase.auth.sign_in_with_password(email=email, password=password)`.
2. Return: `{user: {id, email, full_name}, access_token, refresh_token}`.
3. On failure (wrong credentials): return HTTP 401 with `{"error": "Invalid email or password"}`.

**Login response**: same shape as signup response.

**Refresh flow**:
1. Call `supabase.auth.refresh_session(refresh_token)`.
2. Return: `{access_token, refresh_token}` (new pair).
3. On failure (expired or invalid refresh token): return HTTP 401.

**Me flow**:
1. Uses `get_current_user` dependency to extract `user_id` from the JWT.
2. Queries `profiles` table for `full_name` and `email`.
3. Return: `{id, email, full_name}`.

#### Stocks (data from CSVs)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stocks` | List all tickers with latest price, change, volume |
| `GET` | `/api/stocks/{ticker}` | Full historical data for a stock (all rows) |
| `GET` | `/api/stocks/{ticker}/ohlc` | OHLC data with optional `?from=&to=` date filtering |
| `GET` | `/api/stocks/{ticker}/summary` | Latest price, 52-week high/low, average volume |
| `GET` | `/api/stocks/{ticker}/indicators` | RSI, MACD, Bollinger Bands, EMA (latest values) |

Data is cached in memory on first access (dict keyed by ticker). The cache is invalidated when a model is retrained.

#### Models

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/models` | List all trained models with metadata and staleness flag |
| `GET` | `/api/model_status/{ticker}` | Per-stock model status: `trained`, `training`, or `not_available` |

#### Predictions (recursive next-day inference)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/predictions/{ticker}?days=5` | N-day forecast (default 5, max 14) |

Validation order:
1. Check stock CSV exists in `data/` (404 if not)
2. Check trained model exists in `models/` (404 if not)

**Response**:

```json
{
  "ticker": "NABIL",
  "model_available": true,
  "trained_on": "2026-06-11T22:05:40+05:45",
  "stale": false,
  "predictions": [
    { "day": 1, "date": "2026-05-18", "price": 534.14, "change_pct": 1.36 },
    { "day": 2, "date": "2026-05-19", "price": 534.21, "change_pct": 0.01 },
    { "day": 3, "date": "2026-05-20", "price": 533.71, "change_pct": -0.09 }
  ],
  "model_accuracy": 0.97,
  "generated_at": "2026-06-11T22:10:00+05:45"
}
```

#### Portfolio (authenticated — requires JWT) `(DONE)`

All portfolio endpoints require the `Authorization: Bearer <access_token>` header. The `get_current_user` dependency extracts the `user_id` from the JWT and scopes all queries to that user.

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/portfolio` | — | Fetch all holdings for the authenticated user |
| `POST` | `/api/portfolio` | `{ticker, quantity, entry_price}` | Add stock (or merge via weighted average if already held) |
| `DELETE` | `/api/portfolio/{ticker}` | — | Remove a stock from portfolio |

**GET `/api/portfolio`** response:

```json
{
  "holdings": [
    {
      "ticker": "NABIL",
      "quantity": 15,
      "entry_price": 533.33,
      "current_price": 540.00,
      "pnl": 100.05,
      "pnl_percent": 1.25,
      "added_at": "2026-06-12T10:30:00+05:45"
    },
    {
      "ticker": "NMB",
      "quantity": 20,
      "entry_price": 310.00,
      "current_price": 305.50,
      "pnl": -90.00,
      "pnl_percent": -1.45,
      "added_at": "2026-06-11T14:00:00+05:45"
    }
  ]
}
```

For each holding, the backend:
1. Reads the stock's latest close price from the data cache (`app_state.get_stock_data(ticker)`).
2. Computes `current_price` = latest close, `pnl` = `(current_price - entry_price) * quantity`, `pnl_percent` = `((current_price - entry_price) / entry_price) * 100`.

**POST `/api/portfolio`** — weighted-average upsert:

Request body: `{"ticker": "NABIL", "quantity": 5, "entry_price": 600.00}`

Logic:
1. Validate that `ticker` exists in `app_state.available_tickers` → 404 if not.
2. Query the `portfolio` table: does this user already hold this ticker?
3. **If no existing holding**: INSERT a new row.
4. **If existing holding**: compute weighted average and UPDATE:
   - `new_quantity = old_quantity + incoming_quantity`
   - `new_entry_price = (old_quantity × old_price + incoming_quantity × incoming_price) / new_quantity`
   - UPDATE the row with `new_quantity` and `new_entry_price`.
5. Return the created/updated row.

**Weighted-average example**:
- User holds 10 NABIL @ Rs 500.
- User adds 5 NABIL @ Rs 600.
- Result: **15 NABIL @ Rs 533.33** `((10×500 + 5×600) / 15)`.
- This matches real brokerage behavior (average cost basis).

**DELETE `/api/portfolio/{ticker}`**:
1. Delete from `portfolio` where `user_id` matches and `ticker` matches.
2. Return 200 on success, 404 if no row found.

#### Train

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/train` | Train/retrain a stock's model |

**Request body**: `{"stock_name": "NABIL"}`

Validation order:
1. Check stock CSV exists in `data/` (404 if not)
2. Check no training already in progress for this ticker (409 if busy)
3. Load and preprocess data, verify >= 500 usable rows (400 if insufficient)

Training runs in a background thread via `asyncio.to_thread` so the server stays responsive. The HTTP response is returned when training completes. Multiple stocks can train concurrently.

**Response** (returned after training finishes):

```json
{
  "ticker": "NABIL",
  "status": "completed",
  "metrics": {"MAE": 15.39, "RMSE": 18.33, "MAPE": 3.0, "R2": -0.57, "Direction_Accuracy": 47.74},
  "training_time_sec": 42.5,
  "epochs_trained": 87,
  "date_created": "2026-06-11T22:05:40+05:45"
}
```

#### Error responses

All errors return JSON with `error` and `ticker` fields (where applicable):

| Code | Error | When |
|------|-------|------|
| 400 | `InsufficientDataError` | < 500 usable rows after preprocessing |
| 400 | Validation error | Missing/invalid signup or login fields |
| 401 | `Unauthorized` | Missing, invalid, or expired JWT |
| 401 | `Invalid credentials` | Wrong email or password on login |
| 404 | `StockNotFoundError` | Stock CSV not in `data/` |
| 404 | `ModelNotFoundError` | No trained model in `models/` |
| 404 | `Portfolio entry not found` | Trying to delete a stock not in portfolio |
| 409 | `TrainingInProgressError` | Training already running for this ticker |

### 4.4 Startup Lifecycle

```
App Startup
    -> Load .env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    -> Initialize Supabase Python client
    -> Scan data/ for available CSV files -> build ticker list
    -> Scan models/ for directories with metadata.json -> build available models dict
    -> Load available models into memory: {ticker: (model, scaler, metadata)}
    -> Detect device (CUDA if available, else CPU)
    -> Server ready
```

### 4.5 Prediction Service — Recursive Inference Detail

```
predict(ticker, days=5):                    # backend/ml/inference.py
    1. Read last (60 + 21) rows from data/{ticker}.csv
    2. Apply preprocessing (feature engineering: MAs, volatility, etc.)
    3. window = preprocessed_data[-60:]     # shape: (60, 11)
    4. results = []
    5. for i in 1..days:
         input_tensor = window.unsqueeze(0) # (1, 60, 11)
         predicted_close = model(input_tensor)
         inverse-scale to get real price
         apply circuit breaker cap (+/-15% of prev_close)
         append to results
         build synthetic row: [open=prev_close, high=max, low=min,
                               close=capped, per_change=computed, volume=avg]
         recompute rolling features on updated window
    6. Return results with dates (skip weekends)
```

> Synthetic row heuristics are imperfect but acceptable for short horizons. Accuracy degrades beyond ~5 days.

### 4.6 Auth Dependency — `get_current_user` `(DONE)`

This is a FastAPI dependency injected into any endpoint that requires authentication.

**Location**: `backend/api/auth.py`

**Behavior**:
1. Read the `Authorization` header from the incoming request.
2. If missing or not in `Bearer <token>` format → raise HTTP 401 `{"error": "Missing or invalid authorization header"}`.
3. Extract the token string.
4. Call `supabase.auth.get_user(token)` using the service-role Supabase client.
5. If Supabase returns an error (expired, tampered, revoked) → raise HTTP 401 `{"error": "Invalid or expired token"}`.
6. Return `user.id` (UUID string) — this is the authenticated user's ID.

**Usage in routers**: any endpoint that needs auth adds `user_id: str = Depends(get_current_user)` to its signature.

---

## 5. Supabase Setup Guide `(DONE)`

This is a one-time manual setup. Follow every step in order.

### 5.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New Project**.
3. Choose your organization, name the project `nepai`, set a strong database password (save it somewhere), pick the nearest region.
4. Click **Create new project** and wait ~2 minutes for provisioning.

### 5.2 Collect API Credentials

1. In the Supabase dashboard, go to **Project Settings → API** (left sidebar, gear icon → API).
2. Copy these two values:

| Key | Label in dashboard | Where it goes |
|-----|-------------------|---------------|
| `SUPABASE_URL` | **Project URL** | `backend/.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (under "Project API keys", click "Reveal") | `backend/.env` |

3. Create the file `backend/.env`:
```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

4. Add `backend/.env` to `.gitignore`:
```
# in .gitignore at project root
backend/.env
```

### 5.3 Enable Email Auth Provider

1. In the Supabase dashboard, go to **Authentication → Providers** (left sidebar).
2. Click on **Email**.
3. Ensure **Enable Email provider** is toggled ON.
4. Set **Confirm email** to OFF (for development — turn ON in production).
5. Click **Save**.

### 5.4 Create Database Tables and Trigger

1. In the Supabase dashboard, go to **SQL Editor** (left sidebar).
2. Click **New query**.
3. Paste and run the following SQL blocks **one at a time, in this exact order**:

**Step 1 — Create `profiles` table:**

```sql
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Step 2 — Create `portfolio` table:**

```sql
CREATE TABLE portfolio (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticker      TEXT NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  entry_price NUMERIC(12,2) NOT NULL CHECK (entry_price > 0),
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ticker)
);

ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio"
  ON portfolio FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own portfolio"
  ON portfolio FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio"
  ON portfolio FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own portfolio"
  ON portfolio FOR DELETE
  USING (auth.uid() = user_id);
```

**Step 3 — Create auto-profile trigger:**

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### 5.5 Verify Setup

1. **Check tables**: Go to **Table Editor** in the Supabase dashboard. You should see `profiles` and `portfolio` tables.
2. **Check RLS**: Click on each table → **Policies** tab. You should see the policies created above.
3. **Check trigger**: Go to **Database → Triggers**. You should see `on_auth_user_created` on the `auth.users` table.

---

## 6. Backend Implementation Details `(DONE)`

### 6.1 New File: `backend/api/supabase_client.py` `(DONE)`

Purpose: Initialize and export a singleton Supabase Python client.

Responsibilities:
- Load `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `backend/.env` using `python-dotenv`.
- Call `create_client(url, key)` from the `supabase` Python package.
- Export the client as a module-level variable (e.g. `supabase_client`).
- If either env var is missing, raise a clear error at import time with instructions.

### 6.2 New File: `backend/api/auth.py` `(DONE)`

Purpose: FastAPI dependency that validates JWTs.

See [section 4.6](#46-auth-dependency--get_current_user) for full specification.

### 6.3 New File: `backend/api/routers/auth.py` `(DONE)`

Purpose: Auth endpoints that proxy to Supabase.

4 endpoints: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`.

See [section 4.3 → Auth](#auth-backend-only--proxies-to-supabase-auth) for full request/response contracts.

Pydantic models needed:
- `SignupRequest`: `full_name: str`, `email: str`, `password: str` (all required).
- `LoginRequest`: `email: str`, `password: str`.
- `RefreshRequest`: `refresh_token: str`.
- `AuthResponse`: `user: dict`, `access_token: str`, `refresh_token: str`.

### 6.4 New File: `backend/api/routers/portfolio.py` `(DONE)`

Purpose: Portfolio CRUD with weighted-average upsert.

3 endpoints: `GET /api/portfolio`, `POST /api/portfolio`, `DELETE /api/portfolio/{ticker}`.

See [section 4.3 → Portfolio](#portfolio-authenticated--requires-jwt) for full request/response contracts and the weighted-average algorithm.

Pydantic model needed:
- `AddStockRequest`: `ticker: str`, `quantity: int`, `entry_price: float`.

Important: All three endpoints use `user_id: str = Depends(get_current_user)`. The Supabase queries are made using the service-role client (bypasses RLS since we filter by `user_id` in the query itself). Alternatively, use the user's JWT to create a per-request client that respects RLS — either approach works, but service-role + explicit `user_id` filter is simpler.

### 6.5 Modify: `backend/api/main.py` `(DONE)`

Changes:
1. Import the two new routers: `from .routers.auth import router as auth_router` and `from .routers.portfolio import router as portfolio_router`.
2. Register them: `app.include_router(auth_router, prefix="/api")` and `app.include_router(portfolio_router, prefix="/api")`.
3. No other changes needed.

### 6.6 Modify: `backend/requirements.txt` `(DONE)`

Add two new lines:
```
supabase
python-dotenv
```

---

## 7. Data Pipeline — GitHub Actions

A cron workflow in `.github/workflows/data_scraper.yml` runs Mon-Fri (NEPSE trading days), 5 times between 13:00-17:00 UTC (18:45-22:45 NPT, after market close).

**What it does**:
1. Checks out the repo
2. Installs Python 3.11 + dependencies (requests, beautifulsoup4, pandas, lxml)
3. Runs `data_scraper/dailyscraper.py` — scrapes sharesansar.com's daily price table
4. For each existing CSV in `data/`, finds the matching ticker row and appends if the date is new
5. Commits and pushes the updated CSVs as `github-actions[bot]`

**No database writes.** The CSVs are the only data store for stock prices. The backend reads them directly.

The scraper uses `pathlib.Path.stem` for cross-platform symbol extraction, and wraps HTML in `StringIO` for pandas compatibility.

---

## 8. Frontend Changes Needed

### 8.1 Hook rewiring `(TO BE IMPLEMENTED)`

| Hook | Current source | Target source |
|------|---------------|---------------|
| `useStockData` | `mockData.ts → getOHLC()` (CSV parsing in browser) | `api.ts → stockAPI.getOHLC()` |
| `usePrediction` | `mockData.ts → generateMockPrediction()` (random) | `api.ts → predictionAPI.getPrediction()` |
| `usePortfolio` | `localStorage` | `api.ts → portfolioAPI.getPortfolio()` |

### 8.2 Store rewiring `(TO BE IMPLEMENTED)`

| Store | Current source | Target source |
|-------|---------------|---------------|
| `stockStore.loadTickers` | `mockData.ts → getTickers()` (CSV) | `api.ts → stockAPI.listTickers()` |
| `portfolioStore` | `localStorage` | `api.ts → portfolioAPI.*` |

### 8.3 `api.ts` — already defined, needs auth interceptor `(TO BE IMPLEMENTED)`

```
stockAPI.listTickers()        → GET /api/stocks
stockAPI.getOHLC(ticker)      → GET /api/stocks/{ticker}/ohlc
stockAPI.getIndicators()      → GET /api/stocks/{ticker}/indicators
stockAPI.getSummary()         → GET /api/stocks/{ticker}/summary
predictionAPI.getPrediction() → GET /api/predictions/{ticker}
trainAPI.train(stock_name)    → POST /api/train                  (DONE)
portfolioAPI.getPortfolio()   → GET /api/portfolio               (DONE)
portfolioAPI.addStock()       → POST /api/portfolio              (DONE)
portfolioAPI.removeStock()    → DELETE /api/portfolio/{ticker}    (DONE)
```

Modifications needed:
- Add Axios **request interceptor**: reads access token from `authStore`, attaches `Authorization: Bearer <token>` to every request.
- Add Axios **response interceptor**: catches 401 errors, calls `/api/auth/refresh` with the stored refresh token, retries the original request once with the new access token. If refresh also fails, call `authStore.signOut()` to clear state and redirect to `/login`.

Vite proxy already configured (`/api → localhost:8000`).

### 8.4 Prediction response shape update `(TO BE IMPLEMENTED)`

```typescript
interface Prediction {
  ticker: string;
  model_available: boolean;
  trained_on: string | null;     // ISO timestamp from metadata.json
  stale: boolean;                // true if trained_on > 7 days ago
  predictions: {
    day: number;
    date: string;
    price: number;
  }[];
  model_accuracy: number;
  generated_at: string;
}
```

### 8.5 `AIPrediction` card updates `(TO BE IMPLEMENTED)`

Three states:

**State 1 — Fresh model** (`model_available: true, stale: false`):
- 5-row prediction list (Day 1 "Tomorrow" through Day 5 "1-Week") with prices and % change
- "Trained on: June 4, 2026" subtitle
- No retrain button

**State 2 — Stale model** (`model_available: true, stale: true`):
- Show predictions normally
- Warning badge: "Model is X days old"
- **"Retrain Model"** button → `POST /api/train {stock_name: ticker}`
- After click: disable button, show "Training in progress..."

**State 3 — No model** (`model_available: false`):
- "No trained model for {ticker}"
- **"Train Model"** button (same endpoint)

### 8.6 `api.ts` additions (DONE)

```typescript
export const trainAPI = {
  train: (stock_name: string) => api.post('/train', { stock_name }),
  status: (ticker: string) => api.get(`/train/status/${ticker}`),
};

export const modelAPI = {
  list: () => api.get('/models'),
};

export const portfolioAPI = {
  getPortfolio: () => api.get('/portfolio'),
  addStock: (data: { ticker: string; quantity: number; entry_price: number }) =>
    api.post('/portfolio', data),
  removeStock: (ticker: string) => api.delete(`/portfolio/${ticker}`),
  getSummary: () => api.get('/portfolio/summary'),
};
```

### 8.7 Wire unused components `(TO BE IMPLEMENTED)`

| Component | Wire to |
|-----------|---------|
| `IndicatorOverlay` | Real indicator data from `/api/stocks/{ticker}/indicators` |
| `PredictionLine` | Real prediction line on the candlestick chart |
| `TechnicalIndicators` card | Currently receives `indicators={null}`. Pass real data |

### 8.8 Remove after backend is live `(TO BE IMPLEMENTED)`

| File/Code | Reason |
|-----------|--------|
| `frontend/public/data/*.csv` (124 files) | Data served by backend from `data/` |
| `frontend/public/data/tickers.json` | Ticker list comes from backend |
| `frontend/src/services/mockData.ts` | Replaced by `api.ts` |
| `frontend/src/utils/csvParser.ts` | No more client-side CSV parsing |

### 8.9 Frontend changes for auth & portfolio (implementation order) `(TO BE IMPLEMENTED)`

Each item below is one discrete task. Implement in this exact order:

1. Create `frontend/src/store/authStore.ts` — Zustand store managing `user`, `accessToken`, `refreshToken`, `loading`, and methods: `signUp(fullName, email, password)` → `POST /api/auth/signup`, `signIn(email, password)` → `POST /api/auth/login`, `signOut()` → clear tokens + redirect, `initialize()` → calls `/api/auth/me` with stored token on app load, `refreshSession()` → calls `/api/auth/refresh`. Persist `accessToken` and `refreshToken` in `localStorage`.
2. Modify `frontend/src/services/api.ts` — add Axios request interceptor (attach Bearer token) and response interceptor (401 → refresh → retry).
3. Create `frontend/src/pages/Login.tsx` — single page with two tabs: **Login** (email + password) and **Sign Up** (full name + email + password), form validation, error display, calls `authStore.signIn` / `authStore.signUp`, redirects to `/` on success.
4. Create `frontend/src/components/layout/ProtectedRoute.tsx` — wrapper that checks `authStore.user`; redirects to `/login` if unauthenticated, shows spinner while `authStore.initialize()` resolves.
5. Modify `frontend/src/App.tsx` — add `/login` route, wrap existing routes with `ProtectedRoute`, call `authStore.initialize()` on mount.
6. Modify `frontend/src/components/layout/Sidebar.tsx` — add user display (name/email) at the bottom and a "Sign Out" button.
7. Modify `frontend/src/store/portfolioStore.ts` — replace all `localStorage` reads/writes with calls to `portfolioAPI`: `getPortfolio()`, `addStock()`, `removeStock()`.
8. Modify `frontend/src/hooks/usePortfolio.ts` — replace `localStorage` reads with a call to `portfolioAPI.getPortfolio()`.

---

## 9. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript, Vite, TradingView Lightweight Charts, Zustand, Axios, Tailwind CSS 4 |
| Backend API | FastAPI, pandas, pandas-ta, supabase (Python client), python-dotenv |
| ML Pipeline | PyTorch, scikit-learn (RobustScaler), matplotlib |
| Auth | Supabase Auth (email/password), JWT tokens |
| Database | Supabase PostgreSQL (profiles + portfolio tables, RLS) |
| Storage | Filesystem — CSVs for stock data, directories for models |
| Data Pipeline | GitHub Actions cron -> existing scraper -> CSV commit |

---

## 10. Implementation Order

| # | Task | Status |
|---|------|--------|
| 1 | **ML pipeline** -- model architecture, training, evaluation, inference, storage, circuit breaker, plotting | DONE |
| 2 | **CLI** -- `python -m backend train/predict/evaluate/serve` | DONE |
| 3 | **Backend skeleton** -- FastAPI app, config, CORS, health check, error handlers, startup lifecycle | DONE |
| 4 | **Stock endpoints** -- `/api/stocks`, `/api/stocks/{ticker}`, `/ohlc`, `/summary` with data caching | DONE |
| 5 | **Prediction endpoint** -- `/api/predictions/{ticker}` with model-exists + stock-exists validation | DONE |
| 6 | **Indicator endpoint** -- `/api/stocks/{ticker}/indicators` (RSI, MACD, Bollinger, EMA via pandas) | DONE |
| 7 | **Train endpoint** -- `POST /api/train` with stock-exists + min-rows validation, threaded training | DONE |
| 8 | **Models endpoint** -- `/api/models` returning trained model metadata + staleness | DONE |
| 8b | **Model status endpoint** -- `/api/model_status/{ticker}` per-stock status, date_created, staleness | DONE |
| 9 | **Supabase setup** -- create project, collect credentials, enable email auth, run SQL for tables + trigger + RLS | DONE |
| 10 | **Backend: Supabase client** -- `backend/api/supabase_client.py`, load .env, init client | DONE |
| 11 | **Backend: Auth dependency** -- `backend/api/auth.py`, `get_current_user` JWT verification | DONE |
| 12 | **Backend: Auth endpoints** -- `backend/api/routers/auth.py`, signup/login/refresh/me | DONE |
| 13 | **Backend: Portfolio endpoints** -- `backend/api/routers/portfolio.py`, CRUD with weighted-average upsert | DONE |
| 14 | **Backend: Register routers** -- add auth + portfolio routers to `main.py` | DONE |
| 15 | **Frontend: Auth store** -- `authStore.ts` with signIn/signUp/signOut/initialize/refresh | TODO |
| 16 | **Frontend: API interceptor** -- attach Bearer token, auto-refresh on 401 | TODO |
| 17 | **Frontend: Login page** -- `Login.tsx` with login/signup tabs | TODO |
| 18 | **Frontend: Protected routes** -- `ProtectedRoute.tsx` + wrap routes in `App.tsx` | TODO |
| 19 | **Frontend: Sidebar user info** -- display name, sign out button | TODO |
| 20 | **Frontend: Portfolio rewire** -- `portfolioStore.ts` + `usePortfolio.ts` → API calls instead of localStorage | TODO |
| 21 | **Frontend rewire** -- Switch hooks/stores from mockData -> api.ts | TODO |
| 22 | **Update Prediction UI** -- `AIPrediction` card with 5-day format + stale warning + retrain button | TODO |
| 23 | **Wire unused components** -- `IndicatorOverlay`, `PredictionLine`, `TechnicalIndicators` | TODO |
| 24 | **GitHub Actions workflow** -- `.github/workflows/data_scraper.yml` running `data_scraper/dailyscraper.py` | DONE |
| 25 | **Cleanup** -- Remove `frontend/public/data/`, mockData.ts, csvParser.ts | TODO |
