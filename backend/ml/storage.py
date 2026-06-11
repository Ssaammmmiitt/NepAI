"""Save and load trained models, scalers, and metadata to/from disk."""

import json
import pickle
import shutil
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta

import torch
from sklearn.preprocessing import RobustScaler

from ..config import MODELS_DIR, SEQ_LEN, BASE_FEATURES, ENGINEERED_FEATURES, ALL_FEATURES
from .model import StackedLSTMAttention, build_model

logger = logging.getLogger(__name__)


def _model_dir(ticker: str) -> Path:
    return MODELS_DIR / ticker


def save_model(
    ticker: str,
    model: StackedLSTMAttention,
    feature_scaler: RobustScaler,
    target_scaler: RobustScaler,
    metrics: dict,
    info: dict,
    training_time: float,
    epochs_trained: int,
    best_val_loss: float,
) -> Path:
    model_dir = _model_dir(ticker)
    model_dir.mkdir(parents=True, exist_ok=True)

    torch.save(model.state_dict(), model_dir / "model.pt")

    with open(model_dir / "scaler_feature.pkl", "wb") as f:
        pickle.dump(feature_scaler, f)
    with open(model_dir / "scaler_target.pkl", "wb") as f:
        pickle.dump(target_scaler, f)

    metadata = {
        "ticker": ticker,
        "date_created": datetime.now(timezone(timedelta(hours=5, minutes=45))).isoformat(),
        "accuracy": {
            "mae": round(metrics.get("MAE", 0), 4),
            "mape": round(metrics.get("MAPE", 0), 4),
            "r2": round(metrics.get("R2", 0), 4),
            "rmse": round(metrics.get("RMSE", 0), 4),
            "direction_accuracy": round(metrics.get("Direction_Accuracy", 0), 4),
        },
        "n_features": info.get("n_features", len(ALL_FEATURES)),
        "feature_cols": info.get("feature_cols", ALL_FEATURES),
        "training_rows": info.get("total_rows", 0),
        "seq_len": SEQ_LEN,
        "features": BASE_FEATURES,
        "engineered_features": ENGINEERED_FEATURES,
        "date_range": info.get("date_range", {}),
        "split_sizes": {
            "train": info.get("train_size", 0),
            "val": info.get("val_size", 0),
            "test": info.get("test_size", 0),
        },
        "training_time_sec": round(training_time, 1),
        "epochs_trained": epochs_trained,
        "best_val_loss": round(best_val_loss, 6),
    }

    with open(model_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Saved model for {ticker} -> {model_dir}")
    return model_dir


def load_model(
    ticker: str, device: torch.device
) -> tuple[StackedLSTMAttention, RobustScaler, RobustScaler, dict]:
    model_dir = _model_dir(ticker)

    with open(model_dir / "metadata.json") as f:
        metadata = json.load(f)

    n_features = metadata.get("n_features", len(ALL_FEATURES))
    model = build_model(n_features, device)
    state = torch.load(model_dir / "model.pt", map_location=device, weights_only=True)
    model.load_state_dict(state)
    model.eval()

    with open(model_dir / "scaler_feature.pkl", "rb") as f:
        feature_scaler = pickle.load(f)
    with open(model_dir / "scaler_target.pkl", "rb") as f:
        target_scaler = pickle.load(f)

    logger.info(f"Loaded model for {ticker} from {model_dir}")
    return model, feature_scaler, target_scaler, metadata


def model_exists(ticker: str) -> bool:
    d = _model_dir(ticker)
    return (d / "model.pt").exists() and (d / "metadata.json").exists()


def delete_model(ticker: str) -> None:
    d = _model_dir(ticker)
    if d.exists():
        shutil.rmtree(d)
        logger.info(f"Deleted model directory for {ticker}")


def load_metadata(ticker: str) -> dict | None:
    p = _model_dir(ticker) / "metadata.json"
    if not p.exists():
        return None
    with open(p) as f:
        return json.load(f)
