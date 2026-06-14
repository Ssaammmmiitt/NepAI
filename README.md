# NepAI

LSTM-based stock price prediction dashboard for NEPSE (Nepal Stock Exchange).

Reads daily OHLC data from CSV files, trains per-stock LSTM models with attention,
and serves recursive multi-day forecasts through a FastAPI backend + React frontend.

> **Full project report:** [report.md](report.md) — architecture, backend, frontend, ML pipeline, model metrics, and screenshots.

## Features

- **585 NEPSE stocks** with daily OHLC data, company names, and sector metadata
- **9 pre-trained LSTM models** with on-demand training for any stock with sufficient history
- **Recursive multi-day forecasts** (1–14 days) with NEPSE circuit-breaker constraints
- **Interactive dashboard** — market overview, gainers/losers pages, sortable ticker table, stock search
- **Stock detail page** — candlestick + volume charts, prediction/indicator overlays, AI forecast, technical indicators, tabbed history view with line chart and data table
- **Portfolio tracking** — add/remove holdings, live P&L, weighted-average entry price merge
- **User authentication** — email/password signup and login via Supabase (proxied through backend)
- **Automated data pipeline** — GitHub Actions scrapes NEPSE prices Mon–Fri at 18:00 NPT

## Project Structure

```
NepAI/
  .github/workflows/
    data_scraper.yml   GitHub Actions cron (Mon-Fri 18:00 NPT, runs scrape_nepse.py)
  data/
    companies/         585 stock CSVs (updated daily by GitHub Actions)
    metadata/
      name_data.json       Ticker → full company name + sector ID
      sector_mappings.json Sector ID → human-readable sector label
  data_scraper/
    scrape_nepse.py    Scrapes ShareSansar daily prices, appends to data/companies/
    scrape_details.py  Fetches company name + sector for new tickers
    requirements.txt   pandas, beautifulsoup4, selenium, lxml
  models/              Trained model artifacts (9 models; one directory per stock)
    {TICKER}/          ACLBSL, AKPL, ALICL, HDHPC, NABIL, SBI, SCB, SLICL, UNL
      model.pt           PyTorch state dict
      scaler_feature.pkl RobustScaler for 11 input features
      scaler_target.pkl  RobustScaler for close target
      metadata.json      Training metadata + accuracy metrics
      predictions.png    Predicted-vs-actual plot
  testing_results/     ML experiment outputs (hyperparameter tuning benchmarks)
  nepai-lstm-train.ipynb  Research notebook for model experimentation
  backend/             Python package (FastAPI + ML pipeline)
    __main__.py        CLI: train, predict, evaluate, serve
    config.py          Paths, hyperparameters, feature lists
    ml/                ML pipeline (model, training, inference, evaluation)
    api/               FastAPI server (routers, state, error handling)
      metadata.py      Stock metadata lookup (names + sectors from JSONs)
  frontend/            React + Vite dashboard (see frontend/FEATURES.md)
  report.md            Full project report (architecture, ML, screenshots)
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ (for the frontend)
- Git

### Installation

```bash
git clone <repository-url>
cd NepAI

# Backend
pip install -r backend/requirements.txt

# Frontend
cd frontend
npm install
cp .env.example .env
```

### Environment Variables

#### Backend

The backend requires a `.env` file for Supabase credentials (used by auth and portfolio features). A template is provided at `backend/.env.example`:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Copy it and fill in your values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxxxxxxxxxx.supabase.co`) | Supabase Dashboard → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role secret key (full admin access, **never expose publicly**) | Supabase Dashboard → Project Settings → API → `service_role` key |

> **Note:** The `backend/.env` file is git-ignored. Never commit real credentials. Stock data, ML training, and prediction endpoints work without these variables — only auth (`/auth/*`) and portfolio (`/portfolio`) endpoints require them.

#### Frontend

