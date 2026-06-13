# NepAI Frontend — Implemented Features

NepAI is a React + TypeScript frontend for NEPSE (Nepal Stock Exchange) stock analysis and AI-powered price prediction. It talks to the FastAPI backend at `/api` (proxied to `http://localhost:8000` in development).

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19, TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4, custom Dark Terminal design tokens |
| Routing | React Router v7 |
| State | Zustand (auth, theme, stocks, portfolio, toasts) |
| HTTP | Axios with JWT interceptors |
| Charts | TradingView Lightweight Charts v5 |
| Icons | Lucide React |
| Animation | GSAP (staggered entrances, reduced-motion aware) |

---

## Authentication

- **Sign up** — full name, email, password (min 6 characters)
- **Sign in** — email and password
- **Session persistence** — access + refresh tokens stored via Zustand `persist`
- **Auto token refresh** — Axios response interceptor retries failed requests after refreshing via `/api/auth/refresh`
- **Protected routes** — unauthenticated users redirect to `/login`
- **Profile on load** — `initialize()` calls `/api/auth/me` and falls back to refresh if the access token expired
- **Sign out** — clears user and tokens from store

---

## Pages & Routing

| Route | Page | Access |
|-------|------|--------|
| `/login` | Login / Sign up | Public |
| `/` | Dashboard | Authenticated |
| `/stock/:ticker` | Stock detail | Authenticated |
| `/portfolio` | Portfolio | Authenticated |

Unknown routes redirect to the dashboard.

---

## Dashboard (`/`)

Market overview for all listed NEPSE tickers.

- **Market overview** — listed count, gainers, losers, total volume, average change (stat cards with staggered GSAP entrance)
- **Top movers** — top 5 gainers and top 5 losers with price and change %
- **Sector breakdown** — market sentiment bar (gainers / losers / unchanged) with counts and percentages
- **Ticker list** — paginated table (15 per page) with sort by ticker, change %, or volume
- **Stock search** — typeahead search; navigates to stock detail
- **Live clock** — Nepal Time (NPT) in the header

Data is loaded from `/api/stocks` with a 5-minute client-side cache.

---

## Stock Detail (`/stock/:ticker`)

Deep dive for a single ticker.

### Charts

- **Candlestick chart** — last 120 trading days; responsive height (~12% scaled by breakpoint)
- **Volume chart** — histogram bars colored by bullish/bearish day
- **Prediction overlay** — dashed cyan line from last close through forecast days
- **Indicator overlay** — EMA 20/50 and Bollinger upper/lower on the candlestick chart
- **Theme-aware charts** — colors update on light/dark toggle without recreating chart instances

### Chart colors

| Element | Color |
|---------|-------|
| Bullish candles | `#26A69A` |
| Bearish candles | `#EF5350` |
| Prediction line | `#10B981` |
| EMA 20 | `#10B981` |
| EMA 50 | `#7A7A7A` |

### Data cards

- **Current snapshot** — latest price, change %, 52-week high/low, average volume, data point count
- **AI prediction** — 3 states:
  - No model → prompt to train
  - Fresh model → day-by-day forecast with price and change %
  - Stale model → warning badge + retrain button
- **Model health** — accuracy %, fresh/stale status, trained timestamp (compact card beside predictions)
- **Technical indicators** — RSI, MACD, Bollinger bands, EMA 20/50

### Actions

- **Add to portfolio** — modal for quantity and entry price (NPR)
- **Train / retrain model** — triggers `/api/train` and refetches predictions

### Mobile layout

- Snapshot shown above the chart on small screens
- Indicators below predictions
- Chart heights scale down on mobile and tablet

---

## Portfolio (`/portfolio`)

User holdings backed by `/api/portfolio`.

- **Summary** — total portfolio value, total P&L (amount + %), holdings count
- **Holdings grid** — per-stock card with entry price, current price, P&L, link to stock detail
- **Add stock** — modal with ticker autocomplete (from market list), quantity, entry price
- **Remove holding** — delete with loading state per card
- **Empty state** — CTA to add first stock

