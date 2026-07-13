# Food Waste Clustering

This repository contains scripts and a minimal frontend/backend to analyze and cluster worldwide food waste data.

Contents
- `WorldWide_foodwastage_dataset.csv` — source dataset
- `food_waste_analysis.py` — preprocessing, feature selection, K-Means clustering
- `cluster_analysis.py` — cluster summaries and plots
- `food_waste_clustered.csv` — clustered output
- `backend/` — FastAPI backend serving API endpoints
- `frontend/` — Next.js frontend (development server at `http://localhost:3000`)

Quick start (local)

1. Install Python deps (from repo root):

```
python -m pip install -r backend/requirements.txt
```

2. Run FastAPI backend:

```
python -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
```

3. Start the frontend (from `frontend/`):

```
cd frontend
npm install
npm run dev
```

Notes
- The frontend proxies API calls to `NEXT_PUBLIC_API_URL` or `http://127.0.0.1:8000` by default.
- See `cluster_analysis.py` and generated PNGs for cluster visualizations.

License
- MIT (add license file if desired)
