# crypto-regulation-timeline

Crypto market dashboard with:
- **Python (FastAPI)** backend
- **React + Vite + Tailwind CSS** frontend
- CoinGecko market data integration

## Run locally

### 1) Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend opens on `http://localhost:5173`, backend on `http://localhost:8000`.

## API

- `GET /api/health`
- `GET /api/market-summary`
- `GET /api/trending?q=btc&limit=15`
