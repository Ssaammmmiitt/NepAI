# NepAI

AI-powered stock prediction and analytics platform for **NEPSE** (Nepal Stock Exchange) with individual LSTM models trained per stock to forecast next-day prices up to 14 days ahead.

## Features

| Feature | Description |
|---------|-------------|
| **Per-Stock LSTM Models** | Each NEPSE listed stock gets its own trained model, stored and versioned in Supabase |
| **1-14 Day Forecasts** | Recursive multi-day predictions with NEPSE's ±15% circuit breaker cap applied per step |
| **Automated Data Updates** | Custom web-scraper scrapes NEPSE prices Mon-Fri at 6:00 PM NPT and commits to the repo |
| **Interactive Dashboard** | Market overview, top gainers/losers, sentiment bar, paginated + sortable ticker table |
| **Candlestick Charts** | OHLC + volume charts powered by TradingView Lightweight Charts with prediction overlays |
| **Technical Indicators** | RSI, MACD, Bollinger Bands, EMA (20/50) computed on the fly |
| **Portfolio Tracking** | Add/remove holdings with **WACC** upsert, live P&L (JWT-protected) |
| **On-Demand Training** | Train or retrain any stock from the UI or CLI; concurrent training supported |

## Model Architecture

The core prediction model is a **Stacked LSTM with Multi-Head Attention**:

```
Input (10 features) -> Linear Projection (hidden_size)
  -> 2-Layer LSTM (hidden=64, dropout=0.2)
    -> Multi-Head Self-Attention (4 heads) + LayerNorm (residual)
      -> Dropout -> FC (hidden/2) -> GELU -> FC (1) -> Predicted Close
```

| Hyperparameter | Value |
|----------------|-------|
| Hidden size | 64 |
| LSTM layers | 2 |
| Attention heads | 4 |
| Dropout | 0.2 |
| Sequence length | 60 trading days |
| Input features | 10 (OHLC, volume, % change, MA-7, MA-21, volatility, price range) |
| Target | Next-day close price |
| Scaler | RobustScaler (separate for features and target, per stock) |
| Loss function | HuberLoss (delta=1.0) |
| Optimizer | AdamW (lr=1e-3, weight_decay=1e-4) |
| Scheduler | ReduceLROnPlateau (factor=0.5, patience=7) |
| Early stopping | Patience=15, min_delta=1e-5 |
| Max epochs | 150 |
| Data split | 70% train / 15% val / 15% test |
| Min data rows | 500 (from 2020 onward) |
| Circuit breaker | ±15% daily cap (NEPSE rule) applied to predictions |

**Training notebook:** The full exploration, training experiments, and analysis are documented in [`nepai-lstm-train.ipynb`](nepai-lstm-train.ipynb).

**Evaluation metrics:** MAE, RMSE, MAPE, R-squared, Direction Accuracy (computed on circuit-capped and raw predictions).

## Running Locally

**Prerequisites:** Python 3.11+, Node.js 18+, a [Supabase](https://supabase.com) project (free tier works)

**For backend, database setup** - see [backend/README.md](backend/README.md)

**For frontend setup** - see [frontend/README.md](frontend/README.md)

## Repository Layout

```
NepAI/
├── backend/                FastAPI server + PyTorch ML pipeline
│   ├── api/                REST endpoints (stocks, predictions, train, auth, portfolio)
│   ├── ml/                 ML modules (model, preprocessing, training, inference, storage)
│   ├── config.py           Paths, hyperparameters, feature lists
│   ├── supabase_client.py  Supabase client singleton
│   └── __main__.py         CLI entry point
├── frontend/               React + Vite dashboard
│   └── src/                Pages, components, hooks, stores, services
├── data/
│   ├── companies/          Per-ticker OHLC CSVs (585 tickers)
│   └── metadata/           name_data.json, sector_mappings.json
├── data_scraper/           NEPSE price scraper (runs via GitHub Actions)
├── nepai-lstm-train.ipynb  Training experiments notebook
└── train_all.py            Bulk model training script
```

## Data Pipeline

Price data is sourced from ShareSansar via the scraper in `data_scraper/`. A GitHub Actions workflow runs Mon-Fri at 6:00 PM NPT, scrapes the latest OHLC prices for all tickers, and commits the updated CSVs to both `main` and `hosting` branches.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Python 3.11, FastAPI, PyTorch, pandas, scikit-learn, Supabase (python client) |
| **Frontend** | React 19, TypeScript, Vite 8, React Router v7, Zustand, Axios, TradingView Lightweight Charts v5, GSAP, Tailwind CSS 4, Lucide |
| **Database** | Supabase (Postgres + Auth + Storage) |
| **CI/CD** | GitHub Actions (data scraper) |

## Documentation

| Document | Contents |
|----------|----------|
| [backend/README.md](backend/README.md) | API reference, database setup, ML pipeline details |
| [frontend/README.md](frontend/README.md) | Pages, UI architecture, auth flow, state management |
| [nepai-lstm-train.ipynb](nepai-lstm-train.ipynb) | Model training experiments and analysis |
