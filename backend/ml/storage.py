"""Save and load trained models, scalers, and metadata via Supabase DB + Storage."""

import json
import pickle
import shutil
import logging
import threading
from pathlib import Path
from datetime import datetime, timezone, timedelta

import torch
from sklearn.preprocessing import RobustScaler

from ..config import (
    MODEL_CACHE_DIR, MODEL_BUCKET_NAME, MODEL_TABLE_NAME,
    SEQ_LEN, BASE_FEATURES, ENGINEERED_FEATURES, ALL_FEATURES,
)
from ..supabase_client import supabase_client
from .model import StackedLSTMAttention, build_model

logger = logging.getLogger(__name__)

_ticker_locks: dict[str, threading.Lock] = {}
_locks_lock = threading.Lock()

_ARTIFACT_FILES = ["model.pt", "scaler_feature.pkl", "scaler_target.pkl"]


def _get_lock(ticker: str) -> threading.Lock:
    with _locks_lock:
        if ticker not in _ticker_locks:
            _ticker_locks[ticker] = threading.Lock()
        return _ticker_locks[ticker]


def _cache_dir(ticker: str) -> Path:
    return MODEL_CACHE_DIR / ticker


def _row_to_metadata(row: dict) -> dict:
    dc = row["date_created"]
    if not isinstance(dc, str):
        dc = dc.isoformat()
    return {
        "ticker": row["ticker"],
        "date_created": dc,
        "accuracy": {
            "mae": row.get("mae"),
            "mape": row.get("mape"),
            "r2": row.get("r2"),
            "rmse": row.get("rmse"),
            "direction_accuracy": row.get("direction_accuracy"),
        },
        "n_features": row.get("n_features"),
        "feature_cols": row.get("feature_cols"),
        "features": row.get("features"),
        "engineered_features": row.get("engineered_features"),
        "training_rows": row.get("training_rows"),
        "seq_len": row.get("seq_len"),
        "date_range": row.get("date_range"),
        "split_sizes": row.get("split_sizes"),
        "training_time_sec": row.get("training_time_sec"),
        "epochs_trained": row.get("epochs_trained"),
        "best_val_loss": row.get("best_val_loss"),
    }


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
    date_created = datetime.now(timezone(timedelta(hours=5, minutes=45))).isoformat()

    db_row = {
        "ticker": ticker,
        "date_created": date_created,
        "mae": round(metrics.get("MAE", 0), 4),
        "mape": round(metrics.get("MAPE", 0), 4),
        "r2": round(metrics.get("R2", 0), 4),
        "rmse": round(metrics.get("RMSE", 0), 4),
        "direction_accuracy": round(metrics.get("Direction_Accuracy", 0), 4),
        "n_features": info.get("n_features", len(ALL_FEATURES)),
        "feature_cols": info.get("feature_cols", ALL_FEATURES),
        "features": BASE_FEATURES,
        "engineered_features": ENGINEERED_FEATURES,
        "training_rows": info.get("total_rows", 0),
        "seq_len": SEQ_LEN,
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

    supabase_client.table(MODEL_TABLE_NAME).upsert(db_row).execute()

    cache = _cache_dir(ticker)
    cache.mkdir(parents=True, exist_ok=True)

    torch.save(model.state_dict(), cache / "model.pt")
    with open(cache / "scaler_feature.pkl", "wb") as f:
        pickle.dump(feature_scaler, f)
    with open(cache / "scaler_target.pkl", "wb") as f:
        pickle.dump(target_scaler, f)
    with open(cache / "metadata.json", "w") as f:
        json.dump({"date_created": date_created}, f)

    for name in ["model.pt", "scaler_feature.pkl", "scaler_target.pkl"]:
        with open(cache / name, "rb") as f:
            bucket_path = f"{ticker}/{name}"
            supabase_client.storage.from_(MODEL_BUCKET_NAME).upload(
                bucket_path, f.read(), {"upsert": "true"}
            )

    logger.info(f"Saved model for {ticker} -> DB + bucket + cache")
    return cache




def _ensure_local(ticker: str) -> Path:
    cache = _cache_dir(ticker)
    lock = _get_lock(ticker)

    with lock:
        try:
            result = (
                supabase_client.table(MODEL_TABLE_NAME)
                .select("date_created")
                .eq("ticker", ticker)
                .single()
                .execute()
            )
            db_date = result.data["date_created"]
        except Exception:
            if cache.exists() and (cache / "model.pt").exists():
                logger.warning(f"DB unreachable for {ticker}, using cached files")
                return cache
            raise

        meta_path = cache / "metadata.json"
        if meta_path.exists():
            with open(meta_path) as f:
                local_date = json.load(f).get("date_created")
            if local_date == db_date:
                return cache

        tmp = MODEL_CACHE_DIR / f"{ticker}__tmp"
        tmp.mkdir(parents=True, exist_ok=True)

        for name in _ARTIFACT_FILES:
            data = supabase_client.storage.from_(MODEL_BUCKET_NAME).download(
                f"{ticker}/{name}"
            )
            with open(tmp / name, "wb") as f:
                f.write(data)

        with open(tmp / "metadata.json", "w") as f:
            json.dump({"date_created": db_date}, f)

        if cache.exists():
            shutil.rmtree(cache)
        shutil.move(str(tmp), str(cache))

        logger.info(f"Downloaded fresh artifacts for {ticker} from bucket")
        return cache


def load_model(
    ticker: str, device: torch.device
) -> tuple[StackedLSTMAttention, RobustScaler, RobustScaler, dict]:
    _ensure_local(ticker)
    cache = _cache_dir(ticker)

    metadata = load_metadata(ticker)
    n_features = metadata.get("n_features", len(ALL_FEATURES))
    model = build_model(n_features, device)
    state = torch.load(cache / "model.pt", map_location=device, weights_only=True)
    model.load_state_dict(state)
    model.eval()

    with open(cache / "scaler_feature.pkl", "rb") as f:
        feature_scaler = pickle.load(f)
    with open(cache / "scaler_target.pkl", "rb") as f:
        target_scaler = pickle.load(f)

    logger.info(f"Loaded model for {ticker} from cache")
    return model, feature_scaler, target_scaler, metadata


def model_exists(ticker: str) -> bool:
    result = (
        supabase_client.table(MODEL_TABLE_NAME)
        .select("ticker")
        .eq("ticker", ticker)
        .execute()
    )
    return bool(result.data)


def delete_model(ticker: str) -> None:
    supabase_client.table(MODEL_TABLE_NAME).delete().eq("ticker", ticker).execute()

    try:
        files = supabase_client.storage.from_(MODEL_BUCKET_NAME).list(ticker)
        if files:
            paths = [f"{ticker}/{f['name']}" for f in files]
            supabase_client.storage.from_(MODEL_BUCKET_NAME).remove(paths)
    except Exception:
        logger.warning(f"Failed to remove bucket files for {ticker}")

    cache = _cache_dir(ticker)
    if cache.exists():
        shutil.rmtree(cache)

    logger.info(f"Deleted model for {ticker} (DB + bucket + cache)")


def load_metadata(ticker: str) -> dict | None:
    result = (
        supabase_client.table(MODEL_TABLE_NAME)
        .select("*")
        .eq("ticker", ticker)
        .execute()
    )
    if not result.data:
        return None
    return _row_to_metadata(result.data[0])


def invalidate_cache(ticker: str) -> None:
    cache = _cache_dir(ticker)
    if cache.exists():
        shutil.rmtree(cache)
        logger.info(f"Invalidated cache for {ticker}")
