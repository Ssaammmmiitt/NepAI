"""Bulk training script: train models for all (or selected) stock tickers.

Usage:
    Train all stocks from name_data.json:
        python train_all.py

    Train specific stocks only:
        python train_all.py NABIL ADBL GBIME

    Skip stocks that already have a model in the DB:
        python train_all.py --skip-existing

    Combine both:
        python train_all.py NABIL ADBL --skip-existing
"""

import sys
import json
import time
import logging

from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from backend.config import DATA_DIR, METADATA_DIR, MIN_ROWS
from backend.ml.preprocessing import load_stock_data, preprocess
from backend.ml.training import train_stock
from backend.ml.storage import delete_model, model_exists


def get_all_tickers() -> list[str]:
    with open(METADATA_DIR / "name_data.json") as f:
        data = json.load(f)
    return sorted(data.keys())


def is_trainable(ticker: str) -> bool:
    csv_path = DATA_DIR / f"{ticker}.csv"
    if not csv_path.exists():
        return False
    try:
        df = load_stock_data(csv_path)
        df = preprocess(df)
        return len(df) >= MIN_ROWS
    except Exception:
        return False


def train_one(ticker: str) -> dict | None:
    csv_path = DATA_DIR / f"{ticker}.csv"
    try:
        delete_model(ticker)
        result = train_stock(filepath=str(csv_path))
        return result
    except Exception as e:
        logger.error(f"[{ticker}] Training failed: {e}")
        return None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    skip_existing = "--skip-existing" in sys.argv

    if args:
        tickers = [t.upper() for t in args]
        logger.info(f"Manual selection: {tickers}")
    else:
        tickers = get_all_tickers()
        logger.info(f"Loaded {len(tickers)} tickers from name_data.json")

    trainable = []
    skipped_no_data = []
    skipped_existing = []

    for ticker in tickers:
        if skip_existing and model_exists(ticker):
            skipped_existing.append(ticker)
            continue
        if not is_trainable(ticker):
            skipped_no_data.append(ticker)
            continue
        trainable.append(ticker)

    logger.info(f"Trainable: {len(trainable)} | Skipped (no data/<{MIN_ROWS} rows): {len(skipped_no_data)} | Skipped (existing): {len(skipped_existing)}")

    if not trainable:
        logger.info("Nothing to train.")
        return

    succeeded = []
    failed = []
    total_start = time.time()

    for i, ticker in enumerate(trainable, 1):
        logger.info(f"[{i}/{len(trainable)}] Training {ticker}...")
        start = time.time()
        result = train_one(ticker)
        elapsed = time.time() - start

        if result:
            metrics = result.get("metrics_capped", {})
            logger.info(
                f"[{ticker}] Done in {elapsed:.1f}s | "
                f"MAE={metrics.get('MAE', 0):.2f} MAPE={metrics.get('MAPE', 0):.2f}% "
                f"R2={metrics.get('R2', 0):.4f}"
            )
            succeeded.append(ticker)
        else:
            failed.append(ticker)

    total_elapsed = time.time() - total_start
    logger.info(f"Finished in {total_elapsed:.1f}s | Succeeded: {len(succeeded)} | Failed: {len(failed)}")
    if failed:
        logger.info(f"Failed tickers: {failed}")


if __name__ == "__main__":
    main()
