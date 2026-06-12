# NepAI

LSTM-based stock price prediction dashboard for NEPSE (Nepal Stock Exchange).

Reads daily OHLC data from CSV files, trains per-stock LSTM models with attention,
and serves recursive multi-day forecasts through a FastAPI backend + React frontend.

## Project Structure

```
NepAI/
  .github/workflows/
    data_scraper.yml   GitHub Actions cron (Mon-Fri, scrapes NEPSE prices)
  data/                124 stock CSVs (updated daily by GitHub Actions)
  data_scraper/
    dailyscraper.py    Scrapes sharesansar.com, appends to data/ CSVs
    requirements.txt   pandas, requests, lxml, beautifulsoup4
  models/              Trained model artifacts (one directory per stock)
    {TICKER}/
      model.pt           PyTorch state dict
      scaler_feature.pkl RobustScaler for 11 input features
      scaler_target.pkl  RobustScaler for close target
      metadata.json      Training metadata + accuracy metrics
      predictions.png    Predicted-vs-actual plot
  backend/             Python package (FastAPI + ML pipeline)
    __main__.py        CLI: train, predict, evaluate, serve
    config.py          Paths, hyperparameters, feature lists
    ml/                ML pipeline (model, training, inference, evaluation)
    api/               FastAPI server (routers, state, error handling)
  frontend/            React + Vite dashboard
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
```

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

Opens at `http://localhost:5173`. The Vite proxy forwards `/api` requests to the backend.

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

### GET /health

Server status check. No parameters.

```
GET /api/health
```

```json
{"status": "ok", "tickers": 124, "models": 2}
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
    "latest_close": 527.0,
    "change": 1.5,
    "volume": 50000,
    "latest_date": "2026-05-15"
  },
  {
    "ticker": "ADBL",
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
  "model_status": "trained",
  "date_created": "2026-06-11T22:05:40+05:45",
  "stale": false
}
```

**Training in progress** (`model_status: "training"`):

```json
{
  "ticker": "NABIL",
  "model_status": "training",
  "date_created": null,
  "stale": null
}
```

**No model** (`model_status: "not_available"`):

```json
{
  "ticker": "ADBL",
  "model_status": "not_available",
  "date_created": null,
  "stale": null
}
```

**Stock not found** (404 — ticker doesn't exist in `data/`):

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

### Error Responses

All errors return JSON with `error` and `ticker` fields:

| Code | Error | When |
|------|-------|------|
| 404 | Stock not found | Stock CSV missing from `data/` |
| 404 | Model not found | No trained model in `models/` |
| 400 | Insufficient data | < 500 usable rows after preprocessing |
| 409 | Training in progress | Training already running for this ticker |

Example:

```json
{"error": "Stock 'ZZZZZ' not found in data", "ticker": "ZZZZZ"}
```

## Model Architecture

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
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, TradingView Charts, Zustand, Axios, Tailwind CSS 4 |
| Backend API | FastAPI, pandas |
| ML Pipeline | PyTorch, scikit-learn, matplotlib |
| Storage | Filesystem (CSVs for data, directories for models) |
| Data Pipeline | GitHub Actions cron (Mon-Fri) + `data_scraper/dailyscraper.py` |
