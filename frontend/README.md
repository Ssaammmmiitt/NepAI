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

All routes except `/login` require authentication (`ProtectedRoute`).

| Route | Page | Notes |
|-------|------|-------|
| `/login` | Login / Sign up | Public; autocomplete + password toggle |
| `/` | Dashboard | Market stats, top movers, all tickers, search |
| `/gainers` | Gainers | Full sortable list + top-5 sidebar |
| `/losers` | Losers | Full sortable list + top-5 sidebar |
| `/stock/:ticker` | Stock detail | Charts, AI forecast, indicators, history tab |
| `/portfolio` | Portfolio | Holdings, P&amp;L, add/remove with confirmation |

Unknown routes redirect to the dashboard.

### Dashboard (`/`)

- Market overview stat cards (listed count, gainers, losers, volume, avg change)
- Top 5 gainers/losers with company name and sector tooltips
- Market sentiment bar (links to `/gainers` and `/losers`)
- Paginated ticker table (15/page) — sort by ticker, change %, price, volume, sector
- Typeahead search by ticker or company name
- Nepal Time clock in header; ticker list cached 5 minutes

### Stock detail (`/stock/:ticker`)

- **Chart tabs** — Candlestick (default) and History; period filters (1M / 3M / 6M / 1Y / All)
- Candlestick + volume charts (Lightweight Charts); prediction and indicator overlays (EMA 20/50, Bollinger)
- History tab — line chart + paginated OHLC table
- Current snapshot — price, change %, 52w high/low, volume, data points
- AI prediction — forecast table or train/retrain prompt; stale-model warning
- Model health — accuracy, freshness, trained timestamp
- Technical indicators — RSI, MACD, Bollinger, EMA
- Add to portfolio modal; train/retrain via `/api/train`
- Theme-aware chart colors; responsive heights on mobile/tablet

### Gainers / losers (`/gainers`, `/losers`)

- Market overview stat cards (cross-links between pages)
- Full sortable table with sector column and metadata tooltips
- Top-5 sidebar panel

### Portfolio (`/portfolio`)

- Summary — total value, P&amp;L (amount + %), holdings count
- Holdings grid — entry/current price, P&amp;L, link to stock detail
- Add stock modal with ticker autocomplete; remove with confirmation
- Success/error toasts on add and remove

## Authentication

- Sign up (full name, email, password) and sign in via Supabase-backed `/api/auth/*`
- Access + refresh tokens in Zustand (`persist`); profile loaded on init via `/api/auth/me`
- Axios interceptor: 401 → silent refresh → retry; if refresh fails → session-expired modal → redirect to `/login`
- Sign out clears user and tokens

## Layout & navigation

- **Desktop** — fixed left sidebar (nav, theme toggle, user block, sign out pinned to bottom); brand links to dashboard
- **Mobile/tablet** — sticky top bar + bottom nav (Dashboard, Portfolio, Sign out)
- **Login** — public header with branding and theme toggle

## State, hooks & API

| Store | Purpose |
|-------|---------|
| `authStore` | User, tokens, sign in/up/out, session init |
| `themeStore` | Light/dark, persisted |
| `stockStore` | Ticker list, 5-min cache |
| `portfolioStore` | Holdings CRUD |
| `toastStore` | Global notifications |

| Hook | Role |
|------|------|
| `useStockData` | OHLC + summary |
| `usePrediction` | Forecast + refetch after retrain |
| `useIndicators` | Technical indicators |
| `usePortfolio` | Holdings with computed totals |
| `useChartHeight` | Responsive chart heights |
| `useAnimations` / `useStaggerEntrance` | GSAP entrances (respects `prefers-reduced-motion`) |

All HTTP goes through [`src/services/api.ts`](src/services/api.ts):

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /auth/signup`, `/auth/login`, `/auth/refresh`; `GET /auth/me` |
| Stocks | `GET /stocks`, `/stocks/:ticker/ohlc`, `/summary`, `/indicators` |
| ML | `GET /predictions/:ticker`, `/model_status/:ticker`; `POST /train` |
| Portfolio | `GET /portfolio`, `POST /portfolio`, `DELETE /portfolio/:ticker` |

## UI components

Reusable primitives under `src/components/ui/`: Button, Card, Badge, Input, Modal, Spinner, Tooltip, ThemeToggle, Toast, DateInput.

Design tokens follow a Dark Terminal theme (JetBrains Mono + Inter, emerald accent). Reference: [`skills/DESIGN1.md`](skills/DESIGN1.md), [`ui-registry.md`](ui-registry.md).

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

- [../backend/README.md](../backend/README.md) — API reference
- [../README.md](../README.md) — monorepo setup
