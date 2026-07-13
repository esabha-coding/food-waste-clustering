from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "food_waste_clustered.csv"

app = FastAPI(title="Food Waste Clustering API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_dataset():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")
    df = pd.read_csv(DATASET_PATH)
    for col in [
        " Total Waste in Tons ",
        " Food Economic Loss (Million $) ",
        " Avg Waste per Capita (Kg) ",
        " Household Waste (%) ",
    ]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/summary")
def get_summary():
    df = load_dataset()
    cluster_counts = df["Cluster"].value_counts().sort_index().astype(int).to_dict()

    return {
        "rows": int(len(df)),
        "clusters": {str(k): int(v) for k, v in cluster_counts.items()},
        "avg_total_waste_tons": round(float(df[" Total Waste in Tons "].mean()), 2),
        "avg_economic_loss_million": round(float(df[" Food Economic Loss (Million $) "].mean()), 2),
        "avg_per_capita_waste_kg": round(float(df[" Avg Waste per Capita (Kg) "].mean()), 2),
        "avg_household_waste_percent": round(float(df[" Household Waste (%) "].mean()), 2),
        "top_countries": df["Country"].value_counts().head(5).to_dict(),
        "top_food_types": df["Food Types"].value_counts().head(5).to_dict(),
    }
