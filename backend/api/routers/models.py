"""Models endpoint: list available trained models with metadata and staleness."""

import logging

from fastapi import APIRouter

from ..metadata import enrich
from ..state import app_state

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/models", tags=["models"])


@router.get("", summary="List all trained models")
async def list_models():
    """Return metadata for every trained model in models/.

    Each entry includes accuracy metrics, training info, and a staleness flag
    (stale = trained more than 7 days ago).

    Response example:
        [
          {
            "ticker": "NABIL",
            "date_created": "2026-06-11T22:05:40+05:45",
            "accuracy": {
              "mae": 15.39,
              "mape": 3.0,
              "r2": -0.57,
              "rmse": 18.33,
              "direction_accuracy": 47.74
            },
            "n_features": 11,
            "training_rows": 1435,
            "seq_len": 60,
            "training_time_sec": 42.5,
            "epochs_trained": 87,
            "stale": false
          },
          ...
        ]
    """
    models = app_state.get_all_models()
    return [enrich(m.get("ticker", ""), m) for m in models]
