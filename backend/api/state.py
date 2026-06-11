"""App-wide state: data cache, ticker registry, training status tracker."""

import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd

from ..config import DATA_DIR, MODELS_DIR
from ..ml.preprocessing import load_stock_data
from ..ml.storage import load_metadata

logger = logging.getLogger(__name__)

STALE_DAYS = 7
NPT = timezone(timedelta(hours=5, minutes=45))


class AppState:
    def __init__(self):
        self.data_cache: dict[str, pd.DataFrame] = {}
        self.available_tickers: list[str] = []
        self.training_status: dict[str, str] = {}

    def scan_tickers(self):
        self.available_tickers = sorted(f.stem for f in DATA_DIR.glob("*.csv"))
        logger.info(f"Found {len(self.available_tickers)} stock CSVs in {DATA_DIR}")

    def stock_csv_exists(self, ticker: str) -> bool:
        return (DATA_DIR / f"{ticker}.csv").exists()

    def get_stock_csv_path(self, ticker: str) -> Path:
        return DATA_DIR / f"{ticker}.csv"

    def get_stock_data(self, ticker: str) -> pd.DataFrame:
        if ticker not in self.data_cache:
            csv_path = DATA_DIR / f"{ticker}.csv"
            self.data_cache[ticker] = load_stock_data(csv_path)
        return self.data_cache[ticker]

    def invalidate_cache(self, ticker: str):
        self.data_cache.pop(ticker, None)

    def get_all_models(self) -> list[dict]:
        models = []
        if not MODELS_DIR.exists():
            return models
        for model_dir in sorted(MODELS_DIR.iterdir()):
            if not model_dir.is_dir():
                continue
            meta = load_metadata(model_dir.name)
            if meta is None:
                continue
            meta["stale"] = is_stale(meta.get("date_created", ""))
            status = self.training_status.get(model_dir.name)
            if status:
                meta["training_status"] = status
            models.append(meta)
        return models

    def set_training_status(self, ticker: str, status: str):
        self.training_status[ticker] = status

    def get_training_status(self, ticker: str) -> str | None:
        return self.training_status.get(ticker)

    def clear_training_status(self, ticker: str):
        self.training_status.pop(ticker, None)


def is_stale(date_created_str: str) -> bool:
    if not date_created_str:
        return True
    try:
        dt = datetime.fromisoformat(date_created_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=NPT)
        return (datetime.now(NPT) - dt) > timedelta(days=STALE_DAYS)
    except (ValueError, TypeError):
        return True


app_state = AppState()
