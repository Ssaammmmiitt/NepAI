"""Recursive multi-day inference with NEPSE circuit breaker cap."""

import logging
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
import torch

from ..config import SEQ_LEN, DATA_DIR, ALL_FEATURES
from .preprocessing import load_stock_data, preprocess
from .circuit_breaker import apply_cap
from .storage import load_model, model_exists

logger = logging.getLogger(__name__)


def _next_trading_day(current: datetime) -> datetime:
    """Advance to the next weekday (skip Sat/Sun). Doesn't handle NEPSE holidays."""
    nxt = current + timedelta(days=1)
    while nxt.weekday() >= 5:
        nxt += timedelta(days=1)
    return nxt


def predict(
    ticker: str,
    days: int = 5,
    device: torch.device | None = None,
) -> dict:
    """Recursive N-day forecast for a stock.

    1. Loads the saved model + scalers
    2. Reads the latest data from CSV
    3. Runs N sequential forward passes, applying circuit cap each step
    4. Returns predictions with dates
    """
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if not model_exists(ticker):
        return {
            "ticker": ticker,
            "model_available": False,
            "message": f"No trained model for {ticker}",
        }

    model, feature_scaler, target_scaler, metadata = load_model(ticker, device)
    model.eval()

    csv_path = DATA_DIR / f"{ticker}.csv"
    if not csv_path.exists():
        return {
            "ticker": ticker,
            "model_available": False,
            "message": f"No CSV data for {ticker}",
        }

    df = load_stock_data(csv_path)
    df = preprocess(df)

    if len(df) < SEQ_LEN:
        return {
            "ticker": ticker,
            "model_available": True,
            "message": f"Not enough data rows ({len(df)}) for seq_len={SEQ_LEN}",
        }

    # Extra rows for rolling feature computation
    window_df = df.tail(SEQ_LEN + 21).copy()
    last_date = pd.Timestamp(df["published_date"].iloc[-1])
    prev_close = float(df["close"].iloc[-1])

    predictions = []
    current_date = last_date

    for day_i in range(1, days + 1):
        tail = window_df.tail(SEQ_LEN)
        scaled_features = feature_scaler.transform(tail[ALL_FEATURES].values)
        scaled_features = np.nan_to_num(scaled_features, nan=0.0, posinf=0.0, neginf=0.0)

        input_tensor = torch.FloatTensor(scaled_features).unsqueeze(0).to(device)

        with torch.no_grad():
            pred_scaled = model(input_tensor).cpu().item()

        pred_close = target_scaler.inverse_transform([[pred_scaled]])[0, 0]
        capped_close, was_capped = apply_cap(pred_close, prev_close)

        if was_capped:
            logger.info(
                f"[{ticker}] Day {day_i}: raw={pred_close:.2f} -> "
                f"capped={capped_close:.2f} (prev={prev_close:.2f})"
            )

        current_date = _next_trading_day(current_date)
        per_change = ((capped_close - prev_close) / prev_close) * 100

        predictions.append({
            "day": day_i,
            "date": str(current_date.date()),
            "price": round(float(capped_close), 2),
            "raw_price": round(float(pred_close), 2),
            "was_capped": was_capped,
            "change_pct": round(per_change, 2),
        })

        # Build synthetic row for next iteration
        avg_volume = float(window_df["traded_quantity"].tail(20).mean())
        synthetic = {
            "published_date": current_date,
            "open": prev_close,
            "high": max(prev_close, capped_close),
            "low": min(prev_close, capped_close),
            "close": capped_close,
            "per_change": per_change,
            "traded_quantity": avg_volume,
        }
        window_df = pd.concat([window_df, pd.DataFrame([synthetic])], ignore_index=True)

        # Recompute rolling features on updated window
        window_df["ma_7"] = window_df["close"].rolling(7, min_periods=1).mean()
        window_df["ma_21"] = window_df["close"].rolling(21, min_periods=1).mean()
        window_df["volatility"] = (
            window_df["close"].rolling(7, min_periods=1).std().fillna(0)
        )
        window_df["price_range"] = window_df["high"] - window_df["low"]
        window_df["day_of_week"] = window_df["published_date"].dt.dayofweek

        prev_close = capped_close

    accuracy = metadata.get("accuracy", {})
    mape = accuracy.get("mape", 0)
    model_accuracy = round(max(0, 100 - mape) / 100, 4) if mape else None

    return {
        "ticker": ticker,
        "model_available": True,
        "trained_on": metadata.get("date_created"),
        "stale": False,
        "predictions": predictions,
        "model_accuracy": model_accuracy,
        "generated_at": datetime.now(timezone(timedelta(hours=5, minutes=45))).isoformat(),
    }
