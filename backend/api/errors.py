"""Custom exceptions and FastAPI error handlers."""

from fastapi import Request
from fastapi.responses import JSONResponse


class StockNotFoundError(Exception):
    def __init__(self, ticker: str):
        self.ticker = ticker
        self.message = f"Stock '{ticker}' not found in data"


class InsufficientDataError(Exception):
    def __init__(self, ticker: str, rows: int, min_required: int):
        self.ticker = ticker
        self.message = (
            f"Stock '{ticker}' has {rows} usable rows after preprocessing "
            f"(minimum {min_required} required)"
        )


class ModelNotFoundError(Exception):
    def __init__(self, ticker: str):
        self.ticker = ticker
        self.message = f"No trained model found for '{ticker}'"


class TrainingInProgressError(Exception):
    def __init__(self, ticker: str):
        self.ticker = ticker
        self.message = f"Training already in progress for '{ticker}'"


def register_error_handlers(app):
    @app.exception_handler(StockNotFoundError)
    async def handle_stock_not_found(request: Request, exc: StockNotFoundError):
        return JSONResponse(
            status_code=404,
            content={"error": exc.message, "ticker": exc.ticker},
        )

    @app.exception_handler(InsufficientDataError)
    async def handle_insufficient_data(request: Request, exc: InsufficientDataError):
        return JSONResponse(
            status_code=400,
            content={"error": exc.message, "ticker": exc.ticker},
        )

    @app.exception_handler(ModelNotFoundError)
    async def handle_model_not_found(request: Request, exc: ModelNotFoundError):
        return JSONResponse(
            status_code=404,
            content={"error": exc.message, "ticker": exc.ticker},
        )

    @app.exception_handler(TrainingInProgressError)
    async def handle_training_in_progress(request: Request, exc: TrainingInProgressError):
        return JSONResponse(
            status_code=409,
            content={"error": exc.message, "ticker": exc.ticker},
        )
