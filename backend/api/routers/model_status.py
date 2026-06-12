"""Model status endpoint: per-ticker model availability, freshness, and metadata."""

import logging

from fastapi import APIRouter

from ..errors import StockNotFoundError
from ..state import app_state, is_stale
from ...ml.storage import model_exists, load_metadata

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/model_status", tags=["model_status"])


@router.get("/{ticker}", summary="Model status for a stock")
async def get_model_status(ticker: str):
    """Return the model status for a given stock ticker.

    Checks whether the stock exists in data/, then reports model status,
    when it was created, and whether it is stale (trained > 7 days ago).

    Path params:
        ticker: Stock symbol (case-insensitive, e.g. NABIL, nabil)

    model_status values:
        - "trained": A trained model exists on disk.
        - "training": Training is currently in progress for this ticker.
        - "not_available": No model exists and no training is running.

    Response example (trained model):
        {
          "ticker": "NABIL",
          "model_status": "trained",
          "date_created": "2026-06-11T22:05:40+05:45",
          "stale": false
        }

    Response example (no model):
        {
          "ticker": "ADBL",
          "model_status": "not_available",
          "date_created": null,
          "stale": null
        }

    Errors:
        404: Stock not found in data/
    """
    ticker = ticker.upper()

    if not app_state.stock_csv_exists(ticker):
        raise StockNotFoundError(ticker)

    # Determine model status
    training = app_state.get_training_status(ticker) == "training"
    has_model = model_exists(ticker)

    if training:
        status = "training"
    elif has_model:
        status = "trained"
    else:
        status = "not_available"

    result: dict = {
        "ticker": ticker,
        "model_status": status,
        "date_created": None,
        "stale": None,
    }

    if has_model:
        metadata = load_metadata(ticker)
        if metadata:
            date_created = metadata.get("date_created", "")
            result["date_created"] = date_created or None
            result["stale"] = is_stale(date_created)

    return result
