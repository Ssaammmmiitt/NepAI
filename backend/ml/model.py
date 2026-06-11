"""StackedLSTM + Multi-Head Attention network architecture."""

import torch
import torch.nn as nn

from ..config import HIDDEN_SIZE, NUM_LAYERS, DROPOUT, ATTENTION_HEADS


class Attention(nn.Module):
    def __init__(self, hidden_size: int, num_heads: int = 4):
        super().__init__()
        self.mha = nn.MultiheadAttention(
            hidden_size, num_heads, batch_first=True, dropout=0.1
        )
        self.norm = nn.LayerNorm(hidden_size)

    def forward(self, x: torch.Tensor):
        attn_out, weights = self.mha(x, x, x)
        return self.norm(x + attn_out), weights


class StackedLSTMAttention(nn.Module):
    def __init__(
        self,
        n_features: int,
        hidden_size: int = 64,
        num_layers: int = 2,
        dropout: float = 0.2,
        num_heads: int = 4,
    ):
        super().__init__()
        self.input_proj = nn.Linear(n_features, hidden_size)
        self.lstm = nn.LSTM(
            hidden_size,
            hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
        )
        self.attention = Attention(hidden_size, num_heads)
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.input_proj(x)
        lstm_out, _ = self.lstm(x)
        attn_out, _ = self.attention(lstm_out)
        out = self.dropout(attn_out[:, -1, :])
        return self.fc(out).squeeze(-1)


def build_model(n_features: int, device: torch.device) -> StackedLSTMAttention:
    return StackedLSTMAttention(
        n_features=n_features,
        hidden_size=HIDDEN_SIZE,
        num_layers=NUM_LAYERS,
        dropout=DROPOUT,
        num_heads=ATTENTION_HEADS,
    ).to(device)
