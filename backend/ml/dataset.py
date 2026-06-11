"""PyTorch Dataset and DataLoader construction for stock sequences."""

from pathlib import Path

import numpy as np
import torch
from sklearn.preprocessing import RobustScaler
from torch.utils.data import Dataset, DataLoader

from ..config import SEQ_LEN, BATCH_SIZE, ALL_FEATURES, TARGET
from .preprocessing import load_stock_data, preprocess, split_data


class StockDataset(Dataset):
    """Sliding-window dataset. Returns (features_window, target, prev_target)."""

    def __init__(self, features: np.ndarray, targets: np.ndarray, seq_len: int):
        self.features = torch.FloatTensor(features)
        self.targets = torch.FloatTensor(targets)
        self.seq_len = seq_len

    def __len__(self):
        return max(0, len(self.features) - self.seq_len)

    def __getitem__(self, idx):
        x = self.features[idx : idx + self.seq_len]
        y = self.targets[idx + self.seq_len]
        prev_y = self.targets[idx + self.seq_len - 1]
        return x, y, prev_y


def build_dataloaders(filepath: str | Path):
    """Build train/val/test DataLoaders and return fitted scalers + metadata."""
    df = load_stock_data(filepath)
    df = preprocess(df)
    train_df, val_df, test_df = split_data(df)

    feature_scaler = RobustScaler()
    target_scaler = RobustScaler()
    feature_scaler.fit(train_df[ALL_FEATURES].values)
    target_scaler.fit(train_df[[TARGET]].values)

    def scale_split(split_df):
        feat = feature_scaler.transform(split_df[ALL_FEATURES].values)
        tgt = target_scaler.transform(split_df[[TARGET]].values).flatten()
        feat = np.nan_to_num(feat, nan=0.0, posinf=0.0, neginf=0.0)
        tgt = np.nan_to_num(tgt, nan=0.0, posinf=0.0, neginf=0.0)
        return feat, tgt

    tr_f, tr_t = scale_split(train_df)
    va_f, va_t = scale_split(val_df)
    te_f, te_t = scale_split(test_df)

    def make_loader(feat, tgt, shuffle, drop_last=False):
        ds = StockDataset(feat, tgt, SEQ_LEN)
        if len(ds) == 0:
            raise ValueError(
                f"Split too small for seq_len={SEQ_LEN}: only {len(feat)} rows"
            )
        return DataLoader(
            ds, batch_size=min(BATCH_SIZE, len(ds)), shuffle=shuffle, drop_last=drop_last
        )

    train_loader = make_loader(tr_f, tr_t, shuffle=True, drop_last=True)
    val_loader = make_loader(va_f, va_t, shuffle=False)
    test_loader = make_loader(te_f, te_t, shuffle=False)

    info = {
        "name": Path(filepath).stem,
        "feature_scaler": feature_scaler,
        "target_scaler": target_scaler,
        "n_features": len(ALL_FEATURES),
        "feature_cols": ALL_FEATURES,
        "train_size": len(train_df),
        "val_size": len(val_df),
        "test_size": len(test_df),
        "total_rows": len(df),
        "date_range": {
            "start": str(df["published_date"].min().date()),
            "end": str(df["published_date"].max().date()),
        },
    }
    return train_loader, val_loader, test_loader, info
