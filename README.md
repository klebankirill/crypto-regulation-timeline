# crypto-regulation-timeline (Python version)

Interactive crypto market tracker rebuilt in **Python** with Streamlit.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

## Features

- Live market table (top-100 coins via CoinGecko)
- Search by name/symbol
- Favorites list
- 7-day price chart per selected coin
- Simple portfolio tracker with total valuation
