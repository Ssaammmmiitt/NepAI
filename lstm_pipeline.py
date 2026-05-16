# %%
# CELL 1: Imports and Configuration

import os, glob, json, time, warnings, logging
from datetime import datetime
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import MinMaxScaler, RobustScaler
from sklearn.metrics import (mean_absolute_error, mean_squared_error,
                             r2_score, mean_absolute_percentage_error)
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torch.optim.lr_scheduler import ReduceLROnPlateau

warnings.filterwarnings('ignore')
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Device: {DEVICE}")
if torch.cuda.is_available():
    for i in range(torch.cuda.device_count()):
        print(f"GPU {i}: {torch.cuda.get_device_name(i)}")

CONFIG = {
    'data_dir': '/kaggle/input/datasets/ibliss/nepai-stock/company-wise',
    'seq_len': 60,
    'forecast_horizon': 1,
    'train_ratio': 0.7,
    'val_ratio': 0.15,
    'test_ratio': 0.15,
    'batch_size': 64,
    'epochs': 150,
    'lr': 1e-3,
    'patience': 15,
    'min_rows': 500,
    'features': ['open', 'high', 'low', 'close', 'per_change', 'traded_quantity'],
    'target': 'close',
    'scaler_type': 'robust',
    'hidden_size': 128,
    'num_layers': 3,
    'dropout': 0.3,
    'cnn_filters': 64,
    'cnn_kernel': 3,
    'attention_heads': 4,
}


LOG_DIR = Path('logs') / datetime.now().strftime('%Y%m%d_%H%M%S')
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / 'training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
logger.info(f"Config: {json.dumps(CONFIG, indent=2)}")

# %%
# CELL 2: Data Loading and Preprocessing

def load_stock_data(filepath):
    df = pd.read_csv(filepath, parse_dates=['published_date'])
    df.sort_values('published_date', inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df

def preprocess(df):
    df = df.copy()
    df.dropna(subset=['close'], inplace=True)
    if 'traded_amount' in df.columns:
        df.drop(columns=['traded_amount'], inplace=True)
    if 'status' in df.columns:
        df.drop(columns=['status'], inplace=True)
    df['per_change'] = df['per_change'].fillna(0.0)
    for col in ['open', 'high', 'low', 'traded_quantity']:
        df[col] = df[col].ffill().bfill()
    df['ma_7'] = df['close'].rolling(7, min_periods=1).mean()
    df['ma_21'] = df['close'].rolling(21, min_periods=1).mean()
    df['volatility'] = df['close'].rolling(7, min_periods=1).std().fillna(0)
    df['price_range'] = df['high'] - df['low']
    df['day_of_week'] = df['published_date'].dt.dayofweek
    # Final NaN cleanup - drop any rows with NaN in feature or target columns
    feature_cols = get_feature_cols()
    df.dropna(subset=feature_cols + [CONFIG['target']], inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df

def get_feature_cols():
    base = CONFIG['features']
    extra = ['ma_7', 'ma_21', 'volatility', 'price_range', 'day_of_week']
    return base + extra

def create_scalers(df, feature_cols):
    ScalerClass = RobustScaler if CONFIG['scaler_type'] == 'robust' else MinMaxScaler
    feature_scaler = ScalerClass()
    target_scaler = ScalerClass()
    feature_scaler.fit(df[feature_cols].values)
    target_scaler.fit(df[[CONFIG['target']]].values)
    return feature_scaler, target_scaler

def split_data(df):
    n = len(df)
    t1 = int(n * CONFIG['train_ratio'])
    t2 = int(n * (CONFIG['train_ratio'] + CONFIG['val_ratio']))
    return df.iloc[:t1], df.iloc[t1:t2], df.iloc[t2:]

def list_stocks():
    files = sorted(glob.glob(os.path.join(CONFIG['data_dir'], '*.csv')))
    valid = []
    for f in files:
        df = pd.read_csv(f)
        if len(df) >= CONFIG['min_rows']:
            valid.append(f)
    logger.info(f"Found {len(valid)} stocks with >= {CONFIG['min_rows']} rows out of {len(files)} total")
    return valid

# %%
# CELL 3: PyTorch Dataset

class StockDataset(Dataset):
    def __init__(self, features, targets, seq_len):
        self.features = torch.FloatTensor(features)
        self.targets = torch.FloatTensor(targets)
        self.seq_len = seq_len

    def __len__(self):
        return len(self.features) - self.seq_len

    def __getitem__(self, idx):
        x = self.features[idx:idx + self.seq_len]
        y = self.targets[idx + self.seq_len]
        return x, y

def build_dataloaders(filepath):
    df = load_stock_data(filepath)
    df = preprocess(df)
    feature_cols = get_feature_cols()
    train_df, val_df, test_df = split_data(df)
    feature_scaler, target_scaler = create_scalers(train_df, feature_cols)

    def scale_split(split_df):
        feat = feature_scaler.transform(split_df[feature_cols].values)
        tgt = target_scaler.transform(split_df[[CONFIG['target']]].values).flatten()
        feat = np.nan_to_num(feat, nan=0.0, posinf=0.0, neginf=0.0)
        tgt = np.nan_to_num(tgt, nan=0.0, posinf=0.0, neginf=0.0)
        return feat, tgt

    tr_f, tr_t = scale_split(train_df)
    va_f, va_t = scale_split(val_df)
    te_f, te_t = scale_split(test_df)

    sl = CONFIG['seq_len']
    bs = CONFIG['batch_size']
    train_ds = StockDataset(tr_f, tr_t, sl)
    val_ds = StockDataset(va_f, va_t, sl)
    test_ds = StockDataset(te_f, te_t, sl)

    train_loader = DataLoader(train_ds, batch_size=bs, shuffle=True, drop_last=True)
    val_loader = DataLoader(val_ds, batch_size=bs, shuffle=False)
    test_loader = DataLoader(test_ds, batch_size=bs, shuffle=False)

    info = {
        'name': Path(filepath).stem,
        'feature_scaler': feature_scaler,
        'target_scaler': target_scaler,
        'n_features': len(feature_cols),
        'train_size': len(train_ds),
        'val_size': len(val_ds),
        'test_size': len(test_ds),
        'dates': {
            'train': train_df['published_date'].values,
            'val': val_df['published_date'].values,
            'test': test_df['published_date'].values,
        }
    }
    return train_loader, val_loader, test_loader, info

# %%
# CELL 4: Model Architectures

class Attention(nn.Module):
    def __init__(self, hidden_size, num_heads=4):
        super().__init__()
        self.mha = nn.MultiheadAttention(hidden_size, num_heads, batch_first=True, dropout=0.1)
        self.norm = nn.LayerNorm(hidden_size)

    def forward(self, x):
        attn_out, weights = self.mha(x, x, x)
        return self.norm(x + attn_out), weights


class StackedLSTMAttention(nn.Module):
    def __init__(self, n_features, hidden_size=128, num_layers=3, dropout=0.3, num_heads=4):
        super().__init__()
        self.name = "StackedLSTM_Attention"
        self.input_proj = nn.Linear(n_features, hidden_size)
        self.lstm = nn.LSTM(
            hidden_size, hidden_size, num_layers=num_layers,
            batch_first=True, dropout=dropout if num_layers > 1 else 0
        )
        self.attention = Attention(hidden_size, num_heads)
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, 1)
        )

    def forward(self, x):
        x = self.input_proj(x)
        lstm_out, _ = self.lstm(x)
        attn_out, self.attn_weights = self.attention(lstm_out)
        out = self.dropout(attn_out[:, -1, :])
        return self.fc(out).squeeze(-1)


