"""
CLI entry point for NepAI backend.

Usage:
    python -m backend train    --stock NABIL [--epochs 150] [--patience 15]
    python -m backend predict  --stock NABIL [--days 5]
    python -m backend evaluate --stock NABIL
    python -m backend serve    [--host 0.0.0.0] [--port 8000]
"""

import argparse
import logging
import sys

import torch

from .config import DATA_DIR, MODELS_DIR, EPOCHS, PATIENCE

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


def _resolve_device() -> torch.device:
    dev = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {dev}")
    if torch.cuda.is_available():
        for i in range(torch.cuda.device_count()):
            logger.info(f"  GPU {i}: {torch.cuda.get_device_name(i)}")
    return dev


def cmd_train(args):
    from .ml.training import train_stock

    device = _resolve_device()
    csv_path = DATA_DIR / f"{args.stock}.csv"
    if not csv_path.exists():
        logger.error(f"CSV not found: {csv_path}")
        sys.exit(1)

    logger.info(f"TRAINING: {args.stock}")
    logger.info(f"  Data:     {csv_path}")
    logger.info(f"  Output:   {MODELS_DIR / args.stock}")
    logger.info(f"  Epochs:   {args.epochs}  Patience: {args.patience}")

    result = train_stock(
        filepath=str(csv_path),
        device=device,
        epochs=args.epochs,
        patience=args.patience,
    )

    logger.info(f"TRAINING COMPLETE: {result['ticker']}")
    logger.info(f"  Time:    {result['training_time_sec']}s")
    logger.info(f"  Epochs:  {result['epochs_trained']}")
    logger.info(f"  Saved:   {result['model_dir']}")
    logger.info(f"  Plot:    {result.get('plot_path', 'N/A')}")
    _print_metrics("Circuit-Capped", result["metrics_capped"])
    _print_metrics("Raw (no cap)", result["metrics_raw"])


def cmd_predict(args):
    from .ml.inference import predict

    device = _resolve_device()

    logger.info(f"PREDICTION: {args.stock}  ({args.days} days)")

    result = predict(ticker=args.stock, days=args.days, device=device)

    if not result.get("model_available"):
        logger.error(result.get("message", "Model not available"))
        sys.exit(1)

    logger.info(f"  Trained on: {result.get('trained_on', 'N/A')}")
    logger.info(f"  Accuracy:   {result.get('model_accuracy', 'N/A')}")

    header = f"  {'Day':<5} {'Date':<12} {'Price':>10} {'Raw':>10} {'Change':>8} {'Capped':>7}"
    logger.info(header)

    for p in result["predictions"]:
        cap_flag = " YES" if p["was_capped"] else "  no"
        logger.info(
            f"  {p['day']:<5} {p['date']:<12} {p['price']:>10.2f} "
            f"{p['raw_price']:>10.2f} {p['change_pct']:>7.2f}% {cap_flag}"
        )


def cmd_evaluate(args):
    from .ml.evaluation import evaluate_stock
    from .ml.storage import load_metadata

    device = _resolve_device()
    csv_path = DATA_DIR / f"{args.stock}.csv"
    if not csv_path.exists():
        logger.error(f"CSV not found: {csv_path}")
        sys.exit(1)

    metadata = load_metadata(args.stock)
    if metadata is None:
        logger.error(f"No trained model for {args.stock}")
        sys.exit(1)

    result = evaluate_stock(ticker=args.stock, device=device)

    logger.info(f"EVALUATION: {args.stock}")
    logger.info(f"  Model trained: {metadata.get('date_created', 'N/A')}")
    logger.info(f"  Test samples:  {result['n_samples']}")
    logger.info(f"  Capped:        {result['n_capped']} / {result['n_samples']}")
    logger.info(f"  Plot saved:    {result['plot_path']}")
    _print_metrics("Circuit-Capped", result["metrics_capped"])
    _print_metrics("Raw (no cap)", result["metrics_raw"])


def cmd_serve(args):
    import uvicorn
    logger.info(f"Starting API server on {args.host}:{args.port}")
    uvicorn.run(
        "backend.api.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )


def _print_metrics(label: str, metrics: dict):
    logger.info(f"  [{label}]")
    logger.info(f"    MAE:   {metrics['MAE']:.2f}")
    logger.info(f"    RMSE:  {metrics['RMSE']:.2f}")
    logger.info(f"    MAPE:  {metrics['MAPE']:.2f}%")
    logger.info(f"    R2:    {metrics['R2']:.4f}")
    logger.info(f"    Dir Accuracy: {metrics['Direction_Accuracy']:.1f}%")


def main():
    parser = argparse.ArgumentParser(
        description="NepAI: LSTM stock prediction backend",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  python -m backend train    --stock NABIL
  python -m backend train    --stock NABIL --epochs 50 --patience 10
  python -m backend predict  --stock NABIL --days 7
  python -m backend evaluate --stock NABIL
  python -m backend serve
  python -m backend serve    --port 9000 --reload
""",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_train = sub.add_parser("train", help="Train a model for a stock")
    p_train.add_argument("--stock", required=True, help="Ticker symbol (e.g. NABIL)")
    p_train.add_argument("--epochs", type=int, default=EPOCHS, help="Max epochs")
    p_train.add_argument("--patience", type=int, default=PATIENCE, help="Early stopping patience")

    p_pred = sub.add_parser("predict", help="Run recursive N-day prediction")
    p_pred.add_argument("--stock", required=True, help="Ticker symbol")
    p_pred.add_argument("--days", type=int, default=5, help="Days to forecast (max 14)")

    p_eval = sub.add_parser("evaluate", help="Evaluate a trained model on test data")
    p_eval.add_argument("--stock", required=True, help="Ticker symbol")

    p_serve = sub.add_parser("serve", help="Start the FastAPI server")
    p_serve.add_argument("--host", default="0.0.0.0", help="Bind host")
    p_serve.add_argument("--port", type=int, default=8000, help="Bind port")
    p_serve.add_argument("--reload", action="store_true", help="Auto-reload on code changes")

    args = parser.parse_args()

    if args.command == "train":
        cmd_train(args)
    elif args.command == "predict":
        cmd_predict(args)
    elif args.command == "evaluate":
        cmd_evaluate(args)
    elif args.command == "serve":
        cmd_serve(args)


if __name__ == "__main__":
    main()
