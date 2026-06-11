"""Stock data endpoints: list tickers, OHLC, summary, indicators."""

import math
import logging

import pandas as pd
from fastapi import APIRouter, Query

from ..errors import StockNotFoundError
from ..state import app_state

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stocks", tags=["stocks"])


def _safe(val):
    if val is None:
        return None
    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
        return None
    return round(val, 2) if isinstance(val, float) else val


def _ohlc_records(df: pd.DataFrame) -> list[dict]:
    out = df[["published_date", "open", "high", "low", "close", "traded_quantity", "per_change"]].copy()
    out.columns = ["date", "open", "high", "low", "close", "volume", "per_change"]
    out["date"] = out["date"].dt.strftime("%Y-%m-%d")
    for col in ["open", "high", "low", "close", "per_change"]:
        out[col] = out[col].round(2)
    out["volume"] = out["volume"].fillna(0).astype(int)
    out["per_change"] = out["per_change"].fillna(0)
    return out.where(out.notna(), None).to_dict(orient="records")


def _ensure_stock(ticker: str) -> str:
    ticker = ticker.upper()
    if not app_state.stock_csv_exists(ticker):
        raise StockNotFoundError(ticker)
    return ticker


@router.get("", summary="List all available stocks")
async def list_tickers():
    """Return every ticker with its latest close price, daily change, and volume.

    Response example:
        [
          {
            "ticker": "NABIL",
            "latest_close": 527.0,
            "change": 1.5,
            "volume": 50000,
            "latest_date": "2026-05-15"
          },
          ...
        ]
    """
    tickers = app_state.available_tickers
    result = []
    for ticker in tickers:
        try:
            df = app_state.get_stock_data(ticker)
            if df.empty:
                continue
            latest = df.iloc[-1]
            result.append({
                "ticker": ticker,
                "latest_close": _safe(float(latest["close"])),
                "change": _safe(float(latest.get("per_change", 0) or 0)),
                "volume": int(latest.get("traded_quantity", 0) or 0),
                "latest_date": str(latest["published_date"].date()),
            })
        except Exception:
            result.append({
                "ticker": ticker,
                "latest_close": None,
                "change": None,
                "volume": None,
                "latest_date": None,
            })
    return result


@router.get("/{ticker}", summary="Full data for a stock")
async def get_stock(ticker: str):
    """Return all historical rows for a single stock.

    Path params:
        ticker: Stock symbol (e.g. NABIL)

    Response example:
        {
          "ticker": "NABIL",
          "total_rows": 3427,
          "data": [
            {"date": "2020-01-01", "open": 900.0, "high": 910.0, "low": 895.0,
             "close": 905.0, "volume": 12000, "per_change": 0.55},
            ...
          ]
        }

    Errors:
        404: Stock not found in data/
    """
    ticker = _ensure_stock(ticker)
    df = app_state.get_stock_data(ticker)
    return {
        "ticker": ticker,
        "total_rows": len(df),
        "data": _ohlc_records(df),
    }


@router.get("/{ticker}/ohlc", summary="OHLC data with optional date range")
async def get_ohlc(
    ticker: str,
    from_date: str | None = Query(None, alias="from"),
    to_date: str | None = Query(None, alias="to"),
):
    """Return OHLC + volume rows, optionally filtered by date range.

    Path params:
        ticker: Stock symbol (e.g. NABIL)

    Query params:
        from: Start date inclusive, YYYY-MM-DD (optional)
        to:   End date inclusive, YYYY-MM-DD (optional)

    Response example (GET /api/stocks/NABIL/ohlc?from=2026-01-01&to=2026-01-07):
        [
          {"date": "2026-01-01", "open": 495.0, "high": 496.0, "low": 490.0,
           "close": 492.0, "volume": 35796, "per_change": -0.95},
          {"date": "2026-01-04", "open": 491.5, "high": 495.0, "low": 488.1,
           "close": 490.3, "volume": 44294, "per_change": -0.35},
          ...
        ]

    Errors:
        404: Stock not found in data/
    """
    ticker = _ensure_stock(ticker)
    df = app_state.get_stock_data(ticker)

    if from_date:
        df = df[df["published_date"] >= pd.Timestamp(from_date)]
    if to_date:
        df = df[df["published_date"] <= pd.Timestamp(to_date)]

    return _ohlc_records(df)


@router.get("/{ticker}/summary", summary="Stock summary with 52-week stats")
async def get_summary(ticker: str):
    """Return latest price, daily change, 52-week high/low, and average volume.

    Path params:
        ticker: Stock symbol (e.g. NABIL)

    Response example:
        {
          "ticker": "NABIL",
          "latest_close": 527.0,
          "change": 0.0,
          "high_52w": 562.0,
          "low_52w": 471.0,
          "avg_volume": 62321,
          "latest_date": "2026-05-15",
          "total_rows": 3427
        }

    Errors:
        404: Stock not found in data/
    """
    ticker = _ensure_stock(ticker)
    df = app_state.get_stock_data(ticker)
    latest = df.iloc[-1]
    year_data = df.tail(252)

    return {
        "ticker": ticker,
        "latest_close": _safe(float(latest["close"])),
        "change": _safe(float(latest.get("per_change", 0) or 0)),
        "high_52w": _safe(float(year_data["high"].max())),
        "low_52w": _safe(float(year_data["low"].min())),
        "avg_volume": int(year_data["traded_quantity"].fillna(0).mean()),
        "latest_date": str(latest["published_date"].date()),
        "total_rows": len(df),
    }


@router.get("/{ticker}/indicators", summary="Technical indicators (latest values)")
async def get_indicators(ticker: str):
    """Compute and return latest RSI, MACD, Bollinger Bands, and EMA values.

    Path params:
        ticker: Stock symbol (e.g. NABIL)

    Response example:
        {
          "ticker": "NABIL",
          "rsi": 69.4,
          "macd": {"macd": 0.7, "signal": 0.41, "histogram": 0.29},
          "bollinger": {"upper": 531.27, "middle": 524.58, "lower": 517.88},
          "ema": {"ema20": 525.11, "ema50": 521.91}
        }

    Errors:
        404: Stock not found in data/
    """
    ticker = _ensure_stock(ticker)
    df = app_state.get_stock_data(ticker)
    close = df["close"]

    delta = close.diff()
    gain = delta.where(delta > 0, 0.0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0.0)).rolling(14).mean()
    rs = gain / loss.replace(0, float("inf"))
    rsi = 100 - (100 / (1 + rs))

    ema12 = close.ewm(span=12).mean()
    ema26 = close.ewm(span=26).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9).mean()
    macd_hist = macd_line - signal_line

    sma20 = close.rolling(20).mean()
    std20 = close.rolling(20).std()
    bb_upper = sma20 + 2 * std20
    bb_lower = sma20 - 2 * std20

    ema20 = close.ewm(span=20).mean()
    ema50 = close.ewm(span=50).mean()

    return {
        "ticker": ticker,
        "rsi": _safe(float(rsi.iloc[-1])),
        "macd": {
            "macd": _safe(float(macd_line.iloc[-1])),
            "signal": _safe(float(signal_line.iloc[-1])),
            "histogram": _safe(float(macd_hist.iloc[-1])),
        },
        "bollinger": {
            "upper": _safe(float(bb_upper.iloc[-1])),
            "middle": _safe(float(sma20.iloc[-1])),
            "lower": _safe(float(bb_lower.iloc[-1])),
        },
        "ema": {
            "ema20": _safe(float(ema20.iloc[-1])),
            "ema50": _safe(float(ema50.iloc[-1])),
        },
    }
