"""Model evaluation: forward pass on test set, metric computation, plotting."""

import logging
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    mean_absolute_percentage_error,
)

from ..config import MODELS_DIR, DATA_DIR
from .circuit_breaker import apply_cap_batch
from .dataset import build_dataloaders
from .storage import load_model
from .plotting import plot_predictions

logger = logging.getLogger(__name__)


def run_evaluation(model, loader, criterion, device):
    """Forward pass over a DataLoader. Returns loss and raw scaled arrays."""
    model.eval()
    total_loss = 0.0
    n_samples = 0
    preds, actuals, prev_closes = [], [], []
    with torch.no_grad():
        for x, y, prev_y in loader:
            x, y = x.to(device), y.to(device)
            pred = model(x)
            total_loss += criterion(pred, y).item() * x.size(0)
            n_samples += x.size(0)
            preds.append(pred.cpu().numpy())
            actuals.append(y.cpu().numpy())
            prev_closes.append(prev_y.numpy())
    return (
        total_loss / n_samples,
        np.concatenate(preds),
        np.concatenate(actuals),
        np.concatenate(prev_closes),
    )


def compute_metrics(
    preds_scaled: np.ndarray,
    actuals_scaled: np.ndarray,
    prev_closes_scaled: np.ndarray,
    target_scaler,
    apply_circuit_cap: bool = True,
) -> tuple[dict, np.ndarray, np.ndarray]:
    """Inverse-transform, optionally apply circuit cap, then compute metrics."""
    preds = target_scaler.inverse_transform(preds_scaled.reshape(-1, 1)).flatten()
    actuals = target_scaler.inverse_transform(actuals_scaled.reshape(-1, 1)).flatten()
    prev_closes = target_scaler.inverse_transform(
        prev_closes_scaled.reshape(-1, 1)
    ).flatten()

    if apply_circuit_cap:
        preds, _ = apply_cap_batch(preds, prev_closes)

    mae = mean_absolute_error(actuals, preds)
    mse = mean_squared_error(actuals, preds)
    rmse = np.sqrt(mse)
    r2 = r2_score(actuals, preds)
    mape = mean_absolute_percentage_error(actuals, preds) * 100
    mean_price = np.mean(np.abs(actuals))
    dir_acc = (
        np.mean(np.sign(np.diff(actuals)) == np.sign(np.diff(preds))) * 100
        if len(preds) > 1
        else 0.0
    )

    metrics = {
        "MAE": mae,
        "MSE": mse,
        "RMSE": rmse,
        "R2": r2,
        "MAPE": mape,
        "MAE_pct": (mae / mean_price) * 100 if mean_price else 0,
        "RMSE_pct": (rmse / mean_price) * 100 if mean_price else 0,
        "Direction_Accuracy": dir_acc,
    }
    return metrics, preds, actuals


def evaluate_stock(ticker: str, device: torch.device | None = None) -> dict:
    """Load a trained model, evaluate on test split, generate plot.

    Returns evaluation results dict with metrics, sample counts, and plot path.
    """
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    csv_path = DATA_DIR / f"{ticker}.csv"
    model, _, _, metadata = load_model(ticker, device)
    _, _, test_loader, info = build_dataloaders(str(csv_path))

    criterion = nn.HuberLoss(delta=1.0)
    _, preds_s, actuals_s, prev_s = run_evaluation(model, test_loader, criterion, device)

    metrics_capped, preds_inv, actuals_inv = compute_metrics(
        preds_s, actuals_s, prev_s, info["target_scaler"], apply_circuit_cap=True
    )
    metrics_raw, preds_raw, _ = compute_metrics(
        preds_s, actuals_s, prev_s, info["target_scaler"], apply_circuit_cap=False
    )

    _, cap_mask = apply_cap_batch(
        preds_raw,
        info["target_scaler"].inverse_transform(prev_s.reshape(-1, 1)).flatten(),
    )

    model_dir = MODELS_DIR / ticker
    model_dir.mkdir(parents=True, exist_ok=True)
    plot_path = plot_predictions(
        preds_inv, actuals_inv, ticker, metrics_capped, model_dir
    )

    logger.info(
        f"[{ticker}] Test (circuit-capped):  "
        f"MAE={metrics_capped['MAE']:.2f}  RMSE={metrics_capped['RMSE']:.2f}  "
        f"MAPE={metrics_capped['MAPE']:.2f}%  R2={metrics_capped['R2']:.4f}  "
        f"DirAcc={metrics_capped['Direction_Accuracy']:.1f}%"
    )
    logger.info(
        f"[{ticker}] Test (raw / no cap):    "
        f"MAE={metrics_raw['MAE']:.2f}  RMSE={metrics_raw['RMSE']:.2f}  "
        f"MAPE={metrics_raw['MAPE']:.2f}%  R2={metrics_raw['R2']:.4f}  "
        f"DirAcc={metrics_raw['Direction_Accuracy']:.1f}%"
    )
    logger.info(f"[{ticker}] Predictions capped: {cap_mask.sum()} / {len(cap_mask)}")

    return {
        "ticker": ticker,
        "metrics_capped": metrics_capped,
        "metrics_raw": metrics_raw,
        "n_capped": int(cap_mask.sum()),
        "n_samples": len(preds_inv),
        "plot_path": str(plot_path),
    }
