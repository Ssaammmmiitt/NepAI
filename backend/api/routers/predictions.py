"""Prediction endpoint: recursive N-day forecast with model-exists validation."""

import logging

from fastapi import APIRouter, Query

from ..errors import StockNotFoundError, ModelNotFoundError
from ..metadata import enrich
from ..state import app_state, is_stale
from ...ml.storage import model_exists, load_metadata
from ...ml.inference import predict

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("/{ticker}", summary="N-day stock price prediction")
async def get_prediction(ticker: str, days: int = Query(5, ge=1, le=14)):
    """Run recursive LSTM inference to predict the next N days of close prices.

    Path params:
        ticker: Stock symbol (e.g. NABIL)

    Query params:
        days: Number of days to forecast, 1-14 (default 5)

    Response example (GET /api/predictions/NABIL?days=3):
        {
          "ticker": "NABIL",
          "stock_name": "Nabil Bank Limited",
          "stock_sector": "Commercial Bank",
          "model_available": true,
          "trained_on": "2026-06-11T21:50:40+05:45",
          "stale": false,
          "predictions": [
            {"day": 1, "date": "2026-05-18", "price": 534.14, "change_pct": 1.36},
            {"day": 2, "date": "2026-05-19", "price": 534.21, "change_pct": 0.01},
            {"day": 3, "date": "2026-05-20", "price": 533.71, "change_pct": -0.09}
          ],
          "model_accuracy": 0.97,
          "generated_at": "2026-06-11T22:00:00+05:45"
        }

    Errors:
        404: Stock not found in data/ or no trained model available
    """
    ticker = ticker.upper()

    if not app_state.stock_csv_exists(ticker):
        raise StockNotFoundError(ticker)

    if not model_exists(ticker):
        raise ModelNotFoundError(ticker)

    result = predict(ticker=ticker, days=days)

    if not result.get("model_available"):
        raise ModelNotFoundError(ticker)

    for p in result.get("predictions", []):
        p.pop("raw_price", None)
        p.pop("was_capped", None)

    metadata = load_metadata(ticker)
    if metadata:
        date_created = metadata.get("date_created", "")
        result["stale"] = is_stale(date_created)
        result["trained_on"] = date_created

    return enrich(ticker, result)
