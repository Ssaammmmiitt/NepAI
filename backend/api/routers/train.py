"""Train endpoint: validate stock + data, run training, return result when done."""

import asyncio
import logging

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel

from ...config import MIN_ROWS
from ...ml.preprocessing import load_stock_data, preprocess
from ...ml.storage import delete_model, load_metadata
from ...ml.training import train_stock
from ..errors import StockNotFoundError, InsufficientDataError, TrainingInProgressError
from ..state import app_state

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/train", tags=["train"])


class TrainRequest(BaseModel):
    stock_name: str


@router.post("", summary="Train or retrain a stock model")
async def train_model(body: TrainRequest):
    """Train an LSTM model for the given stock ticker.

    Validation order:
        1. Check stock CSV exists in data/
        2. Check no training already in progress for this ticker
        3. Load and preprocess data, verify >= 500 usable rows

    Training runs in a background thread so the server remains responsive
    to other requests. The HTTP response is returned when training completes.
    Multiple stocks can train concurrently.

    Request body:
        {"stock_name": "NABIL"}

    Response example (200, returned after training finishes):
        {
          "ticker": "NABIL",
          "status": "completed",
          "metrics": {
            "MAE": 15.39,
            "RMSE": 18.33,
            "MAPE": 3.0,
            "R2": -0.57,
            "Direction_Accuracy": 47.74
          },
          "training_time_sec": 42.5,
          "epochs_trained": 87,
          "date_created": "2026-06-11T22:05:40+05:45"
        }

    Errors:
        404: Stock not found in data/
        400: Insufficient data (< 500 rows after preprocessing)
        409: Training already in progress for this ticker
    """
    ticker = body.stock_name.upper()

    if not app_state.stock_csv_exists(ticker):
        raise StockNotFoundError(ticker)

    current_status = app_state.get_training_status(ticker)
    if current_status == "training":
        raise TrainingInProgressError(ticker)

    csv_path = app_state.get_stock_csv_path(ticker)
    df = load_stock_data(csv_path)
    df = preprocess(df)

    if len(df) < MIN_ROWS:
        raise InsufficientDataError(ticker, len(df), MIN_ROWS)

    app_state.invalidate_cache(ticker)
    app_state.set_training_status(ticker, "training")

    try:
        delete_model(ticker)
        result = await asyncio.to_thread(train_stock, filepath=str(csv_path))
    except Exception as e:
        app_state.set_training_status(ticker, "failed")
        logger.error(f"Training failed for {ticker}: {e}")
        raise
    finally:
        app_state.clear_training_status(ticker)

    metadata = load_metadata(ticker) or {}
    metrics = result.get("metrics_capped", {})

    return {
        "ticker": ticker,
        "status": "completed",
        "metrics": {k: round(float(v), 4) for k, v in metrics.items()},
        "training_time_sec": result.get("training_time_sec"),
        "epochs_trained": result.get("epochs_trained"),
        "date_created": metadata.get("date_created"),
    }