class CNNLSTMModel(nn.Module):
    def __init__(self, n_features, hidden_size=128, num_layers=2, dropout=0.3,
                 cnn_filters=64, kernel_size=3):
        super().__init__()
        self.name = "CNN_LSTM"
        self.cnn = nn.Sequential(
            nn.Conv1d(n_features, cnn_filters, kernel_size, padding=kernel_size // 2),
            nn.BatchNorm1d(cnn_filters),
            nn.GELU(),
            nn.Conv1d(cnn_filters, cnn_filters * 2, kernel_size, padding=kernel_size // 2),
            nn.BatchNorm1d(cnn_filters * 2),
            nn.GELU(),
            nn.MaxPool1d(2),
            nn.Dropout(dropout),
        )
        self.lstm = nn.LSTM(
            cnn_filters * 2, hidden_size, num_layers=num_layers,
            batch_first=True, dropout=dropout if num_layers > 1 else 0
        )
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, 1)
        )

    def forward(self, x):
        x = x.permute(0, 2, 1)
        x = self.cnn(x)
        x = x.permute(0, 2, 1)
        lstm_out, _ = self.lstm(x)
        out = self.dropout(lstm_out[:, -1, :])
        return self.fc(out).squeeze(-1)


class BiLSTMAttention(nn.Module):
    def __init__(self, n_features, hidden_size=128, num_layers=2, dropout=0.3, num_heads=4):
        super().__init__()
        self.name = "BiLSTM_Attention"
        self.input_proj = nn.Linear(n_features, hidden_size)
        self.lstm = nn.LSTM(
            hidden_size, hidden_size, num_layers=num_layers,
            batch_first=True, dropout=dropout if num_layers > 1 else 0,
            bidirectional=True
        )
        self.proj = nn.Linear(hidden_size * 2, hidden_size)
        self.attention = Attention(hidden_size, num_heads)
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, 1)
        )

    def forward(self, x):
        x = self.input_proj(x)
        lstm_out, _ = self.lstm(x)
        lstm_out = self.proj(lstm_out)
        attn_out, self.attn_weights = self.attention(lstm_out)
        out = self.dropout(attn_out[:, -1, :])
        return self.fc(out).squeeze(-1)


