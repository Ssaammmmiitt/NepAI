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
  volume: number;
}

export interface NewHolding {
  ticker: string;
  quantity: number;
  entry_price: number;
}
