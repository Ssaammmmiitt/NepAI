"""CSV loading, feature engineering, and train/val/test splitting."""

import glob
import logging
from pathlib import Path

import pandas as pd

from ..config import (
    DATA_DIR, MIN_YEAR, MIN_ROWS, SEQ_LEN,
    TRAIN_RATIO, VAL_RATIO, ALL_FEATURES, TARGET,
)

logger = logging.getLogger(__name__)


def load_stock_data(filepath: str | Path) -> pd.DataFrame:
    df = pd.read_csv(filepath, parse_dates=["published_date"])
    df.sort_values("published_date", inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df = df[df["published_date"].dt.year >= MIN_YEAR]
    df.dropna(subset=["close"], inplace=True)

    for col in ["traded_amount", "status"]:
        if col in df.columns:
            df.drop(columns=[col], inplace=True)

    df["per_change"] = df["per_change"].fillna(0.0)
    for col in ["open", "high", "low", "traded_quantity"]:
        df[col] = df[col].ffill().bfill()

    df["ma_7"] = df["close"].rolling(7, min_periods=1).mean()
    df["ma_21"] = df["close"].rolling(21, min_periods=1).mean()
    df["volatility"] = df["close"].rolling(7, min_periods=1).std().fillna(0)
    df["price_range"] = df["high"] - df["low"]
    df["day_of_week"] = df["published_date"].dt.dayofweek

    df.dropna(subset=ALL_FEATURES + [TARGET], inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def split_data(df: pd.DataFrame):
    n = len(df)
    t1 = int(n * TRAIN_RATIO)
    t2 = int(n * (TRAIN_RATIO + VAL_RATIO))
    return df.iloc[:t1], df.iloc[t1:t2], df.iloc[t2:]


def list_stocks(data_dir: Path | None = None, n: int | None = None) -> list[str]:
    data_dir = data_dir or DATA_DIR
    files = sorted(glob.glob(str(data_dir / "*.csv")))
    min_needed = SEQ_LEN * 4
    valid = []
    for f in files:
        try:
            df = pd.read_csv(f, parse_dates=["published_date"])
            df = df[df["published_date"].dt.year >= MIN_YEAR]
            if len(df) >= max(MIN_ROWS, min_needed):
                valid.append(f)
        except Exception:
            pass
        if n and len(valid) == n:
            break
    return valid