def build_models(n_features):
    c = CONFIG
    models = {
        'StackedLSTM_Attention': StackedLSTMAttention(
            n_features, c['hidden_size'], c['num_layers'], c['dropout'], c['attention_heads']
        ),
        'CNN_LSTM': CNNLSTMModel(
            n_features, c['hidden_size'], c['num_layers'], c['dropout'],
            c['cnn_filters'], c['cnn_kernel']
        ),
        'BiLSTM_Attention': BiLSTMAttention(
            n_features, c['hidden_size'], c['num_layers'], c['dropout'], c['attention_heads']
        ),
    }
    for name, m in models.items():
        m = m.to(DEVICE)
        params = sum(p.numel() for p in m.parameters() if p.requires_grad)
        logger.info(f"{name}: {params:,} trainable parameters")
        models[name] = m
    return models

# %%
# CELL 5: Training Engine

class EarlyStopping:
    def __init__(self, patience=15, min_delta=1e-5):
        self.patience = patience
        self.min_delta = min_delta
        self.counter = 0
        self.best_loss = None
        self.triggered = False

    def step(self, val_loss):
        if self.best_loss is None or val_loss < self.best_loss - self.min_delta:
            self.best_loss = val_loss
            self.counter = 0
            return False
        self.counter += 1
        if self.counter >= self.patience:
            self.triggered = True
            return True
        return False


def train_one_epoch(model, loader, criterion, optimizer):
    model.train()
    total_loss = 0
    for x, y in loader:
        x, y = x.to(DEVICE), y.to(DEVICE)
        optimizer.zero_grad()
        pred = model(x)
        loss = criterion(pred, y)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        total_loss += loss.item() * x.size(0)
    return total_loss / len(loader.dataset)


def evaluate(model, loader, criterion):
    model.eval()
    total_loss = 0
    preds, actuals = [], []
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(DEVICE), y.to(DEVICE)
            pred = model(x)
            loss = criterion(pred, y)
            total_loss += loss.item() * x.size(0)
            preds.append(pred.cpu().numpy())
            actuals.append(y.cpu().numpy())
    avg_loss = total_loss / len(loader.dataset)
    return avg_loss, np.concatenate(preds), np.concatenate(actuals)


def train_model(model, train_loader, val_loader, model_name, stock_name):
    criterion = nn.HuberLoss(delta=1.0)
    optimizer = optim.AdamW(model.parameters(), lr=CONFIG['lr'], weight_decay=1e-4)
    scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=7)
    early_stop = EarlyStopping(patience=CONFIG['patience'])

    history = {'train_loss': [], 'val_loss': [], 'lr': []}
    best_val = float('inf')
    best_state = None
    start = time.time()

    for epoch in range(CONFIG['epochs']):
        train_loss = train_one_epoch(model, train_loader, criterion, optimizer)
        val_loss, _, _ = evaluate(model, val_loader, criterion)
        scheduler.step(val_loss)
        cur_lr = optimizer.param_groups[0]['lr']
        history['train_loss'].append(train_loss)
        history['val_loss'].append(val_loss)
        history['lr'].append(cur_lr)

        if val_loss < best_val:
            best_val = val_loss
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        if (epoch + 1) % 20 == 0 or epoch == 0:
            logger.info(
                f"[{stock_name}][{model_name}] Epoch {epoch+1}/{CONFIG['epochs']} "
                f"Train: {train_loss:.6f} Val: {val_loss:.6f} LR: {cur_lr:.2e}"
            )

        if early_stop.step(val_loss):
            logger.info(f"[{stock_name}][{model_name}] Early stopping at epoch {epoch+1}")
            break

    elapsed = time.time() - start
    logger.info(f"[{stock_name}][{model_name}] Training done in {elapsed:.1f}s, best val: {best_val:.6f}")
    model.load_state_dict(best_state)
    model.to(DEVICE)
    return model, history

# %%
# CELL 6: Metrics

def compute_metrics(preds_scaled, actuals_scaled, target_scaler):
    preds = target_scaler.inverse_transform(preds_scaled.reshape(-1, 1)).flatten()
    actuals = target_scaler.inverse_transform(actuals_scaled.reshape(-1, 1)).flatten()
    mae = mean_absolute_error(actuals, preds)
    mse = mean_squared_error(actuals, preds)
    rmse = np.sqrt(mse)
    r2 = r2_score(actuals, preds)
    mape = mean_absolute_percentage_error(actuals, preds) * 100
    mean_price = np.mean(np.abs(actuals))
    mae_pct = (mae / mean_price) * 100
    rmse_pct = (rmse / mean_price) * 100
    actual_dir = np.sign(np.diff(actuals))
    pred_dir = np.sign(np.diff(preds))
    dir_acc = np.mean(actual_dir == pred_dir) * 100

    metrics = {
        'MAE': mae,
        'MSE': mse,
        'RMSE': rmse,
        'R2': r2,
        'MAPE': mape,
        'MAE_pct': mae_pct,
        'RMSE_pct': rmse_pct,
        'Direction_Accuracy': dir_acc,
    }
    return metrics, preds, actuals


