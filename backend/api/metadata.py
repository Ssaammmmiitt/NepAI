"""Stock metadata lookup: human-readable names and sector labels from data/metadata/."""

import json
import logging
from functools import lru_cache

from ..config import METADATA_DIR

logger = logging.getLogger(__name__)

_name_data: dict[str, dict] = {}
_sector_mappings: dict[str, str] = {}


def load_metadata_files() -> None:
    """Load name_data.json and sector_mappings.json into memory.

    Called once at startup.  Tolerant of missing files so the server
    can still boot (lookups will simply return None).
    """
    global _name_data, _sector_mappings

    name_path = METADATA_DIR / "name_data.json"
    sector_path = METADATA_DIR / "sector_mappings.json"

    try:
        with open(name_path, encoding="utf-8") as f:
            _name_data = json.load(f)
        logger.info("Loaded %d entries from name_data.json", len(_name_data))
    except Exception as exc:
        logger.warning("Could not load name_data.json: %s", exc)
        _name_data = {}

    try:
        with open(sector_path, encoding="utf-8") as f:
            _sector_mappings = json.load(f)
        logger.info("Loaded %d sectors from sector_mappings.json", len(_sector_mappings))
    except Exception as exc:
        logger.warning("Could not load sector_mappings.json: %s", exc)
        _sector_mappings = {}


def get_stock_name(ticker: str) -> str | None:
    """Return the full company name for a ticker, or None if unknown."""
    entry = _name_data.get(ticker)
    return entry["name"] if entry else None


def get_stock_sector(ticker: str) -> str | None:
    """Return the human-readable sector label for a ticker, or None if unknown."""
    entry = _name_data.get(ticker)
    if entry is None:
        return None
    sector_id = str(entry.get("sector", ""))
    return _sector_mappings.get(sector_id)


def enrich(ticker: str, data: dict) -> dict:
    """Add stock_name and stock_sector keys to an existing response dict."""
    data["stock_name"] = get_stock_name(ticker)
    data["stock_sector"] = get_stock_sector(ticker)
    return data
