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

## Deploy

### Frontend (GitHub Pages)

- Workflow: `.github/workflows/deploy-frontend.yml`.
- Build output: `frontend/dist`.
- Public URL format: `https://<github-username>.github.io/<repo-name>/`.

For GitHub Pages build, add repository secret:

- `VITE_API_BASE` — public base URL of deployed FastAPI API (for example `https://<your-api>.onrender.com`).

### API (Render/Railway/Fly.io)

Deploy backend as a separate web service from repo root:

- Build/install: `pip install -r requirements.txt`
- Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

Required environment variables:

- `ALLOWED_ORIGINS` — comma-separated origins allowed by CORS.
  - For strict CORS in production, set to GitHub Pages URL, e.g.
    `https://<github-username>.github.io`
  - For local/dev, you can use `*`.

### Frontend environment variables

- `VITE_API_BASE` (required in production build)
- `VITE_BASE_PATH` (optional, defaults to `/<repo>/` when running in GitHub Actions)

### Final public links

- Frontend: `https://<github-username>.github.io/<repo-name>/`
- API: `https://<your-api-domain>`