def log_metrics(metrics, model_name, stock_name, split='test'):
    logger.info(f"\n[{stock_name}][{model_name}] {split.upper()} Metrics:")
    for k, v in metrics.items():
        logger.info(f"  {k}: {v:.4f}")

# %%
# CELL 7: Visualization

def plot_training_history(history, model_name, stock_name, save_dir):
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    axes[0].plot(history['train_loss'], label='Train', linewidth=1.5)
    axes[0].plot(history['val_loss'], label='Val', linewidth=1.5)
    axes[0].set_title(f'{stock_name} | {model_name} | Loss')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].legend()

    axes[1].plot(history['lr'], color='orange', linewidth=1.5)
    axes[1].set_title('Learning Rate')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('LR')

    plt.tight_layout()
    plt.savefig(save_dir / f'{stock_name}_{model_name}_history.png', dpi=150, bbox_inches='tight')
    plt.show()
    plt.close()


def plot_predictions(preds, actuals, model_name, stock_name, save_dir, split='test'):
    fig, axes = plt.subplots(2, 2, figsize=(16, 10))
    axes[0, 0].plot(actuals, label='Actual', alpha=0.8, linewidth=1)
    axes[0, 0].plot(preds, label='Predicted', alpha=0.8, linewidth=1)
    axes[0, 0].set_title(f'{stock_name} | {model_name} | {split}')
    axes[0, 0].legend()

    last_n = min(100, len(preds))
    axes[0, 1].plot(actuals[-last_n:], label='Actual', linewidth=1.5)
    axes[0, 1].plot(preds[-last_n:], label='Predicted', linewidth=1.5)
    axes[0, 1].set_title(f'Last {last_n} Points')
    axes[0, 1].legend()

    errors = preds - actuals
    axes[1, 0].hist(errors, bins=50, alpha=0.7, edgecolor='black')
    axes[1, 0].axvline(0, color='red', linestyle='--')
    axes[1, 0].set_title('Error Distribution')

    axes[1, 1].scatter(actuals, preds, alpha=0.3, s=10)
    mn, mx = min(actuals.min(), preds.min()), max(actuals.max(), preds.max())
    axes[1, 1].plot([mn, mx], [mn, mx], 'r--', linewidth=1.5)
    axes[1, 1].set_xlabel('Actual')
    axes[1, 1].set_ylabel('Predicted')
    axes[1, 1].set_title('Actual vs Predicted')

    plt.tight_layout()
    plt.savefig(save_dir / f'{stock_name}_{model_name}_predictions.png', dpi=150, bbox_inches='tight')
    plt.show()
    plt.close()


def plot_model_comparison(all_results, save_dir, title_prefix=""):
    """Plot model comparison with 2 charts per row for readability."""
    if not all_results:
        return None
    rows = []
    for r in all_results:
        rows.append({
            'Stock': r['stock'],
            'Model': r['model'],
            'MAE': r['metrics']['MAE'],
            'MSE': r['metrics']['MSE'],
            'RMSE': r['metrics']['RMSE'],
            'R2': r['metrics']['R2'],
            'MAPE': r['metrics']['MAPE'],
            'Dir_Acc': r['metrics']['Direction_Accuracy'],
        })
    df = pd.DataFrame(rows)
    df = df.drop_duplicates(subset=['Stock', 'Model'], keep='last')

    metric_cols = ['MAE', 'MSE', 'RMSE', 'R2', 'MAPE', 'Dir_Acc']
    n_metrics = len(metric_cols)
    n_cols = 2
    n_rows = (n_metrics + n_cols - 1) // n_cols

    fig, axes = plt.subplots(n_rows, n_cols, figsize=(14, 6 * n_rows))
    axes = axes.flatten()
    for i, col in enumerate(metric_cols):
        pivot = df.pivot_table(index='Stock', columns='Model', values=col, aggfunc='last')
        pivot.plot(kind='bar', ax=axes[i], rot=45)
        axes[i].set_title(f'{title_prefix}{col}', fontsize=13, fontweight='bold')
        axes[i].legend(fontsize=8)
        axes[i].tick_params(axis='x', labelsize=8)
    # Hide unused subplots
    for j in range(n_metrics, len(axes)):
        axes[j].set_visible(False)

    plt.tight_layout()
    fname = f'{title_prefix.strip().replace(" ", "_")}model_comparison.png' if title_prefix else 'model_comparison.png'
    plt.savefig(save_dir / fname, dpi=150, bbox_inches='tight')
    plt.show()
    plt.close()

    return df

# %%
# CELL 8: Single Stock Pipeline

