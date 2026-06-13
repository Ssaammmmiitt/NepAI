# NepAI Frontend

React + TypeScript dashboard for NEPSE stock data, LSTM predictions, and portfolio tracking.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev       # http://localhost:5173
```

Requires the backend API at `http://localhost:8000` (Vite proxies `/api` in development).

## Environment variables

Uses [Vite env files](https://vite.dev/guide/env-and-mode.html). Copy the template:

```bash
cp .env.example .env
```

| Variable | Browser | Default | Purpose |
|----------|---------|---------|---------|
| `VITE_API_URL` | Yes | `/api` | Axios API base URL (`src/config/env.ts` → `src/services/api.ts`) |
| `DEV_API_PROXY` | No | `http://localhost:8000` | Vite dev-server proxy target for `/api` |

**Hosting:** set `VITE_API_URL` to your production API URL before `npm run build`:

```bash
VITE_API_URL=https://api.yourdomain.com/api npm run build
```

Serve `dist/` with any static host. Variables prefixed with `VITE_` are baked into the bundle at build time — do not put secrets in them.

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

- **`FEATURES.md`** — implemented pages, components, and API integration
- **Root `README.md`** — backend API reference, env setup, and deployment notes

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Zustand · Axios · TradingView Lightweight Charts · GSAP · Vitest
