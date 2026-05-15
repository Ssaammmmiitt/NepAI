# NepAI — Frontend Architecture & Development Guide

> Detailed specification for the React + TypeScript frontend of the NepAI stock prediction dashboard.

---

## 1. Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| React Router | v6 | Client-side routing |
| Zustand | 4.x | Lightweight state management |
| Axios | 1.x | HTTP client |
| TradingView Lightweight Charts | 4.x | Candlestick & line charts |
| Recharts | 2.x | Bar charts, pie charts, sparklines |
| Lucide React | latest | Icon library |
| Google Fonts (Inter) | — | Typography |

---

## 2. Directory Structure

```
frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
│
├── public/
│   └── favicon.svg
│
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component + router
│   ├── index.css                   # Global styles & design tokens
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx           # Market overview + top movers
│   │   ├── StockDetail.tsx         # Per-stock chart + indicators + prediction
│   │   └── Portfolio.tsx           # Portfolio tracker + P&L
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   ├── Header.tsx          # Top bar with search
│   │   │   └── PageWrapper.tsx     # Content area wrapper
│   │   │
│   │   ├── charts/
│   │   │   ├── CandlestickChart.tsx    # TradingView OHLC chart
│   │   │   ├── IndicatorOverlay.tsx    # RSI, MACD, BB overlays
│   │   │   ├── PredictionLine.tsx      # Prediction overlay on chart
│   │   │   └── VolumeChart.tsx         # Volume bars below candlestick
│   │   │
│   │   ├── cards/
│   │   │   ├── PredictionCard.tsx      # Next-day & next-week forecast
│   │   │   ├── StockSummaryCard.tsx    # Price, change, volume summary
│   │   │   ├── PortfolioCard.tsx       # Single holding card
│   │   │   └── ModelHealthCard.tsx     # Model accuracy display
│   │   │
│   │   ├── widgets/
│   │   │   ├── StockSearch.tsx         # Ticker search autocomplete
│   │   │   ├── TopMovers.tsx           # Biggest gainers/losers
│   │   │   ├── TickerList.tsx          # Scrollable ticker list
│   │   │   └── PortfolioSummary.tsx    # Total value, P&L banner
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── Spinner.tsx
│   │       └── Modal.tsx
│   │
│   ├── hooks/
│   │   ├── useStockData.ts         # Fetch OHLC data
│   │   ├── useIndicators.ts        # Fetch technical indicators
│   │   ├── usePrediction.ts        # Fetch predictions
│   │   └── usePortfolio.ts         # Portfolio CRUD
│   │
│   ├── store/
│   │   ├── stockStore.ts           # Selected ticker, date range
│   │   └── portfolioStore.ts       # Portfolio holdings state
│   │
│   ├── services/
│   │   └── api.ts                  # Axios instance + all API calls
│   │
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   │
│   └── utils/
│       ├── formatters.ts           # Price, date, percentage formatters
│       └── colors.ts               # Chart color constants
```

---

## 3. Pages

### 3.1 Dashboard (`/`)

The landing page. Shows a market overview.

**Layout:**
```
┌─────────┬──────────────────────────────────────────┐
│         │  Header (Search Bar + Date)               │
│         ├──────────────────────────────────────────┤
│         │  ┌─────────────┐ ┌─────────────┐         │
│ Sidebar │  │ Top Gainers │ │ Top Losers  │         │
│  (Nav)  │  └─────────────┘ └─────────────┘         │
│         │  ┌────────────────────────────────┐       │
│         │  │   Market Overview Sparklines   │       │
│         │  └────────────────────────────────┘       │
│         │  ┌────────────────────────────────┐       │
│         │  │   Full Ticker List (sortable)  │       │
│         │  └────────────────────────────────┘       │
└─────────┴──────────────────────────────────────────┘
```

**Data sources:**
- `GET /api/stocks` → full ticker list with latest prices
- `GET /api/stocks/{ticker}/summary` → for each top mover card

**Components used:** `TopMovers`, `TickerList`, `StockSearch`, `StockSummaryCard`

---

### 3.2 Stock Detail (`/stock/:ticker`) — **Most Important Page**

Deep-dive into a single company with charts, indicators, and predictions.