def run_single_stock(filepath, models_dict=None):
    stock_name = Path(filepath).stem
    stock_dir = LOG_DIR / stock_name
    stock_dir.mkdir(exist_ok=True)
    logger.info(f"\n{'='*60}")
    logger.info(f"Processing: {stock_name}")
    logger.info(f"{'='*60}")

    train_loader, val_loader, test_loader, info = build_dataloaders(filepath)
    logger.info(f"  Train: {info['train_size']}, Val: {info['val_size']}, Test: {info['test_size']}")

    if models_dict is None:
        models_dict = build_models(info['n_features'])

    criterion = nn.HuberLoss(delta=1.0)
    results = []

    for model_name, model in models_dict.items():
        logger.info(f"\nTraining {model_name} on {stock_name}")
        model, history = train_model(model, train_loader, val_loader, model_name, stock_name)
        plot_training_history(history, model_name, stock_name, stock_dir)

        _, test_preds, test_actuals = evaluate(model, test_loader, criterion)
        metrics, preds_inv, actuals_inv = compute_metrics(
            test_preds, test_actuals, info['target_scaler']
        )
        log_metrics(metrics, model_name, stock_name)

        plot_predictions(preds_inv, actuals_inv, model_name, stock_name, stock_dir)

        results.append({
            'stock': stock_name,
            'model': model_name,
            'metrics': metrics,
            'history': history,
        })

        torch.save(model.state_dict(), stock_dir / f'{model_name}_best.pt')

    return results, models_dict

# %%
# CELL 9: Helper Functions

ALL_MODEL_NAMES = ['StackedLSTM_Attention', 'CNN_LSTM', 'BiLSTM_Attention']

HYPERPARAM_SEARCH_SPACE = [
    {'hidden_size': 64,  'num_layers': 2, 'dropout': 0.2,  'lr': 1e-3},
    {'hidden_size': 128, 'num_layers': 2, 'dropout': 0.3,  'lr': 1e-3},
    {'hidden_size': 128, 'num_layers': 3, 'dropout': 0.3,  'lr': 5e-4},
    {'hidden_size': 256, 'num_layers': 2, 'dropout': 0.4,  'lr': 5e-4},
    {'hidden_size': 256, 'num_layers': 3, 'dropout': 0.3,  'lr': 1e-4},
    {'hidden_size': 128, 'num_layers': 4, 'dropout': 0.35, 'lr': 5e-4},
]

def build_model_by_name(name, n_features, params=None):
    """Build a model by name, optionally with custom hyperparameters."""
    p = params or CONFIG
    if name == 'StackedLSTM_Attention':
        return StackedLSTMAttention(
            n_features, p['hidden_size'], p['num_layers'],
            p['dropout'], p.get('attention_heads', CONFIG['attention_heads'])
        ).to(DEVICE)
    elif name == 'CNN_LSTM':
        return CNNLSTMModel(
            n_features, p['hidden_size'], p['num_layers'],
            p['dropout'], p.get('cnn_filters', CONFIG['cnn_filters']),
            p.get('cnn_kernel', CONFIG['cnn_kernel'])
        ).to(DEVICE)
    else:
        return BiLSTMAttention(
            n_features, p['hidden_size'], p['num_layers'],
            p['dropout'], p.get('attention_heads', CONFIG['attention_heads'])
        ).to(DEVICE)


def compute_composite_score(metrics_dict):
    """Lower is better. Composite of normalized MSE, RMSE, MAPE."""
    mse = metrics_dict.get('MSE', 0)
    rmse = metrics_dict.get('RMSE', 0)
    mape = metrics_dict.get('MAPE', 0)
    # Normalize by rough scale: MSE can be huge, so use log
    import math
    log_mse = math.log1p(mse)
    log_rmse = math.log1p(rmse)
    return log_mse + log_rmse + mape

# %%
# CELL 10: Data Exploration

stock_files = list_stocks()

sample_file = stock_files[0]
sample_name = Path(sample_file).stem
raw_df = load_stock_data(sample_file)
print(f"Stock: {sample_name}")
print(f"Shape: {raw_df.shape}")
print(f"Date range: {raw_df['published_date'].min()} to {raw_df['published_date'].max()}")
print(f"\nColumn dtypes:\n{raw_df.dtypes}")
print(f"\nNull counts:\n{raw_df.isnull().sum()}")
print(f"\nBasic stats:\n{raw_df.describe().round(2)}")
print(f"\nFirst 5 rows:\n{raw_df.head()}")
print(f"\ntraded_amount zero ratio: {(raw_df['traded_amount'] == 0).mean():.2%}")
print(f"status distribution:\n{raw_df['status'].value_counts()}")

