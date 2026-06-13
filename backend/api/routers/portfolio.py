"""Portfolio CRUD endpoints with weighted-average upsert.

All endpoints require authentication via JWT.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_user
from ..metadata import enrich
from ..state import app_state
from ..supabase_client import supabase_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/portfolio", tags=["portfolio"])


class AddStockRequest(BaseModel):
    ticker: str
    quantity: int
    entry_price: float



@router.get("", summary="Get portfolio holdings")
async def get_portfolio(user_id: str = Depends(get_current_user)):
    """Fetch all holdings for the authenticated user.

    Enriches each holding with current_price, pnl, and pnl_percent
    from the latest stock data in the data cache.
    """
    try:
        result = (
            supabase_client.table("portfolio")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )

        holdings = []
        for row in result.data or []:
            ticker = row["ticker"]
            quantity = row["quantity"]
            entry_price = float(row["entry_price"])

            # Get current price from data cache
            current_price = _get_latest_close(ticker)

            pnl = (current_price - entry_price) * quantity if current_price else 0.0
            pnl_percent = (
                ((current_price - entry_price) / entry_price) * 100
                if current_price and entry_price > 0
                else 0.0
            )

            holdings.append(enrich(ticker,
                {
                    "ticker": ticker,
                    "quantity": quantity,
                    "entry_price": round(entry_price, 2),
                    "current_price": round(current_price, 2) if current_price else None,
                    "pnl": round(pnl, 2),
                    "pnl_percent": round(pnl_percent, 2),
                    "added_at": row.get("added_at"),
                }
            ))

        return {"holdings": holdings}

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error fetching portfolio: %s", exc)
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to fetch portfolio"},
        )


@router.post("", summary="Add stock to portfolio")
async def add_stock(body: AddStockRequest, user_id: str = Depends(get_current_user)):
    """Add a stock to the portfolio, or merge via weighted-average if already held.

    Weighted-average example:
        Hold 10 NABIL @ Rs 500.  Add 5 NABIL @ Rs 600.
        Result: 15 NABIL @ Rs 533.33  ((10*500 + 5*600) / 15)
    """
    ticker = body.ticker.upper().strip()

    # Validate ticker exists in data
    if ticker not in app_state.available_tickers:
        raise HTTPException(
            status_code=404,
            detail={"error": f"Stock '{ticker}' not found in data", "ticker": ticker},
        )

    if body.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail={"error": "Quantity must be greater than 0"},
        )

    if body.entry_price <= 0:
        raise HTTPException(
            status_code=400,
            detail={"error": "Entry price must be greater than 0"},
        )

    try:
        # Check if user already holds this ticker
        existing = (
            supabase_client.table("portfolio")
            .select("*")
            .eq("user_id", user_id)
            .eq("ticker", ticker)
            .execute()
        )

        if existing.data and len(existing.data) > 0:
            # Weighted-average upsert
            old_row = existing.data[0]
            old_qty = old_row["quantity"]
            old_price = float(old_row["entry_price"])

            new_qty = old_qty + body.quantity
            new_price = (old_qty * old_price + body.quantity * body.entry_price) / new_qty

            result = (
                supabase_client.table("portfolio")
                .update(
                    {
                        "quantity": new_qty,
                        "entry_price": round(new_price, 2),
                    }
                )
                .eq("id", old_row["id"])
                .execute()
            )

            updated = result.data[0] if result.data else {}
            return enrich(ticker, {
                "ticker": ticker,
                "quantity": new_qty,
                "entry_price": round(new_price, 2),
                "action": "merged",
                "message": f"Merged with existing holding — now {new_qty} shares @ Rs {new_price:.2f}",
            })
        else:
            # New holding
            result = (
                supabase_client.table("portfolio")
                .insert(
                    {
                        "user_id": user_id,
                        "ticker": ticker,
                        "quantity": body.quantity,
                        "entry_price": round(body.entry_price, 2),
                    }
                )
                .execute()
            )

            return enrich(ticker, {
                "ticker": ticker,
                "quantity": body.quantity,
                "entry_price": round(body.entry_price, 2),
                "action": "created",
                "message": f"Added {body.quantity} shares of {ticker} @ Rs {body.entry_price:.2f}",
            })

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error adding stock to portfolio: %s", exc)
        raise HTTPException(
            status_code=500,
            detail={"error": f"Failed to add stock to portfolio: {str(exc)}"},
        )


@router.delete("/{ticker}", summary="Remove stock from portfolio")
async def remove_stock(ticker: str, user_id: str = Depends(get_current_user)):
    """Remove a stock from the user's portfolio entirely."""
    ticker = ticker.upper().strip()

    try:
        # Check if the holding exists first
        existing = (
            supabase_client.table("portfolio")
            .select("id")
            .eq("user_id", user_id)
            .eq("ticker", ticker)
            .execute()
        )

        if not existing.data or len(existing.data) == 0:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": f"Portfolio entry not found for '{ticker}'",
                    "ticker": ticker,
                },
            )

        # Delete the holding
        supabase_client.table("portfolio").delete().eq(
            "user_id", user_id
        ).eq("ticker", ticker).execute()

        return enrich(ticker, {"message": f"Removed {ticker} from portfolio", "ticker": ticker})

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error removing stock from portfolio: %s", exc)
        raise HTTPException(
            status_code=500,
            detail={"error": f"Failed to remove stock from portfolio: {str(exc)}"},
        )



def _get_latest_close(ticker: str) -> float | None:
    """Get the latest closing price for a ticker from the data cache."""
    try:
        if not app_state.stock_csv_exists(ticker):
            return None
        df = app_state.get_stock_data(ticker)
        if df.empty:
            return None
        return float(df["close"].iloc[-1])
    except Exception:
        return None
