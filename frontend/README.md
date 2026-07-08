# NepAI Frontend

React + TypeScript dashboard for NEPSE market data, LSTM-powered price predictions, and portfolio management. Communicates with the FastAPI backend over REST. Authentication uses JWT with automatic silent refresh and session-expiry handling.

## Quick Start

```bash
cd frontend
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

Start the backend first (`python -m backend serve` from the repo root). In dev mode, Vite proxies `/api` requests to `http://localhost:8000`.

## Environment

Copy `.env.example` to `.env`:

| Variable | Exposed to Browser | Default | Purpose |
|----------|--------------------|---------|---------|
| `VITE_API_URL` | Yes | `/api` | Axios base URL ([`src/config/env.ts`](src/config/env.ts)) |
| `DEV_API_PROXY` | No | `http://localhost:8000` | Vite dev proxy target |

**Production build:**

```bash
VITE_API_URL=https://api.yourdomain.com/api npm run build
npm run preview    # optional local check
```

Serve `dist/` statically. Never put secrets in `VITE_*` variables since they are bundled into the client.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |
| `npm test` | Vitest (watch mode) |
| `npm run test:run` | Vitest (single run, CI) |

## Pages & Routes

All routes except `/login` require authentication (`ProtectedRoute` wrapper).

| Route | Page | Key Features |
|-------|------|-------------|
| `/login` | Login / Sign Up | Public; form autocomplete, password visibility toggle |
| `/` | Dashboard | Market stat cards, top 5 gainers/losers, sentiment bar, paginated ticker table (15/page, sortable), typeahead search |
| `/gainers` | Gainers | Full sortable list with sector column, top-5 sidebar, cross-links to losers page |
| `/losers` | Losers | Full sortable list with sector column, top-5 sidebar, cross-links to gainers page |
| `/stock/:ticker` | Stock Detail | Candlestick/history chart tabs with period filters (1M/3M/6M/1Y/All), AI forecast, technical indicators, model health, add-to-portfolio modal |
| `/portfolio` | Portfolio | Summary cards (total value, P&L, holdings count), holdings grid with live P&L, add/remove with confirmation, ticker autocomplete |

Unknown routes redirect to the dashboard.

### Stock Detail Page Breakdown

- **Chart tabs:** Candlestick (default) and History views with period filters
- **Candlestick chart:** OHLC + volume via Lightweight Charts, with prediction and indicator overlays (EMA 20/50, Bollinger Bands)
- **History tab:** Line chart + paginated OHLC table
- **Current snapshot:** Price, change %, 52-week high/low, volume, data points
- **AI prediction:** Forecast table with day-by-day prices and change %, or a train/retrain prompt if no model exists. Stale-model warning shown when model is > 30 days old
- **Model health:** Accuracy metrics, freshness indicator, trained timestamp
- **Technical indicators:** RSI, MACD (line + signal + histogram), Bollinger Bands, EMA (20/50)
- **Actions:** Add to portfolio modal, train/retrain button

## Authentication

- **Sign up** with full name, email, and password; **sign in** with email/password. All calls proxy to Supabase via `/api/auth/*`
- Access + refresh tokens stored in Zustand (`persist` middleware); user profile loaded on app init via `/api/auth/me`
- Axios interceptor catches 401 responses, attempts silent token refresh, and retries the original request. If refresh fails, a session-expired modal appears and redirects to `/login`
- Sign out clears all user state and tokens

## Layout & Navigation

- **Desktop:** Fixed left sidebar with nav links, theme toggle, user info block, sign-out button pinned to bottom. Brand name links to dashboard
- **Mobile/Tablet:** Sticky top bar + bottom navigation (Dashboard, Portfolio, Sign Out)
- **Login page:** Public header with branding and theme toggle only

## State Management

| Zustand Store | Purpose |
|---------------|---------|
| `authStore` | User profile, tokens, sign in/up/out, session initialization |
| `themeStore` | Light/dark mode toggle, persisted to localStorage |
| `stockStore` | Ticker list with 5-minute cache |
| `portfolioStore` | Holdings CRUD operations |
| `toastStore` | Global toast notifications |

## Custom Hooks

| Hook | Purpose |
|------|---------|
| `useStockData` | Fetches OHLC data + summary for a ticker |
| `usePrediction` | Fetches forecast data, supports refetch after retrain |
| `useIndicators` | Fetches technical indicators (RSI, MACD, Bollinger, EMA) |
| `usePortfolio` | Holdings list with computed totals (value, P&L) |
| `useChartHeight` | Responsive chart height based on viewport |
| `useAnimations` / `useStaggerEntrance` | GSAP entrance animations (respects `prefers-reduced-motion`) |

## API Client

All HTTP requests go through [`src/services/api.ts`](src/services/api.ts):

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /auth/signup`, `/auth/login`, `/auth/refresh`; `GET /auth/me` |
| Stocks | `GET /stocks`, `/stocks/:ticker/ohlc`, `/stocks/:ticker/summary`, `/stocks/:ticker/indicators` |
| ML | `GET /predictions/:ticker`, `/model_status/:ticker`, `POST /train` |
| Portfolio | `GET /portfolio`, `POST /portfolio`, `DELETE /portfolio/:ticker` |

## UI Components

Reusable primitives under `src/components/ui/`: Button, Card, Badge, Input, Modal, Spinner, Tooltip, ThemeToggle, Toast, DateInput.

Design follows a Dark Terminal theme with JetBrains Mono (code/numbers) + Inter (UI text) fonts, emerald accent color, and theme-aware chart colors.

## Project Structure

```
src/
├── pages/           Route-level views (Dashboard, StockDetail, Portfolio, etc.)
├── components/
│   ├── charts/      Candlestick, volume, prediction overlay, history line chart
│   ├── cards/       Snapshot card, AI prediction card, chart tabs, portfolio cards
│   ├── widgets/     Market overview, ticker list, search, top movers
│   ├── layout/      Sidebar, header, protected route wrapper
│   ├── auth/        Session expired modal
│   └── ui/          Button, Card, Modal, Input, Toast, Spinner, etc.
├── hooks/           useStockData, usePrediction, useIndicators, usePortfolio, ...
├── store/           Zustand stores (auth, theme, stock, portfolio, toast)
├── services/        Axios API client with interceptors
├── config/          Environment variable helpers
└── utils/           Formatters, chart data filters, API error helpers
```

## Tech Stack

React 19, TypeScript 6, Vite 8, React Router v7, Zustand 5, Axios, TradingView Lightweight Charts v5, GSAP 3, Tailwind CSS 4, Lucide React, Vitest 4

## Related Docs

- [../backend/README.md](../backend/README.md) - API reference and database setup
- [../README.md](../README.md) - Project overview, model architecture, quick start