fig, axes = plt.subplots(2, 3, figsize=(18, 10))
axes[0, 0].plot(raw_df['published_date'], raw_df['close'], linewidth=0.8)
axes[0, 0].set_title(f'{sample_name} Close Price')
axes[0, 1].plot(raw_df['published_date'], raw_df['traded_quantity'], linewidth=0.5, alpha=0.7)
axes[0, 1].set_title('Traded Quantity')
axes[0, 2].hist(raw_df['per_change'].dropna(), bins=80, edgecolor='black', alpha=0.7)
axes[0, 2].set_title('% Change Distribution')
axes[1, 0].plot(raw_df['published_date'], raw_df['high'] - raw_df['low'], linewidth=0.5, alpha=0.7)
axes[1, 0].set_title('Daily Range (High-Low)')
corr = raw_df[['open', 'high', 'low', 'close', 'traded_quantity', 'per_change']].corr()
sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', ax=axes[1, 1], cbar=False)
axes[1, 1].set_title('Correlation Matrix')
proc_df = preprocess(raw_df)
feature_cols = get_feature_cols()
axes[1, 2].bar(feature_cols, proc_df[feature_cols].std(), alpha=0.7)
axes[1, 2].set_title('Feature Std Dev (unscaled)')
axes[1, 2].tick_params(axis='x', rotation=45)
plt.tight_layout()
plt.savefig(LOG_DIR / 'data_exploration.png', dpi=150, bbox_inches='tight')
plt.show()
plt.close()

# Post-preprocessing visualization
print(f"\n{'='*60}")
print(f"AFTER PREPROCESSING:")
print(f"{'='*60}")
print(f"Shape: {raw_df.shape} -> {proc_df.shape}")
print(f"\nNull counts (should be all 0):\n{proc_df[feature_cols].isnull().sum()}")
print(f"\nTarget '{CONFIG['target']}' nulls: {proc_df[CONFIG['target']].isnull().sum()}")
print(f"\nProcessed stats:\n{proc_df[feature_cols].describe().round(2)}")

fig, axes = plt.subplots(2, 3, figsize=(18, 10))
fig.suptitle(f'{sample_name} — After Preprocessing', fontsize=14, fontweight='bold')
axes[0, 0].plot(proc_df['published_date'], proc_df['close'], linewidth=0.8, color='#2ecc71')
axes[0, 0].set_title('Close Price (cleaned)')
axes[0, 1].hist(proc_df['per_change'], bins=80, edgecolor='black', alpha=0.7, color='#3498db')
axes[0, 1].set_title('% Change (NaN filled with 0)')
axes[0, 2].plot(proc_df['published_date'], proc_df['ma_7'], label='MA7', linewidth=1)
axes[0, 2].plot(proc_df['published_date'], proc_df['ma_21'], label='MA21', linewidth=1)
axes[0, 2].set_title('Moving Averages (engineered)')
axes[0, 2].legend()
axes[1, 0].plot(proc_df['published_date'], proc_df['volatility'], linewidth=0.8, color='#e74c3c')
axes[1, 0].set_title('Volatility (engineered)')
axes[1, 1].plot(proc_df['published_date'], proc_df['price_range'], linewidth=0.5, alpha=0.7, color='#9b59b6')
axes[1, 1].set_title('Price Range (engineered)')
proc_corr = proc_df[feature_cols].corr()
sns.heatmap(proc_corr, annot=True, fmt='.2f', cmap='coolwarm', ax=axes[1, 2], cbar=False,
            annot_kws={'size': 7})
axes[1, 2].set_title('Feature Correlation (all features)')
axes[1, 2].tick_params(axis='x', rotation=45, labelsize=7)
axes[1, 2].tick_params(axis='y', labelsize=7)
plt.tight_layout()
plt.savefig(LOG_DIR / 'data_after_preprocess.png', dpi=150, bbox_inches='tight')
plt.show()
plt.close()

sizes = []
for f in stock_files:
    tmp = pd.read_csv(f)
    sizes.append({'stock': Path(f).stem, 'rows': len(tmp)})
sizes_df = pd.DataFrame(sizes).sort_values('rows')
fig, ax = plt.subplots(figsize=(14, 5))
ax.barh(sizes_df['stock'], sizes_df['rows'], height=0.7)
ax.set_xlabel('Number of Rows')
ax.set_title(f'Dataset Sizes ({len(sizes_df)} stocks)')
plt.tight_layout()
plt.savefig(LOG_DIR / 'dataset_sizes.png', dpi=150, bbox_inches='tight')
plt.show()
plt.close()

print(f"\nDataset size stats: min={sizes_df['rows'].min()}, max={sizes_df['rows'].max()}, "
      f"mean={sizes_df['rows'].mean():.0f}, median={sizes_df['rows'].median():.0f}")

# %%
# CELL 11: Phase 1 - Train All Models on 10 Datasets (Default Hyperparameters)

phase1_stocks = stock_files[:10]
phase1_results = []

logger.info(f"\n{'='*60}")
logger.info(f"PHASE 1: Training all 3 models on {len(phase1_stocks)} stocks (default hyperparameters)")
logger.info(f"{'='*60}")

