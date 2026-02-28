from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

API_BASE = "https://api.coingecko.com/api/v3"
MARKET_URL = (
    f"{API_BASE}/coins/markets"
    "?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"
    "&price_change_percentage=1h,24h,7d"
)
HEADERS = {"x-cg-demo-api-key": "CG-Hbn4YsqNMrVifvSzqyHAUwK6"}

app = FastAPI(title="Crypto Timeline API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _format_currency_short(value: float) -> str:
    if value >= 1_000_000_000_000:
        return f"${value / 1_000_000_000_000:.2f}T"
    if value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.2f}B"
    if value >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"
    return f"${value:,.2f}"


def _fetch_market_data() -> list[dict[str, Any]]:
    try:
        response = requests.get(MARKET_URL, headers=HEADERS, timeout=20)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=503, detail="CoinGecko is unavailable") from exc
    return response.json()


def _coin_row(coin: dict[str, Any]) -> dict[str, Any]:
    return {
        "rank": coin.get("market_cap_rank"),
        "name": coin.get("name"),
        "symbol": str(coin.get("symbol", "")).upper(),
        "price": coin.get("current_price", 0.0),
        "change1h": coin.get("price_change_percentage_1h_in_currency"),
        "change24h": coin.get("price_change_percentage_24h"),
        "change7d": coin.get("price_change_percentage_7d_in_currency"),
        "marketCap": coin.get("market_cap", 0.0),
        "volume24h": coin.get("total_volume", 0.0),
        "image": coin.get("image", ""),
    }


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/market-summary")
def market_summary() -> dict[str, Any]:
    coins = _fetch_market_data()
    total_cap = sum(float(c.get("market_cap", 0.0)) for c in coins)
    total_volume = sum(float(c.get("total_volume", 0.0)) for c in coins)
    avg_24h = sum(float(c.get("price_change_percentage_24h") or 0.0) for c in coins[:50]) / 50
    btc = next((c for c in coins if c.get("id") == "bitcoin"), {})
    fear_greed = max(0.0, min(100.0, 50 + avg_24h * 2.2))

    return {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "cards": {
            "marketCap": _format_currency_short(total_cap),
            "marketCapChange24h": avg_24h,
            "volume24h": _format_currency_short(total_volume),
            "btcPrice": float(btc.get("current_price", 0.0)),
            "fearGreed": round(fear_greed, 0),
        },
    }


@app.get("/api/trending")
def trending(
    q: str = Query(default="", description="Search by name or symbol"),
    limit: int = Query(default=15, ge=1, le=100),
) -> dict[str, Any]:
    coins = _fetch_market_data()

    search = q.strip().lower()
    if search:
        coins = [
            c
            for c in coins
            if search in str(c.get("name", "")).lower() or search in str(c.get("symbol", "")).lower()
        ]

    rows = [_coin_row(c) for c in coins[:limit]]

    return {
        "count": len(rows),
        "rows": rows,
        "chips": [
            "Top 200",
            "Most Traded On-Chain",
            "AI Alert",
            "Market Mood",
            "Security Scan",
        ],
    }
