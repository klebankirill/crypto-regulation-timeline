import time
from datetime import datetime

import pandas as pd
import plotly.express as px
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


@st.cache_data(ttl=120)
def fetch_prices(ids: list[str]) -> dict:
    if not ids:
        return {}
    joined = ",".join(ids)
    response = requests.get(
        f"{API_BASE}/simple/price?ids={joined}&vs_currencies=usd",
        headers=HEADERS,
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


@st.cache_data(ttl=300)
def fetch_chart_data(coin_id: str) -> list[list[float]]:
    response = requests.get(
        f"{API_BASE}/coins/{coin_id}/market_chart?vs_currency=usd&days=7",
        headers=HEADERS,
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    return payload.get("prices", [])


def init_state() -> None:
    st.session_state.setdefault("favorites", set())
    st.session_state.setdefault("portfolio", [])


def market_page(coins: list[dict]) -> None:
    st.subheader("Market")

    query = st.text_input("🔎 Search cryptocurrency", placeholder="bitcoin")
    filtered = coins
    if query:
        q = query.strip().lower()
        filtered = [
            c
            for c in coins
            if q in c.get("name", "").lower() or q in c.get("symbol", "").lower()
        ]

    if not filtered:
        st.info("Нет данных по запросу.")
        return

    df = pd.DataFrame(filtered)
    df = df[
        [
            "id",
            "name",
            "symbol",
            "current_price",
            "market_cap",
            "price_change_percentage_1h_in_currency",
            "price_change_percentage_24h",
            "price_change_percentage_7d_in_currency",
        ]
    ].rename(
        columns={
            "id": "ID",
            "name": "Coin",
            "symbol": "Symbol",
            "current_price": "Price (USD)",
            "market_cap": "Market Cap",
            "price_change_percentage_1h_in_currency": "1h %",
            "price_change_percentage_24h": "24h %",
            "price_change_percentage_7d_in_currency": "7d %",
        }
    )

    st.dataframe(df, use_container_width=True, hide_index=True)

    coin_ids = [coin["id"] for coin in filtered]
    selected = st.selectbox("Выберите монету для графика", coin_ids)

    fav_col, _ = st.columns([1, 4])
    with fav_col:
        is_favorite = selected in st.session_state.favorites
        if st.button("⭐ Remove" if is_favorite else "☆ Favorite"):
            if is_favorite:
                st.session_state.favorites.remove(selected)
            else:
                st.session_state.favorites.add(selected)
            st.rerun()

    st.caption(
        "Избранное: "
        + (", ".join(sorted(st.session_state.favorites)) if st.session_state.favorites else "нет")
    )

    chart_data = fetch_chart_data(selected)
    if chart_data:
        chart_df = pd.DataFrame(chart_data, columns=["timestamp", "price"])
        chart_df["timestamp"] = pd.to_datetime(chart_df["timestamp"], unit="ms")
        fig = px.line(chart_df, x="timestamp", y="price", title=f"{selected}: 7d price")
        st.plotly_chart(fig, use_container_width=True)


def portfolio_page(coins: list[dict]) -> None:
    st.markdown("## My Portfolio")

    names = [coin["id"] for coin in coins]

    with st.form("add_asset"):
       input_col, amount_col, button_col = st.columns([3, 3, 2])
        with input_col:
            coin = st.text_input("Монета", placeholder="bitcoin", label_visibility="collapsed")
        with amount_col:
            amount_raw = st.text_input("Количество", placeholder="Количество", label_visibility="collapsed")
        with button_col:
            st.write("")
        submitted = st.form_submit_button("Добавить")

     if submitted:
        try:
            parsed_amount = float(amount_raw.replace(",", ".")) if amount_raw else 0.0
        except ValueError:
            parsed_amount = -1
        coin = coin.strip().lower()
        if coin not in names:
            st.warning("Монета не найдена. Используйте id монеты, например bitcoin.")
        elif parsed_amount <= 0:
            st.warning("Количество должно быть больше 0.")
        else:
            st.session_state.portfolio.append({"coin": coin, "amount": parsed_amount})

    portfolio = st.session_state.portfolio
    if not portfolio:
        st.info("Портфель пуст.")
        return

    prices = fetch_prices(sorted({item["coin"] for item in portfolio}))

    rows = []
    total = 0.0
    for idx, asset in enumerate(portfolio):
        price = prices.get(asset["coin"], {}).get("usd", 0)
        value = price * asset["amount"]
        total += value
        rows.append(
            {
                "#": idx,
                "Coin": asset["coin"],
                "Amount": asset["amount"],
                "Price (USD)": price,
                "Value (USD)": value,
            }
        )

    st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    remove_idx = st.number_input("Удалить позицию по индексу #", min_value=0, max_value=len(rows) - 1, step=1)
    if st.button("Удалить"):
        st.session_state.portfolio.pop(int(remove_idx))
        st.rerun()

    st.success(f"Общая стоимость: ${total:,.2f}")


def main() -> None:
    st.set_page_config(page_title="Crypto Dashboard", layout="wide")
    init_state()

    st.title("Crypto Tracker (Python Edition)")
    st.caption(f"Updated: {datetime.utcnow():%Y-%m-%d %H:%M UTC}")

    for _ in range(3):
        try:
            coins = fetch_market_data()
            break
        except requests.RequestException:
            time.sleep(1)
    else:
        st.error("Не удалось загрузить данные CoinGecko. Попробуйте позже.")
        return

    tab_market, tab_portfolio = st.tabs(["Market", "Portfolio"])
    with tab_market:
        market_page(coins)
    with tab_portfolio:
        portfolio_page(coins)


if __name__ == "__main__":
    main()