The frontend uses [Vite environment variables](https://vite.dev/guide/env-and-mode.html). Copy the template and adjust for your environment:

```bash
cd frontend
cp .env.example .env
```

| Variable | Exposed to browser | Description |
|----------|-------------------|-------------|
| `VITE_API_URL` | Yes | Axios API base URL. Default `/api` for local dev (Vite proxies to the backend). |
| `DEV_API_PROXY` | No (dev server only) | Backend URL for Vite's `/api` proxy. Default `http://localhost:8000`. |

**Local development** (defaults in `.env.example`):

```env
VITE_API_URL=/api
DEV_API_PROXY=http://localhost:8000
```

**Production / hosting** — set `VITE_API_URL` to your deployed API before building:

```bash
# Option A: same-origin reverse proxy (nginx routes /api → FastAPI)
VITE_API_URL=/api npm run build

# Option B: separate API host
VITE_API_URL=https://api.yourdomain.com/api npm run build
```

Or create a `.env.production` file in `frontend/` (also git-ignored if named `.env.production.local`):

```env
VITE_API_URL=https://api.yourdomain.com/api
```

Then run `npm run build` — Vite inlines `VITE_*` values at build time. Serve the `frontend/dist/` folder with any static host (Vercel, Netlify, nginx, etc.).

> **Note:** `frontend/.env` is git-ignored. Only commit `frontend/.env.example`. Never put secrets in `VITE_` variables — they are embedded in the client bundle.

### Running

**Backend (API server):**

```bash
python -m backend serve
```

Server starts at `http://localhost:8000`. Options:

```bash
python -m backend serve --port 9000      # custom port
python -m backend serve --reload         # auto-reload on code changes
```

**Frontend (dev server):**

```bash
cd frontend
npm run dev
```

Opens at `http://localhost:5173`. The Vite proxy forwards `/api` requests to the backend (configurable via `DEV_API_PROXY` in `frontend/.env`).

**Frontend production build:**

```bash
cd frontend
cp .env.example .env          # or set VITE_API_URL for your hosted API
npm run build                 # output in frontend/dist/
npm run preview               # local preview of production build
```

**Frontend tests:**

```bash
cd frontend
npm run test:run    # single run (CI)
npm test            # watch mode
```

See `frontend/FEATURES.md` for a full list of implemented UI features (gainers/losers pages, stock metadata tooltips, chart/history tabs, portfolio management, and more).

### CLI Commands

```bash
python -m backend train    --stock NABIL                    # train a model
python -m backend train    --stock NABIL --epochs 50        # custom epochs
python -m backend predict  --stock NABIL --days 7           # N-day forecast
python -m backend evaluate --stock NABIL                    # re-evaluate on test set
python -m backend serve                                     # start API server
```

## Backend API

Base URL: `http://localhost:8000/api`

All timestamps use Nepal Standard Time (UTC+5:45).

All endpoints that return a `ticker` also include `stock_name` (full company name) and `stock_sector` (human-readable sector label), resolved from `data/metadata/name_data.json` and `data/metadata/sector_mappings.json`.

### GET /health

Server status check. No parameters.

```
GET /api/health
```

```json
{"status": "ok", "tickers": 585, "models": 9}
```

### GET /stocks

List all tickers with latest price. No parameters.

```
GET /api/stocks
```

```json
[
  {
    "ticker": "NABIL",
    "stock_name": "Nabil Bank Limited",
    "stock_sector": "Commercial Bank",
    "latest_close": 527.0,
    "change": 1.5,
    "volume": 50000,
    "latest_date": "2026-05-15"
  },
  {
    "ticker": "ADBL",
    "stock_name": "Agricultural Development Bank Limited",
    "stock_sector": "Commercial Bank",
    "latest_close": 310.2,
    "change": 0.39,
    "volume": 27571,
    "latest_date": "2026-05-15"
  }
]
```

### GET /stocks/{ticker}

Full historical data for a stock.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| ticker | path | yes | Stock symbol, case-insensitive |

```
GET /api/stocks/NABIL
```

```json
{
  "ticker": "NABIL",
  "stock_name": "Nabil Bank Limited",
  "stock_sector": "Commercial Bank",
  "total_rows": 3427,
  "data": [
    {"date": "2020-01-01", "open": 900.0, "high": 910.0, "low": 895.0,
     "close": 905.0, "volume": 12000, "per_change": 0.55},
    {"date": "2020-01-02", "open": 905.0, "high": 912.0, "low": 900.0,
     "close": 908.0, "volume": 15000, "per_change": 0.33}
  ]
}
```

### GET /stocks/{ticker}/ohlc

OHLC data with optional date range filtering. Returns an array of rows directly.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| ticker | path | yes | Stock symbol |
| from | query | no | Start date inclusive (YYYY-MM-DD) |
| to | query | no | End date inclusive (YYYY-MM-DD) |

```
GET /api/stocks/NABIL/ohlc?from=2026-01-01&to=2026-01-07
```

```json
[
  {"date": "2026-01-01", "open": 495.0, "high": 496.0, "low": 490.0,
   "close": 492.0, "volume": 35796, "per_change": -0.95},
  {"date": "2026-01-04", "open": 491.5, "high": 495.0, "low": 488.1,
   "close": 490.3, "volume": 44294, "per_change": -0.35}
]
```

Without date params, returns all rows:

```
GET /api/stocks/NABIL/ohlc
```

### GET /stocks/{ticker}/summary

Latest price, 52-week high/low, average volume.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| ticker | path | yes | Stock symbol |

```
GET /api/stocks/NABIL/summary
```

```json
{
  "ticker": "NABIL",
  "stock_name": "Nabil Bank Limited",
  "stock_sector": "Commercial Bank",
  "latest_close": 527.0,
  "change": 0.0,
  "high_52w": 562.0,
  "low_52w": 471.0,
  "avg_volume": 62321,
  "latest_date": "2026-05-15",
  "total_rows": 3427
}
```

### GET /stocks/{ticker}/indicators

Latest technical indicator values (RSI-14, MACD-12/26/9, Bollinger-20/2, EMA-20/50).

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| ticker | path | yes | Stock symbol |

```
GET /api/stocks/NABIL/indicators
```

```json
{
  "ticker": "NABIL",
  "stock_name": "Nabil Bank Limited",
  "stock_sector": "Commercial Bank",
  "rsi": 69.4,
  "macd": {"macd": 0.7, "signal": 0.41, "histogram": 0.29},
  "bollinger": {"upper": 531.27, "middle": 524.58, "lower": 517.88},
  "ema": {"ema20": 525.11, "ema50": 521.91}
}
```

### GET /predictions/{ticker}

Recursive N-day LSTM forecast. Requires a trained model for this ticker.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| ticker | path | yes | Stock symbol |
| days | query | no | Days to forecast, 1-14 (default: 5) |

```
GET /api/predictions/NABIL
GET /api/predictions/NABIL?days=3
GET /api/predictions/BPCL?days=10
```

```json
{
  "ticker": "NABIL",
  "stock_name": "Nabil Bank Limited",
  "stock_sector": "Commercial Bank",
  "model_available": true,
  "trained_on": "2026-06-11T22:05:40+05:45",
  "stale": false,
  "predictions": [
    {"day": 1, "date": "2026-05-18", "price": 534.14, "change_pct": 1.36},
    {"day": 2, "date": "2026-05-19", "price": 534.21, "change_pct": 0.01},
    {"day": 3, "date": "2026-05-20", "price": 533.71, "change_pct": -0.09}
  ],
  "model_accuracy": 0.97,
  "generated_at": "2026-06-11T22:10:00+05:45"
}
```

### GET /models

List all trained models with metadata and staleness (stale = trained > 7 days ago). No parameters.

```
GET /api/models
```

```json
[
  {
    "ticker": "NABIL",
    "stock_name": "Nabil Bank Limited",
    "stock_sector": "Commercial Bank",
    "date_created": "2026-06-11T22:05:40+05:45",
    "accuracy": {
      "mae": 15.39, "mape": 3.0, "r2": -0.57,
      "rmse": 18.33, "direction_accuracy": 47.74
    },
    "training_rows": 1435,
    "stale": false
  },
  {
    "ticker": "BPCL",
    "stock_name": "Butwal Power Company Limited",
    "stock_sector": "Hydropower",
    "date_created": "2026-06-11T21:27:11+05:45",
    "accuracy": {
      "mae": 106.96, "mape": 14.59, "r2": -5.42,
      "rmse": 108.57, "direction_accuracy": 49.03
    },
    "training_rows": 1434,
    "stale": false
  }
]
```

### GET /model_status/{ticker}

Model status for a single stock: whether a model is trained, currently training, or not available.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| ticker | path | yes | Stock symbol, case-insensitive |

```
GET /api/model_status/NABIL
```

**Trained model** (`model_status: "trained"`):

```json
{
  "ticker": "NABIL",
  "stock_name": "Nabil Bank Limited",
  "stock_sector": "Commercial Bank",
  "model_status": "trained",
  "date_created": "2026-06-11T22:05:40+05:45",
  "stale": false
}
```

**Training in progress** (`model_status: "training"`):

```json
{
  "ticker": "NABIL",
  "stock_name": "Nabil Bank Limited",
  "stock_sector": "Commercial Bank",
  "model_status": "training",
  "date_created": null,
  "stale": null
}
```

**No model** (`model_status: "not_available"`):

```json
{
  "ticker": "ADBL",
  "stock_name": "Agricultural Development Bank Limited",
  "stock_sector": "Commercial Bank",
  "model_status": "not_available",
  "date_created": null,
  "stale": null
}
```

**Stock not found** (404 — ticker doesn't exist in `data/companies/`):

```json
{"error": "Stock 'ZZZZZ' not found in data", "ticker": "ZZZZZ"}
```

### POST /train

Train or retrain a model. Request stays open until training completes.
Multiple stocks can train concurrently.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| stock_name | body (JSON) | yes | Stock symbol to train |

**Request:**

```
POST /api/train
Content-Type: application/json

{"stock_name": "NABIL"}
```

**Response (after training finishes):**

```json
{
  "ticker": "NABIL",
  "stock_name": "Nabil Bank Limited",
  "stock_sector": "Commercial Bank",
  "status": "completed",
  "metrics": {
    "MAE": 15.39, "RMSE": 18.33, "MAPE": 3.0,
    "R2": -0.57, "Direction_Accuracy": 47.74
  },
  "training_time_sec": 42.5,
  "epochs_trained": 87,
  "date_created": "2026-06-11T22:05:40+05:45"
}
```

### POST /auth/signup

Create a new user account. The backend proxies to Supabase Auth — the frontend never talks to Supabase directly.

```
POST /api/auth/signup
Content-Type: application/json

{"full_name": "Ram Shrestha", "email": "ram@example.com", "password": "securepass123"}
```

```json
{
  "user": {
    "id": "a1b2c3d4-...",
    "email": "ram@example.com",
    "full_name": "Ram Shrestha"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "v1.MjU2..."
}
```

Validation: `full_name`, `email`, and `password` are all required. Password must be ≥ 6 characters. Returns 400 if email is already registered.

### POST /auth/login

Sign in with email and password.

```
POST /api/auth/login
Content-Type: application/json

{"email": "ram@example.com", "password": "securepass123"}
```

Response: same shape as signup. Returns 401 if credentials are wrong.

### POST /auth/refresh

Exchange a refresh token for a new access + refresh token pair.

```
POST /api/auth/refresh
Content-Type: application/json

{"refresh_token": "v1.MjU2..."}
```

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "v1.Yzdk..."
}
```

Returns 401 if the refresh token is expired or invalid.

### GET /auth/me

Get the authenticated user's profile. Requires `Authorization: Bearer <access_token>` header.

```
GET /api/auth/me
Authorization: Bearer <access_token>
```

```json
{
  "id": "a1b2c3d4-...",
  "email": "ram@example.com",
  "full_name": "Ram Shrestha"
}
```

### GET /portfolio

Fetch all holdings for the authenticated user. Requires `Authorization: Bearer <access_token>` header.

```
GET /api/portfolio
Authorization: Bearer <access_token>
```

```json
{
  "holdings": [
    {
      "ticker": "NABIL",
      "stock_name": "Nabil Bank Limited",
      "stock_sector": "Commercial Bank",
      "quantity": 15,
      "entry_price": 533.33,
      "current_price": 540.00,
      "pnl": 100.05,
      "pnl_percent": 1.25,
      "added_at": "2026-06-12T10:30:00+05:45"
    }
  ]
}
```

For each holding, `current_price` is the latest close from the stock CSV, and `pnl`/`pnl_percent` are computed in real time.

### POST /portfolio

Add a stock to the portfolio. If the user already holds the same ticker, a weighted-average merge is performed (matching real brokerage behavior).

```
POST /api/portfolio
Authorization: Bearer <access_token>
Content-Type: application/json

{"ticker": "NABIL", "quantity": 5, "entry_price": 600.00}
```

**New holding:**

```json
{
  "ticker": "NABIL",
  "stock_name": "Nabil Bank Limited",
  "stock_sector": "Commercial Bank",
  "quantity": 5,
  "entry_price": 600.00,
  "action": "created",
  "message": "Added 5 shares of NABIL @ Rs 600.00"
}
```

**Merged holding** (user already held 10 NABIL @ Rs 500):

```json
{
  "ticker": "NABIL",
  "stock_name": "Nabil Bank Limited",
  "stock_sector": "Commercial Bank",
  "quantity": 15,
  "entry_price": 533.33,
  "action": "merged",
  "message": "Merged with existing holding — now 15 shares @ Rs 533.33"
}
```

Weighted-average formula: `new_price = (old_qty × old_price + new_qty × new_price) / total_qty`

### DELETE /portfolio/{ticker}

Remove a stock from the portfolio entirely.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| ticker | path | yes | Stock symbol, case-insensitive |

```
DELETE /api/portfolio/NABIL
Authorization: Bearer <access_token>
```

```json
{
  "ticker": "NABIL",
  "stock_name": "Nabil Bank Limited",
  "stock_sector": "Commercial Bank",
  "message": "Removed NABIL from portfolio"
}
```

Returns 404 if the ticker is not in the user's portfolio.

### Error Responses

All errors return JSON with `error` and `ticker` fields (where applicable):

| Code | Error | When |
|------|-------|------|
| 400 | Insufficient data | < 500 usable rows after preprocessing |
| 400 | Validation error | Missing/invalid signup or login fields |
| 401 | Unauthorized | Missing, invalid, or expired JWT |
| 401 | Invalid credentials | Wrong email or password on login |
| 404 | Stock not found | Stock CSV missing from `data/companies/` |
| 404 | Model not found | No trained model in `models/` |
| 404 | Portfolio entry not found | Trying to delete a stock not in portfolio |
| 409 | Training in progress | Training already running for this ticker |

Example:

```json
{"error": "Stock 'ZZZZZ' not found in data", "ticker": "ZZZZZ"}
```

## Model Architecture

### Trained models (9 tickers)

| Ticker | MAE | MAPE (%) | R² |
|--------|-----|----------|-----|
| ACLBSL | 16.99 | 1.75 | 0.454 |
| AKPL | 9.46 | 3.61 | 0.588 |
| ALICL | 12.55 | 2.70 | -0.385 |
| HDHPC | 7.15 | 3.25 | 0.840 |
| NABIL | 12.22 | 2.36 | -0.068 |
| SBI | 5.08 | 1.26 | 0.539 |
| SCB | 5.38 | 0.83 | 0.767 |
| SLICL | 53.51 | 13.27 | -2.860 |
| UNL | 433.21 | 0.93 | -0.609 |

See [report.md](report.md) for full model metrics, evaluation plots, and architecture details.

### Architecture specification

| Parameter | Value |
|-----------|-------|
| Architecture | StackedLSTM + Multi-Head Attention |
| Hidden size | 64 |
| LSTM layers | 2 |
| Attention heads | 4 |
| Dropout | 0.2 |
| Sequence length | 60 trading days |
| Input features | 11 (6 base + 5 engineered) |
| Target | Next-day close price |
| Scaler | RobustScaler (separate feature + target) |
| Circuit breaker | Predictions clamped to +/-15% of previous close (NEPSE daily limit) |

## Tech Stack

| Layer | Technology |
|-------|-----------:|
| Frontend | React 19, TypeScript, Vite, TradingView Lightweight Charts, Zustand, Axios, Tailwind CSS 4, GSAP |
| Testing | Vitest, Testing Library, jsdom |
| Backend API | FastAPI, pandas, supabase (Python client), python-dotenv |
| ML Pipeline | PyTorch, scikit-learn, matplotlib |
| Auth | Supabase Auth (email/password), JWT tokens |
| Database | Supabase PostgreSQL (profiles + portfolio tables, RLS) |
| Storage | Filesystem (CSVs for data, directories for models) |
| Data Pipeline | GitHub Actions cron (Mon-Fri, 18:00 NPT) + `data_scraper/scrape_nepse.py` |

## Documentation

| Document | Description |
|----------|-------------|
| [report.md](report.md) | Full project report — architecture, backend, frontend, ML, screenshots |
| [frontend/FEATURES.md](frontend/FEATURES.md) | Detailed frontend feature inventory |
| [implementation_plan.md](implementation_plan.md) | Implementation plan with Supabase schema and task tracker |

