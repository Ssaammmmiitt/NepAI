# NepAI Frontend

React + TypeScript dashboard for NEPSE stock data, LSTM predictions, and portfolio tracking.

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173
```

Requires the backend API at `http://localhost:8000` (Vite proxies `/api` in development).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck + production build |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |
| `npm test` | Vitest watch mode |
| `npm run test:run` | Vitest single run |

## Documentation

- **`FEATURES.md`** — implemented pages, components, design system, and API integration
- **`ui-registry.md`** — Dark Terminal design tokens and component patterns
- **Root `README.md`** — backend API reference and project setup

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Zustand · Axios · TradingView Lightweight Charts · GSAP · Vitest
