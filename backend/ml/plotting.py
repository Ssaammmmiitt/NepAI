"""Visualization: predicted-vs-actual 2x2 plot saved to model directory."""

import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)


def plot_predictions(
    preds: np.ndarray,
    actuals: np.ndarray,
    stock_name: str,
    metrics: dict,
    save_dir: Path,
) -> Path:
    """Generate a 2x2 predictions plot and save to save_dir/predictions.png."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(2, 2, figsize=(16, 10))
    fig.suptitle(
        f"{stock_name}  |  MAE={metrics['MAE']:.2f}  "
        f"MAPE={metrics['MAPE']:.2f}%  R2={metrics['R2']:.4f}",
        fontsize=14,
        fontweight="bold",
    )

    axes[0, 0].plot(actuals, label="Actual", alpha=0.85, linewidth=1)
    axes[0, 0].plot(preds, label="Predicted", alpha=0.85, linewidth=1)
    axes[0, 0].set_title("Full Test Set")
    axes[0, 0].set_xlabel("Sample")
    axes[0, 0].set_ylabel("Close Price")
    axes[0, 0].legend()

    last_n = min(100, len(preds))
    axes[0, 1].plot(actuals[-last_n:], label="Actual", linewidth=1.5)
    axes[0, 1].plot(preds[-last_n:], label="Predicted", linewidth=1.5)
    axes[0, 1].set_title(f"Last {last_n} Points")
    axes[0, 1].set_xlabel("Sample")
    axes[0, 1].legend()

    errors = preds - actuals
    axes[1, 0].hist(errors, bins=50, alpha=0.7, edgecolor="black", color="#4C72B0")
    axes[1, 0].axvline(0, color="red", linestyle="--")
    axes[1, 0].set_title(f"Error Distribution (mean={errors.mean():.2f})")
    axes[1, 0].set_xlabel("Prediction Error")
    axes[1, 0].set_ylabel("Count")

    mn = min(actuals.min(), preds.min())
    mx = max(actuals.max(), preds.max())
    axes[1, 1].scatter(actuals, preds, alpha=0.35, s=12, color="#55A868")
    axes[1, 1].plot([mn, mx], [mn, mx], "r--", linewidth=1.5, label="Perfect")
    axes[1, 1].set_xlabel("Actual")
    axes[1, 1].set_ylabel("Predicted")
    axes[1, 1].set_title("Actual vs Predicted")
    axes[1, 1].legend()

    plt.tight_layout(rect=[0, 0, 1, 0.95])
    out_path = save_dir / "predictions.png"
    plt.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    logger.info(f"[{stock_name}] Saved predictions plot -> {out_path}")
    return out_path
