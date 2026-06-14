"""Centralized configuration: paths, model hyperparameters, feature lists."""

from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "companies"
METADATA_DIR = PROJECT_ROOT / "data" / "metadata"
MODELS_DIR = PROJECT_ROOT / "models"

# NEPSE Market Rule 
CIRCUIT_CAP = 0.15  # daily price movement cannot exceed +/-15%

# Model & Training Hyperparameters
HIDDEN_SIZE = 64
NUM_LAYERS = 2
DROPOUT = 0.2
LEARNING_RATE = 1e-3
ATTENTION_HEADS = 4

SEQ_LEN = 60
BATCH_SIZE = 64
EPOCHS = 150
PATIENCE = 15

TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

MIN_ROWS = 500
MIN_YEAR = 2020

# Features
BASE_FEATURES = ["open", "high", "low", "close", "per_change", "traded_quantity"]
ENGINEERED_FEATURES = ["ma_7", "ma_21", "volatility", "price_range"]
ALL_FEATURES = BASE_FEATURES + ENGINEERED_FEATURES
TARGET = "close"