for filepath in phase1_stocks:
    stock_name = Path(filepath).stem
    logger.info(f"\n--- Stock: {stock_name} ---")
    _, _, _, info = build_dataloaders(filepath)
    models = {m: build_model_by_name(m, info['n_features']) for m in ALL_MODEL_NAMES}
    results, _ = run_single_stock(filepath, models)
    phase1_results.extend(results)

logger.info(f"\nPhase 1 complete: {len(phase1_results)} total results")

# %%
# CELL 12: Phase 1 - Plot Default Model Comparison

logger.info(f"\n{'='*60}")
logger.info("PHASE 1 RESULTS: Default Hyperparameter Comparison")
logger.info(f"{'='*60}")

phase1_df = plot_model_comparison(phase1_results, LOG_DIR, title_prefix="Phase1 Default - ")

if phase1_df is not None:
    phase1_df.to_csv(LOG_DIR / 'phase1_results.csv', index=False)
    print("\nPhase 1 Aggregate Metrics by Model:")
    agg1 = phase1_df.groupby('Model').agg({
        'MAE': 'mean', 'MSE': 'mean', 'RMSE': 'mean',
        'R2': 'mean', 'MAPE': 'mean', 'Dir_Acc': 'mean'
    }).round(4)
    agg1.columns = ['Avg_MAE', 'Avg_MSE', 'Avg_RMSE', 'Avg_R2', 'Avg_MAPE', 'Avg_Dir_Acc']
    print(agg1.to_string())
    agg1.to_csv(LOG_DIR / 'phase1_aggregate.csv')

# %%
# CELL 13: Phase 2 - Hyperparameter Tuning Across 10 Datasets

logger.info(f"\n{'='*60}")
logger.info("PHASE 2: Hyperparameter Tuning - Testing variations across 10 datasets")
logger.info(f"{'='*60}")

# For each model, for each hyperparameter variation, train on all 10 stocks
# and collect average metrics to find the best variation per model.

tuning_stocks = stock_files[:10]  # Same 10 stocks
best_params_per_model = {}
tuning_summary = {}

for model_name in ALL_MODEL_NAMES:
    logger.info(f"\n{'='*40}")
    logger.info(f"Tuning: {model_name}")
    logger.info(f"{'='*40}")

    variation_scores = []

    for vi, hp in enumerate(HYPERPARAM_SEARCH_SPACE):
        logger.info(f"\n  Variation {vi+1}/{len(HYPERPARAM_SEARCH_SPACE)}: {hp}")
        variation_metrics = []

        for filepath in tuning_stocks:
            stock_name = Path(filepath).stem
            train_loader, val_loader, test_loader, info = build_dataloaders(filepath)
            model = build_model_by_name(model_name, info['n_features'], hp)

            old_lr = CONFIG['lr']
            CONFIG['lr'] = hp['lr']
            model, history = train_model(
                model, train_loader, val_loader,
                model_name, f"{stock_name}_v{vi}"
            )
            CONFIG['lr'] = old_lr

            criterion = nn.HuberLoss(delta=1.0)
            _, test_preds, test_actuals = evaluate(model, test_loader, criterion)
            metrics, _, _ = compute_metrics(test_preds, test_actuals, info['target_scaler'])
            variation_metrics.append(metrics)
            logger.info(f"    {stock_name}: MSE={metrics['MSE']:.4f} RMSE={metrics['RMSE']:.4f} MAPE={metrics['MAPE']:.2f}%")

        # Average metrics across all stocks for this variation
        avg_metrics = {}
        for key in variation_metrics[0].keys():
            avg_metrics[key] = np.mean([m[key] for m in variation_metrics])

        composite = compute_composite_score(avg_metrics)
        variation_scores.append({
            'variation_idx': vi,
            'params': hp,
            'avg_metrics': avg_metrics,
            'composite_score': composite,
        })
        logger.info(f"  Variation {vi+1} avg: MSE={avg_metrics['MSE']:.4f} RMSE={avg_metrics['RMSE']:.4f} MAPE={avg_metrics['MAPE']:.2f}% Composite={composite:.4f}")

    # Select best variation (lowest composite score)
    best_var = min(variation_scores, key=lambda x: x['composite_score'])
    best_params_per_model[model_name] = best_var['params']
    tuning_summary[model_name] = variation_scores

    logger.info(f"\n  BEST for {model_name}: Variation {best_var['variation_idx']+1}")
    logger.info(f"  Params: {best_var['params']}")
    logger.info(f"  Composite Score: {best_var['composite_score']:.4f}")

# Log summary
logger.info(f"\n{'='*60}")
logger.info("PHASE 2 SUMMARY - Best Hyperparameters Per Model:")
for m, p in best_params_per_model.items():
    logger.info(f"  {m}: {p}")

