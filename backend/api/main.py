"""FastAPI application: CORS, routers, startup lifecycle."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .errors import register_error_handlers
from .state import app_state
from .routers.stocks import router as stocks_router
from .routers.predictions import router as predictions_router
from .routers.train import router as train_router
from .routers.models import router as models_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="NepAI", description="LSTM Stock Prediction API for NEPSE")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

app.include_router(stocks_router, prefix="/api")
app.include_router(predictions_router, prefix="/api")
app.include_router(train_router, prefix="/api")
app.include_router(models_router, prefix="/api")


@app.on_event("startup")
async def startup():
    app_state.scan_tickers()
    models = app_state.get_all_models()
    logger.info(f"Available models: {len(models)}")
    for m in models:
        stale_tag = " [stale]" if m.get("stale") else ""
        logger.info(f"  {m['ticker']}{stale_tag}")


@app.get("/api/health", summary="Health check")
async def health():
    """Return server status, ticker count, and loaded model count.

    Response example:
        {"status": "ok", "tickers": 124, "models": 2}
    """
    return {
        "status": "ok",
        "tickers": len(app_state.available_tickers),
        "models": len(app_state.get_all_models()),
    }
