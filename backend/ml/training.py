"""Training loop: train model, evaluate with circuit cap, save artifacts + plot."""

import logging
import time

import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import ReduceLROnPlateau

from ..config import LEARNING_RATE, EPOCHS, PATIENCE
from .model import build_model
from .dataset import build_dataloaders
from .evaluation import run_evaluation, compute_metrics
from .plotting import plot_predictions
from .storage import save_model

logger = logging.getLogger(__name__)


class EarlyStopping:
    def __init__(self, patience: int = 15, min_delta: float = 1e-5):
        self.patience = patience
        self.min_delta = min_delta
        self.counter = 0
        self.best_loss: float | None = None

    def step(self, val_loss: float) -> bool:
        if self.best_loss is None or val_loss < self.best_loss - self.min_delta:
            self.best_loss = val_loss
            self.counter = 0
            return False
        self.counter += 1
        return self.counter >= self.patience


def _train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss = 0.0
    n_samples = 0
    for x, y, _ in loader:
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        loss = criterion(model(x), y)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        total_loss += loss.item() * x.size(0)
        n_samples += x.size(0)
    return total_loss / n_samples


def train_stock(
    filepath: str,
    device: torch.device | None = None,
    epochs: int | None = None,
    patience: int | None = None,
) -> dict:
    """End-to-end pipeline: load data, train, evaluate with circuit cap, save, plot.

    Returns a summary dict with metrics, paths, and timing info.
    """
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    _epochs = epochs or EPOCHS
    _patience = patience or PATIENCE

    train_loader, val_loader, test_loader, info = build_dataloaders(filepath)
    stock_name = info["name"]

    logger.info(
        f"[{stock_name}] Data loaded -- train={info['train_size']} "
        f"val={info['val_size']} test={info['test_size']} features={info['n_features']}"
    )

    model = build_model(info["n_features"], device)
    criterion = nn.HuberLoss(delta=1.0)
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=7)
    early_stop = EarlyStopping(patience=_patience)

    best_val = float("inf")
    best_state = None
    history = {"train_loss": [], "val_loss": [], "lr": []}
    start = time.time()

    for epoch in range(_epochs):
        train_loss = _train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, _, _, _ = run_evaluation(model, val_loader, criterion, device)
        scheduler.step(val_loss)
        cur_lr = optimizer.param_groups[0]["lr"]

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["lr"].append(cur_lr)

        if val_loss < best_val:
            best_val = val_loss
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        if (epoch + 1) % 20 == 0 or epoch == 0:
            logger.info(
                f"[{stock_name}] Epoch {epoch+1}/{_epochs}  "
                f"train={train_loss:.6f}  val={val_loss:.6f}  lr={cur_lr:.2e}"
            )

        if early_stop.step(val_loss):
            logger.info(f"[{stock_name}] Early stopping at epoch {epoch+1}")
            break

    elapsed = time.time() - start
    model.load_state_dict(best_state)
    model.to(device)

    # Evaluate on test set with circuit cap
    _, test_preds_s, test_actuals_s, test_prev_s = run_evaluation(
        model, test_loader, criterion, device
    )
    metrics_capped, preds_inv, actuals_inv = compute_metrics(
        test_preds_s, test_actuals_s, test_prev_s,
        info["target_scaler"], apply_circuit_cap=True,
    )
    metrics_raw, _, _ = compute_metrics(
        test_preds_s, test_actuals_s, test_prev_s,
        info["target_scaler"], apply_circuit_cap=False,
    )

    logger.info(
        f"[{stock_name}] Test (circuit-capped):  "
        f"MAE={metrics_capped['MAE']:.2f}  RMSE={metrics_capped['RMSE']:.2f}  "
        f"MAPE={metrics_capped['MAPE']:.2f}%  R2={metrics_capped['R2']:.4f}  "
        f"DirAcc={metrics_capped['Direction_Accuracy']:.1f}%"
    )
    logger.info(
        f"[{stock_name}] Test (raw / no cap):    "
        f"MAE={metrics_raw['MAE']:.2f}  RMSE={metrics_raw['RMSE']:.2f}  "
        f"MAPE={metrics_raw['MAPE']:.2f}%  R2={metrics_raw['R2']:.4f}  "
        f"DirAcc={metrics_raw['Direction_Accuracy']:.1f}%"
    )

    epochs_trained = len(history["train_loss"])

    # Save model artifacts
    model_dir = save_model(
        ticker=stock_name,
        model=model,
        feature_scaler=info["feature_scaler"],
        target_scaler=info["target_scaler"],
        metrics=metrics_capped,
        info=info,
        training_time=elapsed,
        epochs_trained=epochs_trained,
        best_val_loss=best_val,
    )

    # Generate predictions plot
    plot_path = plot_predictions(
        preds_inv, actuals_inv, stock_name, metrics_capped, model_dir
    )

    return {
        "ticker": stock_name,
        "model_dir": str(model_dir),
        "metrics_capped": metrics_capped,
        "metrics_raw": metrics_raw,
        "training_time_sec": round(elapsed, 1),
        "epochs_trained": epochs_trained,
        "best_val_loss": round(best_val, 6),
        "plot_path": str(plot_path),
    }