**Layout:**
```
┌─────────┬──────────────────────────────────────────┐
│         │  Header (Ticker: NABIL — Nabil Bank)      │
│         ├──────────────────────────────────────────┤
│         │  ┌───────────────┐ ┌──────────────────┐   │
│ Sidebar │  │  Prediction   │ │  Model Health    │   │
│         │  │  Card (1d/1w) │ │  Card (accuracy) │   │
│         │  └───────────────┘ └──────────────────┘   │
│         │  ┌────────────────────────────────────┐   │
│         │  │    Candlestick Chart (OHLC)        │   │
│         │  │    + Prediction Line Overlay        │   │
│         │  │    + Bollinger Band / EMA Overlay   │   │
│         │  ├────────────────────────────────────┤   │
│         │  │    Volume Bars                      │   │
│         │  ├────────────────────────────────────┤   │
│         │  │    RSI Sub-chart                    │   │
│         │  ├────────────────────────────────────┤   │
│         │  │    MACD Sub-chart                   │   │
│         │  └────────────────────────────────────┘   │
│         │  ┌────────────────────────────────────┐   │
│         │  │  [Add to Portfolio] button          │   │
│         │  └────────────────────────────────────┘   │
└─────────┴──────────────────────────────────────────┘
```

**Data sources:**
- `GET /api/stocks/{ticker}/ohlc?from=...&to=...`
- `GET /api/stocks/{ticker}/indicators`
- `GET /api/predictions/{ticker}`

**Components used:** `CandlestickChart`, `IndicatorOverlay`, `PredictionLine`, `VolumeChart`, `PredictionCard`, `ModelHealthCard`

---

### 3.3 Portfolio (`/portfolio`)

Shows user's tracked stocks and aggregate P&L.

**Layout:**
```
┌─────────┬──────────────────────────────────────────┐
│         │  Header (My Portfolio)                    │
│         ├──────────────────────────────────────────┤
│         │  ┌────────────────────────────────────┐   │
│ Sidebar │  │  Portfolio Summary Banner           │   │
│         │  │  Total Value | Total P&L | # Stocks │   │
│         │  └────────────────────────────────────┘   │
│         │  ┌────────────────────────────────────┐   │
│         │  │  Portfolio Holdings Grid            │   │
│         │  │  ┌────────┐ ┌────────┐ ┌────────┐  │   │
│         │  │  │ NABIL  │ │ NMB    │ │ SCB    │  │   │
│         │  │  │ +3.2%  │ │ -1.1%  │ │ +0.5%  │  │   │
│         │  │  └────────┘ └────────┘ └────────┘  │   │
│         │  └────────────────────────────────────┘   │
└─────────┴──────────────────────────────────────────┘
```

**Data sources:**
- `GET /api/portfolio` + `GET /api/portfolio/summary`

---

## 4. Charting Strategy

### 4.1 TradingView Lightweight Charts Integration

Use for all financial charts. Key integration pattern:

```typescript
// components/charts/CandlestickChart.tsx — conceptual pattern
import { createChart, IChartApi } from 'lightweight-charts';
import { useRef, useEffect } from 'react';

// 1. Create chart on mount, attach to container ref
// 2. Add CandlestickSeries with OHLC data from API
// 3. Add LineSeries for prediction overlay (dashed, amber color)
// 4. Add HistogramSeries for volume (separate pane)
// 5. Cleanup: chart.remove() on unmount
```

### 4.2 Chart Data Shapes

```typescript
// OHLC data from /api/stocks/{ticker}/ohlc
interface OHLCData {
  time: string;   // "2024-01-15" — ISO date string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Prediction overlay from /api/predictions/{ticker}
interface PredictionPoint {
  time: string;
  value: number;           // predicted close
  confidence_low: number;
  confidence_high: number;
}
```

### 4.3 Indicator Sub-Charts Layout

| Indicator | Chart Type | Pane |
|-----------|-----------|------|
| Candlestick (OHLC) | CandlestickSeries | Main |
| Bollinger Bands | 3 × LineSeries (upper, mid, lower) | Main (overlay) |
| EMA (12, 26) | 2 × LineSeries | Main (overlay) |
| Volume | HistogramSeries | Pane 2 |
| RSI (14) | LineSeries + horizontal lines at 30/70 | Pane 3 |
| MACD | HistogramSeries + 2 LineSeries (MACD, Signal) | Pane 4 |

---

## 5. State Management (Zustand)

### stockStore.ts

