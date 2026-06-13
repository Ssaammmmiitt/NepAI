export interface User {
  id: string
  email: string
  full_name: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
}

export interface RefreshResponse {
  access_token: string
  refresh_token: string
}

export interface StockTicker {
  ticker: string
  latest_close: number
  change: number
  volume: number
  latest_date: string
}

export interface OHLCRow {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  per_change: number
}

export interface StockSummary {
  ticker: string
  latest_close: number
  change: number
  high_52w: number
  low_52w: number
  avg_volume: number
  latest_date: string
  total_rows: number
}

export interface Indicators {
  ticker: string
  rsi: number
  macd: { macd: number; signal: number; histogram: number }
  bollinger: { upper: number; middle: number; lower: number }
  ema: { ema20: number; ema50: number }
}

export interface PredictionDay {
  day: number
  date: string
  price: number
  change_pct: number
}

export interface Prediction {
  ticker: string
  model_available: boolean
  trained_on: string | null
  stale: boolean
  predictions: PredictionDay[]
  model_accuracy: number
  generated_at: string
}

export interface ModelStatus {
  ticker: string
  model_status: 'trained' | 'training' | 'not_available'
  date_created: string | null
  stale: boolean | null
}

export interface ModelMetadata {
  ticker: string
  date_created: string
  accuracy: {
    mae: number
    mape: number
    r2: number
    rmse: number
    direction_accuracy: number
  }
  training_rows: number
  stale: boolean
}

export interface PortfolioHolding {
  ticker: string
  quantity: number
  entry_price: number
  current_price: number
  pnl: number
  pnl_percent: number
  added_at: string
}

export interface PortfolioResponse {
  holdings: PortfolioHolding[]
}

export interface TrainResponse {
  ticker: string
  status: string
  metrics: Record<string, number>
  training_time_sec: number
  epochs_trained: number
  date_created: string
}

export interface ApiError {
  error: string
  ticker?: string
}
