# crypto-regulation-timeline

Crypto market dashboard with:
- **Java (Spring Boot)** backend
- **React + Vite + Tailwind CSS** frontend
- CoinGecko market data integration

## Run locally

### 1) Backend (Java)

```bash
mvn spring-boot:run
```

API starts on `http://localhost:8000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend opens on `http://localhost:5173`.

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

- `VITE_API_BASE` — public base URL of deployed API (for example `https://<your-api>.onrender.com`).

### API (Render/Railway/Fly.io)

Deploy backend as a separate web service from repo root.

- Build/install: `mvn -DskipTests package`
- Start command: `java -jar target/crypto-regulation-timeline-1.0.0.jar`

Required environment variables:

- `ALLOWED_ORIGINS` — comma-separated origins allowed by CORS.
  - For strict CORS in production, set to GitHub Pages URL, e.g.
    `https://<github-username>.github.io`
  - For local/dev, you can use `*`.
- `PORT` — optional, defaults to `8000`.

### Final public links

- Frontend: `https://<github-username>.github.io/<repo-name>/`
- API: `https://<your-api-domain>`