```typescript
interface StockStore {
  selectedTicker: string | null;
  dateRange: { from: string; to: string };
  tickers: string[];                    // all 124 tickers loaded from /api/stocks
  setTicker: (ticker: string) => void;
  setDateRange: (from: string, to: string) => void;
  setTickers: (list: string[]) => void;
}
```

### portfolioStore.ts

```typescript
interface PortfolioStore {
  holdings: PortfolioItem[];
  summary: PortfolioSummary | null;
  addHolding: (item: NewHolding) => Promise<void>;
  removeHolding: (ticker: string) => Promise<void>;
  fetchPortfolio: () => Promise<void>;
}
```

---

## 6. API Integration Layer

### `services/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
});

export const stockAPI = {
  listTickers: ()                                  => api.get('/stocks'),
  getOHLC: (ticker: string, from?: string, to?: string) =>
    api.get(`/stocks/${ticker}/ohlc`, { params: { from, to } }),
  getIndicators: (ticker: string)                  => api.get(`/stocks/${ticker}/indicators`),
  getSummary: (ticker: string)                     => api.get(`/stocks/${ticker}/summary`),
};

export const predictionAPI = {
  getPrediction: (ticker: string) => api.get(`/predictions/${ticker}`),
};

export const portfolioAPI = {
  getPortfolio: ()                            => api.get('/portfolio'),
  addStock: (data: { ticker: string; quantity: number; entry_price: number }) =>
    api.post('/portfolio', data),
  removeStock: (ticker: string)               => api.delete(`/portfolio/${ticker}`),
  getSummary: ()                              => api.get('/portfolio/summary'),
};
```

---

## 7. TypeScript Interfaces

```typescript
// types/index.ts

export interface OHLCDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  per_change: number;
}

export interface IndicatorData {
  rsi: { time: string; value: number }[];
  macd: {
    macd: { time: string; value: number }[];
    signal: { time: string; value: number }[];
    histogram: { time: string; value: number }[];
  };
  bollinger: {
    upper: { time: string; value: number }[];
    middle: { time: string; value: number }[];
    lower: { time: string; value: number }[];
  };
  ema: {
    ema12: { time: string; value: number }[];
    ema26: { time: string; value: number }[];
  };
}

export interface Prediction {
  ticker: string;
  next_day: { price: number; confidence_low: number; confidence_high: number };
  next_week: { price: number; confidence_low: number; confidence_high: number };
  model_accuracy: number;
  generated_at: string;
}

export interface PortfolioItem {
  ticker: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  predicted_price: number;
  pnl: number;
  pnl_percent: number;
}

export interface PortfolioSummary {
  total_value: number;
  total_invested: number;
  total_pnl: number;
  total_pnl_percent: number;
  holdings_count: number;
}

export interface StockTicker {
  ticker: string;
  name: string;
  sector: string;
  latest_close: number;
  change: number;
}
```

---

## 8. Design System

### 8.1 Color Palette (Dark Financial Theme)

```css
:root {
  /* Background layers */
  --bg-primary: #0a0e17;
  --bg-secondary: #111827;
  --bg-card: #1a1f2e;
  --bg-hover: #242b3d;

  /* Text */
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  /* Accent */
  --accent-primary: #6366f1;
  --accent-primary-glow: rgba(99, 102, 241, 0.15);

  /* Financial colors */
  --color-bullish: #22c55e;
  --color-bearish: #ef4444;
  --color-bullish-bg: rgba(34, 197, 94, 0.1);
  --color-bearish-bg: rgba(239, 68, 68, 0.1);

  /* Chart colors */
  --chart-candle-up: #22c55e;
  --chart-candle-down: #ef4444;
  --chart-volume: rgba(99, 102, 241, 0.3);
  --chart-prediction: #f59e0b;
  --chart-bollinger: #8b5cf6;
  --chart-ema: #06b6d4;

  /* Borders & surfaces */
  --border-color: #1e293b;
  --border-glow: rgba(99, 102, 241, 0.3);

  /* Glassmorphism */
  --glass-bg: rgba(26, 31, 46, 0.8);
  --glass-blur: 12px;

  /* Spacing scale */
  --space-xs: 4px;  --space-sm: 8px;  --space-md: 16px;
  --space-lg: 24px; --space-xl: 32px; --space-2xl: 48px;

  /* Border radius */
  --radius-sm: 6px;  --radius-md: 10px;  --radius-lg: 16px;

  /* Shadows */
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.3);
  --shadow-glow: 0 0 20px rgba(99, 102, 241, 0.15);

  /* Typography */
  --font-family: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### 8.2 Key Style Patterns

