# NepAI — Implementation Plan

> **LSTM-Based Stock Price Prediction for NEPSE**

---

## 1. Project Summary

NepAI is a single-user stock prediction dashboard that:

1. Reads **NEPSE OHLC data** from CSV files in `data/`, updated daily by a GitHub Actions workflow.
2. Serves **pre-trained LSTM predictions** via FastAPI. Each model predicts **next-day close only**. Multi-day forecasts are produced by running inference recursively.
3. Tracks **model freshness** via `metadata.json` in each model's directory — the frontend shows when it was trained and allows retraining if stale (>7 days).
4. Renders an **interactive dashboard** with candlestick charts, prediction cards, and portfolio tracking.

**No database.** All data lives on the filesystem — CSVs for stock data, directories for models.

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
│  Dashboard | StockDetail    │
│  Portfolio (localStorage)   │
│  TradingView Charts         │
│  Retrain button (if stale)  │
└──────────┬──────────────────┘
           │ HTTP/JSON (Vite proxy -> :8000)
┌──────────▼──────────────────┐
│  Backend (FastAPI + ML)     │
│  localhost:8000              │
│  ─────────────────────────  │
│  /api/stocks/*              │
│  /api/predictions/{ticker}  │
│  /api/train                 │
│  CLI: python -m backend     │
└──────┬──────────┬───────────┘
       │          │
┌──────▼────┐ ┌──▼──────────────────┐
│ CSV Files │ │ Model Dirs           │
│ data/     │ │ models/{TICKER}/     │
│ *.csv     │ │   model.pt           │
│           │ │   scaler_feature.pkl │
│           │ │   scaler_target.pkl  │
│           │ │   metadata.json      │
│           │ │   predictions.png    │
└───────────┘ └──────────────────────┘
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
│   ├── requirements.txt
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
│       ├── main.py                      # FastAPI entry, CORS, startup, health
│       ├── errors.py                    # Custom exceptions + HTTP error handlers
│       ├── state.py                     # App state: data cache, ticker registry, training tracker
│       └── routers/
│           ├── __init__.py
│           ├── stocks.py                # /api/stocks/* endpoints
│           ├── predictions.py           # /api/predictions/{ticker}
│           ├── train.py                 # POST /api/train endpoint
│           ├── models.py               # /api/models endpoint
│           └── model_status.py          # /api/model_status/{ticker} endpoint
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
└── frontend/                            # React app (already built)
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

All errors return JSON with `error` and `ticker` fields:

| Code | Error | When |
|------|-------|------|
| 404 | `StockNotFoundError` | Stock CSV not in `data/` |
| 404 | `ModelNotFoundError` | No trained model in `models/` |
| 400 | `InsufficientDataError` | < 500 usable rows after preprocessing |
| 409 | `TrainingInProgressError` | Training already running for this ticker |

### 4.4 Startup Lifecycle

```
App Startup
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

---

## 5. Data Pipeline — GitHub Actions

A cron workflow in `.github/workflows/data_scraper.yml` runs Mon-Fri (NEPSE trading days), 5 times between 13:00-17:00 UTC (18:45-22:45 NPT, after market close).

**What it does**:
1. Checks out the repo
2. Installs Python 3.11 + dependencies (requests, beautifulsoup4, pandas, lxml)
3. Runs `data_scraper/dailyscraper.py` — scrapes sharesansar.com's daily price table
4. For each existing CSV in `data/`, finds the matching ticker row and appends if the date is new
5. Commits and pushes the updated CSVs as `github-actions[bot]`

**No database writes.** The CSVs are the only data store. The backend reads them directly.

The scraper uses `pathlib.Path.stem` for cross-platform symbol extraction, and wraps HTML in `StringIO` for pandas compatibility.

---

## 6. Frontend Changes Needed

### 6.1 Hook rewiring

| Hook | Current source | Target source |
|------|---------------|---------------|
| `useStockData` | `mockData.ts → getOHLC()` (CSV parsing in browser) | `api.ts → stockAPI.getOHLC()` |
| `usePrediction` | `mockData.ts → generateMockPrediction()` (random) | `api.ts → predictionAPI.getPrediction()` |
| `usePortfolio` | `localStorage` | Keep as-is |

### 6.2 Store rewiring

| Store | Current source | Target source |
|-------|---------------|---------------|
| `stockStore.loadTickers` | `mockData.ts → getTickers()` (CSV) | `api.ts → stockAPI.listTickers()` |
| `portfolioStore` | `localStorage` | Keep as-is |

### 6.3 `api.ts` — already defined, needs train endpoint added

```
stockAPI.listTickers()        → GET /api/stocks
stockAPI.getOHLC(ticker)      → GET /api/stocks/{ticker}/ohlc
stockAPI.getIndicators()      → GET /api/stocks/{ticker}/indicators
stockAPI.getSummary()         → GET /api/stocks/{ticker}/summary
predictionAPI.getPrediction() → GET /api/predictions/{ticker}
trainAPI.train(stock_name)    → POST /api/train                  (NEW)
```

Vite proxy already configured (`/api → localhost:8000`).

### 6.4 Prediction response shape update

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

### 6.5 `AIPrediction` card updates

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

### 6.6 `api.ts` additions (DONE)

```typescript
export const trainAPI = {
  train: (stock_name: string) => api.post('/train', { stock_name }),
  status: (ticker: string) => api.get(`/train/status/${ticker}`),
};

export const modelAPI = {
  list: () => api.get('/models'),
};
```

### 6.7 Wire unused components

| Component | Wire to |
|-----------|---------|
| `IndicatorOverlay` | Real indicator data from `/api/stocks/{ticker}/indicators` |
| `PredictionLine` | Real prediction line on the candlestick chart |
| `TechnicalIndicators` card | Currently receives `indicators={null}`. Pass real data |

### 6.8 Remove after backend is live

| File/Code | Reason |
|-----------|--------|
| `frontend/public/data/*.csv` (124 files) | Data served by backend from `data/` |
| `frontend/public/data/tickers.json` | Ticker list comes from backend |
| `frontend/src/services/mockData.ts` | Replaced by `api.ts` |
| `frontend/src/utils/csvParser.ts` | No more client-side CSV parsing |

---

## 7. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript, Vite, TradingView Lightweight Charts, Zustand, Axios, Tailwind CSS 4 |
| Backend API | FastAPI, pandas, pandas-ta |
| ML Pipeline | PyTorch, scikit-learn (RobustScaler), matplotlib |
| Storage | Filesystem — CSVs for data, directories for models |
| Data Pipeline | GitHub Actions cron -> existing scraper -> CSV commit |

---

## 8. Implementation Order

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
| 9 | **Frontend rewire** -- Switch hooks/stores from mockData -> api.ts | TODO |
| 10 | **Update Prediction UI** -- `AIPrediction` card with 5-day format + stale warning + retrain button | TODO |
| 11 | **Wire unused components** -- `IndicatorOverlay`, `PredictionLine`, `TechnicalIndicators` | TODO |
| 12 | **GitHub Actions workflow** -- `.github/workflows/data_scraper.yml` running `data_scraper/dailyscraper.py` | DONE |
| 13 | **Cleanup** -- Remove `frontend/public/data/`, mockData.ts, csvParser.ts | TODO |
