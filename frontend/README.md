# NepAI Frontend

React + TypeScript client for NEPSE market data, LSTM predictions, and portfolio tracking. Talks to the FastAPI backend over REST; JWT auth with automatic refresh and session-expiry handling.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

Start the backend first (`python -m backend serve` from repo root). In dev, Vite proxies `/api` → `http://localhost:8000`.

## Environment

Copy `.env.example` → `.env`:

| Variable | In browser | Default | Purpose |
|----------|------------|---------|---------|
| `VITE_API_URL` | Yes | `/api` | Axios base URL ([`src/config/env.ts`](src/config/env.ts)) |
| `DEV_API_PROXY` | No | `http://localhost:8000` | Vite proxy target (dev only) |

**Production build:**

```bash
VITE_API_URL=https://api.yourdomain.com/api npm run build
npm run preview    # optional local check
```

Serve `dist/` statically. Never put secrets in `VITE_*` vars — they ship in the bundle.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server + HMR |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (watch) |
| `npm run test:run` | Vitest (CI, 75 tests) |

## Pages & routes

| Route | Page | Notes |
|-------|------|-------|
| `/login` | Login / Sign up | Public |
| `/` | Dashboard | Market stats, top movers, all tickers, search |
| `/gainers` | Gainers | Full list + top-5 sidebar |
| `/losers` | Losers | Full list + top-5 sidebar |
| `/stock/:ticker` | Stock detail | Charts, AI forecast, indicators, history tab |
| `/portfolio` | Portfolio | Holdings, P&amp;L, add/remove |

## Key features

- **Charts** — Candlestick + volume (Lightweight Charts); prediction & indicator overlays; history tab with line chart and paginated table
- **Auth** — Signup/login; tokens in Zustand (`persist`); 401 → silent refresh → session-expired modal → redirect to login
- **State** — `authStore`, `stockStore` (5-min ticker cache), `portfolioStore`, `themeStore`, `toastStore`
- **API** — Single Axios client ([`src/services/api.ts`](src/services/api.ts)) with JWT interceptors

## Project structure

```
src/
├── pages/           Route-level views
├── components/
│   ├── charts/      Candlestick, volume, overlays, history line chart
│   ├── cards/       Snapshot, AI prediction, chart tabs, portfolio cards
│   ├── widgets/     Market overview, ticker list, search, movers
│   ├── layout/      Sidebar, header, protected routes
│   ├── auth/        Session expired modal & handler
│   └── ui/          Button, card, modal, input, toast, …
├── hooks/           useStockData, usePrediction, useIndicators, …
├── store/           Zustand stores
├── services/        API client
├── config/          Env helpers
└── utils/           Formatters, chart data filters, API errors
```

## Stack

React 19 · TypeScript · Vite 8 · React Router v7 · Zustand · Axios · TradingView Lightweight Charts v5 · GSAP · Tailwind CSS 4 · Lucide · Vitest

## Related docs

- [FEATURES.md](FEATURES.md) — full UI feature inventory
- [../backend/README.md](../backend/README.md) — API reference
- [../README.md](../README.md) — monorepo setup
