# NepAI

AI-powered stock dashboard for **NEPSE** (Nepal Stock Exchange). Per-stock LSTM models predict next-day prices; the React app shows charts, forecasts, and portfolios. Data lives in CSVs; models on disk; auth via Supabase.

## Quick start

**Prerequisites:** Python 3.11+, Node.js 18+, Git

```bash
git clone <repository-url>
cd NepAI

# Backend
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env   # Supabase — required to start server
python -m backend serve                  # http://localhost:8000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                                # http://localhost:5173
```

Fill `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` before running the server (required at startup for auth/portfolio routes).

## What it does

| Area          | Highlights                                                                     |
| ------------- | ------------------------------------------------------------------------------ |
| **Data**      | 585 tickers, daily OHLC from ShareSansar (GitHub Actions Mon–Fri 18:00 NPT)    |
| **ML**        | Stacked LSTM + attention; recursive 1–14 day forecasts; ±15% NEPSE circuit cap |
| **Dashboard** | Market overview, gainers/losers, search, candlestick charts, history tab       |
| **Portfolio** | Holdings with live P&L (JWT-protected)                                         |
| **Training**  | On-demand from UI or CLI (≥500 rows after preprocessing)                       |

## Repository layout

```
NepAI/
├── backend/          FastAPI + PyTorch ML pipeline
├── frontend/         React + Vite dashboard
├── data/companies/   Per-ticker OHLC CSVs
├── data/metadata/    Company names & sectors
├── models/           Trained artifacts ({TICKER}/model.pt, …)
└── data_scraper/     NEPSE price scraper (CI)
```

## Documentation

| Doc                                      | Contents                               |
| ---------------------------------------- | -------------------------------------- |
| [backend/README.md](backend/README.md)   | API routes, CLI, ML pipeline, env vars |
| [frontend/README.md](frontend/README.md) | Pages, UI features, env, auth flow     |

## Tech stack

**Backend:** FastAPI · PyTorch · pandas · Supabase  
**Frontend:** React 19 · TypeScript · Vite · Zustand · Lightweight Charts · Tailwind CSS 4

## CLI (from repo root)

```bash
python -m backend train    --stock NABIL
python -m backend predict  --stock NABIL --days 5
python -m backend evaluate --stock NABIL
python -m backend serve    --reload
```