- **Cards**: glassmorphism with `backdrop-filter: blur(12px)`, subtle border glow on hover
- **Positive values**: Green text (`--color-bullish`) + subtle green background
- **Negative values**: Red text (`--color-bearish`) + subtle red background
- **Prediction elements**: Amber/gold (`--chart-prediction`) to distinguish from actuals
- **Hover states**: Subtle glow via `box-shadow: var(--shadow-glow)`
- **Transitions**: All interactive elements use `transition: all 0.2s ease`

### 8.3 Typography Scale

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `.text-display` | 2rem | 700 | Page titles |
| `.text-heading` | 1.25rem | 600 | Section titles |
| `.text-body` | 0.938rem | 400 | Default body |
| `.text-caption` | 0.813rem | 400 | Labels, metadata |
| `.text-price` | mono font | 600 | All numeric/price values |

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Layout Change |
|-----------|-------|---------------|
| Desktop | ≥ 1280px | Sidebar + full content area |
| Tablet | 768–1279px | Collapsible sidebar, 2-column card grid |
| Mobile | < 768px | Bottom nav, single column, stacked charts |

---

## 10. Build & Run Instructions

### Initial Setup

```bash
# From project root
cd frontend

# Create Vite project (if starting fresh)
npx -y create-vite@latest ./ --template react-ts

# Install dependencies
npm install react-router-dom zustand axios lightweight-charts recharts lucide-react

# Start dev server
npm run dev
```

### Environment Variables (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000/api
```

### Vite Proxy Config (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 11. Component Build Order (Recommended Sequence)

| Phase | What to Build | Depends On |
|-------|--------------|------------|
| 1 | `index.css` — design tokens, base styles | Nothing |
| 2 | `Sidebar`, `Header`, `PageWrapper` — layout shell | Phase 1 |
| 3 | `services/api.ts` + `types/index.ts` | Nothing |
| 4 | `stockStore.ts`, `portfolioStore.ts` | Phase 3 |
| 5 | Dashboard page: `TickerList`, `StockSummaryCard`, `TopMovers` | Phase 2–4 |
| 6 | Stock Detail: `CandlestickChart` → `VolumeChart` → `IndicatorOverlay` | Phase 2–4 |
| 7 | Predictions: `PredictionLine` + `PredictionCard` + `ModelHealthCard` | Phase 6 |
| 8 | Portfolio page: `PortfolioCard`, `PortfolioSummary` | Phase 2–4 |
| 9 | Polish: animations, skeleton loaders, error boundaries | All |

---

## 12. CSV Data → Chart Rendering Flow

This is the end-to-end path from raw CSV files to rendered visualization:

```
nepse-data/data/company-wise/NABIL.csv
    ↓
Backend DataService reads CSV, parses with pandas
    ↓
Caches parsed data into PostgreSQL stock_prices table
    ↓
GET /api/stocks/NABIL/ohlc  →  returns JSON array
    ↓
Frontend useStockData('NABIL') hook fetches data
    ↓
Data mapped to TradingView format: { time, open, high, low, close }
    ↓
CandlestickChart component: createChart() + addCandlestickSeries(data)
    ↓
PredictionLine: addLineSeries() with dashed amber prediction line
    ↓
IndicatorOverlay: adds Bollinger, EMA as additional LineSeries
```

---

## 13. Performance Considerations

- **Lazy load** Stock Detail and Portfolio pages via `React.lazy` + `Suspense`
- **Memoize** chart data transformations with `useMemo`
- **Debounce** search input (300ms) in `StockSearch`
- **Virtualize** the ticker list on Dashboard for 124+ items
- **Cache** API responses in Zustand store to avoid refetching on navigation

---

## 14. Error & Loading State Requirements

Every data-fetching component must handle **3 states**:

| State | UI Pattern |
|-------|-----------|
| **Loading** | Skeleton shimmer animation matching card/chart dimensions |
| **Error** | Error card with message + retry button |
| **Empty** | Informative empty state (e.g., "No data available for this ticker") |