# Plot tuning results for each model
for model_name, scores in tuning_summary.items():
    fig, ax = plt.subplots(figsize=(12, 5))
    labels = [f"V{s['variation_idx']+1}\n{s['params']}" for s in scores]
    composites = [s['composite_score'] for s in scores]
    colors = ['#2ecc71' if s == min(scores, key=lambda x: x['composite_score']) else '#3498db' for s in scores]
    ax.barh(range(len(composites)), composites, color=colors)
    ax.set_yticks(range(len(composites)))
    ax.set_yticklabels([f"V{s['variation_idx']+1}" for s in scores], fontsize=9)
    ax.set_xlabel('Composite Score (lower=better)')
    ax.set_title(f'Hyperparameter Tuning: {model_name}')
    plt.tight_layout()
    plt.savefig(LOG_DIR / f'tuning_{model_name}.png', dpi=150, bbox_inches='tight')
    plt.show()
    plt.close()

# %%
# CELL 14: Phase 3 - Best Tuned Models Comparison

logger.info(f"\n{'='*60}")
logger.info("PHASE 3: Training best-tuned models on 10 datasets for final comparison")
logger.info(f"{'='*60}")

phase3_results = []

for filepath in tuning_stocks:
    stock_name = Path(filepath).stem
    logger.info(f"\n--- Stock: {stock_name} ---")
    train_loader, val_loader, test_loader, info = build_dataloaders(filepath)

    stock_dir = LOG_DIR / f"{stock_name}_tuned"
    stock_dir.mkdir(exist_ok=True)
    criterion = nn.HuberLoss(delta=1.0)

    for model_name in ALL_MODEL_NAMES:
        hp = best_params_per_model[model_name]
        model = build_model_by_name(model_name, info['n_features'], hp)

        old_lr = CONFIG['lr']
        CONFIG['lr'] = hp['lr']
        model, history = train_model(model, train_loader, val_loader, model_name, stock_name)
        CONFIG['lr'] = old_lr

        _, test_preds, test_actuals = evaluate(model, test_loader, criterion)
        metrics, preds_inv, actuals_inv = compute_metrics(
            test_preds, test_actuals, info['target_scaler']
        )
        log_metrics(metrics, model_name, stock_name)
        plot_predictions(preds_inv, actuals_inv, f"{model_name}_tuned", stock_name, stock_dir)

        phase3_results.append({
            'stock': stock_name,
            'model': model_name,
            'metrics': metrics,
            'history': history,
        })

        torch.save(model.state_dict(), stock_dir / f'{model_name}_tuned_best.pt')

# %%
# CELL 15: Phase 3 - Final Analysis and Comparison

logger.info(f"\n{'='*60}")
logger.info("FINAL ANALYSIS: Best Tuned Models Comparison")
logger.info(f"{'='*60}")

phase3_df = plot_model_comparison(phase3_results, LOG_DIR, title_prefix="Phase3 BestTuned - ")

if phase3_df is not None:
    phase3_df.to_csv(LOG_DIR / 'phase3_tuned_results.csv', index=False)
    print("\nPhase 3 (Best Tuned) Aggregate Metrics by Model:")
    agg3 = phase3_df.groupby('Model').agg({
        'MAE': 'mean', 'MSE': 'mean', 'RMSE': 'mean',
        'R2': 'mean', 'MAPE': 'mean', 'Dir_Acc': 'mean'
    }).round(4)
    agg3.columns = ['Avg_MAE', 'Avg_MSE', 'Avg_RMSE', 'Avg_R2', 'Avg_MAPE', 'Avg_Dir_Acc']
    print(agg3.to_string())
    agg3.to_csv(LOG_DIR / 'phase3_aggregate.csv')

    # Find overall best model by composite score
    for m in ALL_MODEL_NAMES:
        row = agg3.loc[m]
        score = compute_composite_score({'MSE': row['Avg_MSE'], 'RMSE': row['Avg_RMSE'], 'MAPE': row['Avg_MAPE']})
        logger.info(f"  {m} composite: {score:.4f}")

    best_scores = {m: compute_composite_score({'MSE': agg3.loc[m, 'Avg_MSE'], 'RMSE': agg3.loc[m, 'Avg_RMSE'], 'MAPE': agg3.loc[m, 'Avg_MAPE']}) for m in ALL_MODEL_NAMES}
    best_model = min(best_scores, key=best_scores.get)
    logger.info(f"\nBest overall model: {best_model} (composite: {best_scores[best_model]:.4f})")
    logger.info(f"Best hyperparameters: {best_params_per_model[best_model]}")

# Save all results to JSON
all_combined = phase1_results + phase3_results
results_json = []
for r in all_combined:
    entry = {
        'stock': r['stock'],
        'model': r['model'],
        'metrics': {k: float(v) for k, v in r['metrics'].items()},
    }
    results_json.append(entry)
with open(LOG_DIR / 'all_results.json', 'w') as f:
    json.dump(results_json, f, indent=2)

# Save best hyperparameters
with open(LOG_DIR / 'best_hyperparameters.json', 'w') as f:
    json.dump(best_params_per_model, f, indent=2)

logger.info(f"\nAll logs and results saved to: {LOG_DIR}")
