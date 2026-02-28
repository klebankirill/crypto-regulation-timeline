from datetime import datetime

import pandas as pd
import requests
import streamlit as st

API_BASE = "https://api.coingecko.com/api/v3"
MARKET_URL = (
    f"{API_BASE}/coins/markets"
    "?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"
    "&price_change_percentage=1h,24h,7d"
)
HEADERS = {"x-cg-demo-api-key": "CG-Hbn4YsqNMrVifvSzqyHAUwK6"}


@st.cache_data(ttl=120)
def fetch_market_data() -> list[dict]:
    response = requests.get(MARKET_URL, headers=HEADERS, timeout=20)
    response.raise_for_status()
    return response.json()


def format_currency(value: float) -> str:
    if value >= 1_000_000_000_000:
        return f"${value / 1_000_000_000_000:.2f}T"
    if value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.2f}B"
    if value >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"
    return f"${value:,.2f}"


def format_percent(value: float | None) -> str:
    if value is None:
        return "—"
    arrow = "▲" if value >= 0 else "▼"
    return f"{arrow} {abs(value):.2f}%"


def as_float(value: float | None) -> float:
    return float(value) if value is not None else 0.0


def render_styles() -> None:
    st.markdown(
        """
        <style>
            .stApp {
                background-color: #f4f7fb;
                color: #111827;
            }
            .topbar {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                padding: 14px 22px;
                margin-bottom: 12px;
            }
            .brand {
                font-size: 28px;
                font-weight: 800;
                letter-spacing: 0.2px;
                margin: 0;
            }
            .subtitle {
                color: #64748b;
                margin-top: 4px;
                margin-bottom: 0;
            }
            .tabline {
                display: flex;
                gap: 24px;
                margin-top: 16px;
                font-size: 26px;
                font-weight: 500;
            }
            .tabline .active {
                color: #0f172a;
                border-bottom: 3px solid #3b82f6;
                padding-bottom: 6px;
            }
            .tabline .muted {
                color: #64748b;
            }
            .kpi-card {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 14px;
                padding: 14px;
                min-height: 108px;
            }
            .kpi-title {
                color: #64748b;
                font-size: 14px;
                margin-bottom: 8px;
            }
            .kpi-value {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 4px;
            }
            .chip-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin: 12px 0 16px;
            }
            .chip {
                border: 1px solid #cbd5e1;
                border-radius: 999px;
                background: #ffffff;
                padding: 6px 12px;
                font-size: 13px;
            }
            .pos { color: #16a34a; font-weight: 600; }
            .neg { color: #dc2626; font-weight: 600; }
            .muted { color: #64748b; }
            .table-title {
                font-size: 18px;
                font-weight: 700;
                margin-top: 8px;
                margin-bottom: 10px;
            }
        </style>
        """,
        unsafe_allow_html=True,
    )


def build_table_data(coins: list[dict]) -> pd.DataFrame:
    rows = []
    for coin in coins[:15]:
        day_change = as_float(coin.get("price_change_percentage_24h"))
        week_change = as_float(coin.get("price_change_percentage_7d_in_currency"))
        rows.append(
            {
                "#": coin.get("market_cap_rank"),
                "Coin": f"{coin.get('name')} ({coin.get('symbol', '').upper()})",
                "Price": f"${coin.get('current_price', 0):,.4f}",
                "1h %": format_percent(coin.get("price_change_percentage_1h_in_currency")),
                "24h %": format_percent(day_change),
                "7d %": format_percent(week_change),
                "Market Cap": format_currency(float(coin.get("market_cap", 0))),
                "Volume (24h)": format_currency(float(coin.get("total_volume", 0))),
            }
        )
    return pd.DataFrame(rows)


def metric_cards(coins: list[dict]) -> None:
    total_cap = sum(float(c.get("market_cap", 0)) for c in coins)
    total_volume = sum(float(c.get("total_volume", 0)) for c in coins)
    avg_24h = sum(as_float(c.get("price_change_percentage_24h")) for c in coins[:50]) / 50
    btc = next((c for c in coins if c.get("id") == "bitcoin"), None)
    btc_price = float(btc.get("current_price", 0)) if btc else 0.0

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(
            (
                '<div class="kpi-card"><div class="kpi-title">Market Cap</div>'
                f'<div class="kpi-value">{format_currency(total_cap)}</div>'
                f'<div class="muted">24h avg: {format_percent(avg_24h)}</div></div>'
            ),
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(
            (
                '<div class="kpi-card"><div class="kpi-title">24h Volume</div>'
                f'<div class="kpi-value">{format_currency(total_volume)}</div>'
                '<div class="muted">Global trading activity</div></div>'
            ),
            unsafe_allow_html=True,
        )
    with col3:
        st.markdown(
            (
                '<div class="kpi-card"><div class="kpi-title">BTC Price</div>'
                f'<div class="kpi-value">${btc_price:,.0f}</div>'
                '<div class="muted">Live spot estimate</div></div>'
            ),
            unsafe_allow_html=True,
        )
    with col4:
        fear_greed = 50 + avg_24h * 2.2
        fear_greed = max(0, min(100, fear_greed))
        st.markdown(
            (
                '<div class="kpi-card"><div class="kpi-title">Fear & Greed</div>'
                f'<div class="kpi-value">{fear_greed:.0f}</div>'
                '<div class="muted">Synthetic sentiment gauge</div></div>'
            ),
            unsafe_allow_html=True,
        )


def main() -> None:
    st.set_page_config(page_title="Crypto Tracker", layout="wide")
    render_styles()

    st.markdown(
        """
        <div class="topbar">
            <p class="brand">Crypto Tracker</p>
            <p class="subtitle">Track trending crypto assets, market mood, and top movers in one place.</p>
            <div class="tabline">
                <span class="active">Trending</span>
                <span class="muted">Watchlist</span>
                <span class="muted">Prediction Markets</span>
                <span class="muted">Most Visited</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    try:
        coins = fetch_market_data()
    except requests.RequestException:
        st.error("Failed to load CoinGecko market data. Please try again later.")
        return

    metric_cards(coins)

    st.markdown(
        """
        <div class="chip-row">
            <span class="chip">🔥 Top 200</span>
            <span class="chip">⚡ Most Traded</span>
            <span class="chip">📈 Momentum</span>
            <span class="chip">🧠 AI Alert</span>
            <span class="chip">🛡️ Security Scan</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    query = st.text_input("Search coin", placeholder="Type bitcoin, solana, eth...")
    filtered = coins
    if query.strip():
        q = query.strip().lower()
        filtered = [
            c
            for c in coins
            if q in c.get("name", "").lower() or q in c.get("symbol", "").lower()
        ]

    st.markdown('<div class="table-title">Trending coins</div>', unsafe_allow_html=True)
    if not filtered:
        st.warning("Nothing found for your query.")
        return

    table_df = build_table_data(filtered)
    st.dataframe(table_df, hide_index=True, use_container_width=True)

    st.caption(f"Updated: {datetime.utcnow():%Y-%m-%d %H:%M UTC} · Source: CoinGecko")


if __name__ == "__main__":
    main()
