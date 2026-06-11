"""
NEPSE circuit breaker: daily price movement cannot exceed +/-15% of previous close.
Applied post-prediction during inference and evaluation.
"""

import numpy as np

from ..config import CIRCUIT_CAP


def apply_cap(predicted_close: float, prev_close: float) -> tuple[float, bool]:
    """Clamp a single predicted close to within +/-CIRCUIT_CAP of prev_close.

    Returns (capped_price, was_capped).
    """
    upper = prev_close * (1.0 + CIRCUIT_CAP)
    lower = prev_close * (1.0 - CIRCUIT_CAP)
    capped = float(np.clip(predicted_close, lower, upper))
    was_capped = bool(capped != predicted_close)
    return capped, was_capped


def apply_cap_batch(
    predictions: np.ndarray, prev_closes: np.ndarray
) -> tuple[np.ndarray, np.ndarray]:
    """Clamp a batch of predictions to within +/-CIRCUIT_CAP of their prev_closes.

    Returns (capped_predictions, was_capped_mask).
    """
    upper = prev_closes * (1.0 + CIRCUIT_CAP)
    lower = prev_closes * (1.0 - CIRCUIT_CAP)
    capped = np.clip(predictions, lower, upper)
    was_capped = ~np.isclose(capped, predictions)
    return capped, was_capped