### Toast notifications

- Success/error toasts on add and remove (Dark Terminal styling, auto-dismiss ~3.2s)

---

## Layout & Navigation

### Desktop (lg+)

- **Fixed left sidebar** — brand, nav links, theme toggle, user details, sign out
- User block and logout **pinned to bottom-left** while main content scrolls
- **Brand click** — NepAI logo/name links to dashboard when not already on `/`

### Mobile / tablet

- Sticky top bar with brand and theme toggle
- Bottom nav — Dashboard, Portfolio, Sign out
- Content padding accounts for bottom nav

### Public header (login)

- NepAI branding with `CandlestickChart` icon
- Theme toggle (no label)

---

## UI Components

Reusable primitives under `src/components/ui/`:

- **Button** — primary, secondary, outline, ghost, danger (Dark Terminal: sharp corners, uppercase mono, hard-offset hover)
- **Card** — bordered surface with optional title and hover shadow
- **Badge** — positive, negative, warning, neutral, info
- **Input** — labeled fields with focus shadow
- **Modal** — backdrop + panel, Escape to close
- **Spinner** — loading indicator
- **ThemeToggle** — light/dark switch
- **Toast** — global notification container

---

## Design System

Based on **Dark Terminal** (`frontend/skills/DESIGN1.md`):

- **Light mode** — `#FAFAFA` background, `#FFFFFF` surfaces, dark text
- **Dark mode** — `#0A0A0A` background, `#141414` surfaces, `#E8E8E8` text
- **Accent** — emerald `#00FF88` / `#10B981` for CTAs, gains, active nav
- **Typography** — JetBrains Mono (headings, data, buttons), Inter (body)
- **Borders** — 1px, 4px radius, no soft shadows (optional hard-offset on hover)

Token reference: `frontend/ui-registry.md`

---

## State Management

| Store | Purpose |
|-------|---------|
| `authStore` | User, tokens, sign in/up/out, session init & refresh |
| `themeStore` | Light/dark theme, persisted to `localStorage` |
| `stockStore` | Ticker list with 5-min cache |
| `portfolioStore` | Holdings CRUD via API |
| `toastStore` | Global toast queue |

---

## API Integration

All requests go through `src/services/api.ts`:

| API group | Endpoints used |
|-----------|----------------|
| Auth | `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| Stocks | `GET /stocks`, `GET /stocks/:ticker/ohlc`, `GET /stocks/:ticker/summary`, `GET /stocks/:ticker/indicators` |
| Predictions | `GET /predictions/:ticker` |
| Training | `POST /train`, `GET /model_status/:ticker` |
| Portfolio | `GET /portfolio`, `POST /portfolio`, `DELETE /portfolio/:ticker` |

Development proxy: Vite forwards `/api` → `http://localhost:8000`.

---

## Custom Hooks

| Hook | Role |
|------|------|
| `useStockData` | OHLC + summary for a ticker |
| `usePrediction` | Forecast + refetch after retrain |
| `useIndicators` | Technical indicators |
| `usePortfolio` | Holdings with computed totals |
| `useChartHeight` | Responsive candlestick/volume heights (+12% scale) |
| `useAnimations` | GSAP stagger entrance, fade-in, count-up |
| `useStaggerEntrance` | Dashboard section animations |

---

## Utilities

- **`formatters.ts`** — NPR currency, percentages, dates, prediction labels
- **`colors.ts`** — chart palette and `getChartTheme()` for light/dark
- **`chartHelpers.ts`** — `safeRemoveSeries()` for overlay cleanup on theme change

---

## Accessibility & UX

- `prefers-reduced-motion` respected (GSAP and CSS transitions minimized)
- Keyboard: Escape closes modals
- `aria-live` on toast container
- `cursor-pointer` on interactive elements
- Focus-visible outlines on buttons and inputs

---

## Scripts

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Typecheck + production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

Optional env: `VITE_API_URL` (defaults to `/api`).
