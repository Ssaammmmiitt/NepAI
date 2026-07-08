"""App-wide state: data cache, ticker registry, training status tracker."""

import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd

from ..config import DATA_DIR, MODEL_TABLE_NAME
from ..supabase_client import supabase_client
from ..ml.preprocessing import load_stock_data
from ..ml.storage import _row_to_metadata

logger = logging.getLogger(__name__)

STALE_DAYS = 30
NPT = timezone(timedelta(hours=5, minutes=45))


class AppState:
    def __init__(self):
        self.data_cache: dict[str, pd.DataFrame] = {}
        self.available_tickers: list[str] = []
        self.training_status: dict[str, str] = {}
        self._latest_data_date: str | None = None

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
        self._latest_data_date = None

    def get_latest_data_date(self) -> str | None:
        if self._latest_data_date is not None:
            return self._latest_data_date
        latest: pd.Timestamp | None = None
        sample = self.available_tickers[:50]
        for ticker in sample:
            try:
                df = self.get_stock_data(ticker)
                if df.empty:
                    continue
                last = df["published_date"].iloc[-1]
                if latest is None or last > latest:
                    latest = last
            except Exception:
                continue
        self._latest_data_date = str(latest.date()) if latest is not None else None
        return self._latest_data_date

    def get_all_models(self) -> list[dict]:
        result = (
            supabase_client.table(MODEL_TABLE_NAME)
            .select("*")
            .order("ticker")
            .execute()
        )
        models = []
        for row in result.data or []:
            meta = _row_to_metadata(row)
            meta["stale"] = is_stale(meta.get("date_created", ""))
            status = self.training_status.get(meta["ticker"])
            if status:
                meta["training_status"] = status
            models.append(meta)
        return models

    def get_model_count(self) -> int:
        result = (
            supabase_client.table(MODEL_TABLE_NAME)
            .select("ticker", count="exact")
            .execute()
        )
        return result.count or 0

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
