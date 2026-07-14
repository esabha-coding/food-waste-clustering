import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

# api/index.py → parent = api/ → parent = repo root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NUMERIC_COLS = [
    " Total Waste in Tons ",
    " Food Economic Loss (Million $) ",
    " Avg Waste per Capita (Kg) ",
    " Household Waste (%) ",
]

app = FastAPI(title="Food Waste Clustering API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_dataset():
    raw_path = os.path.join(BASE_DIR, "WorldWide_foodwastage_dataset.csv")
    clustered_path = os.path.join(BASE_DIR, "food_waste_clustered.csv")

    if os.path.exists(raw_path):
        df = pd.read_csv(raw_path)
    elif os.path.exists(clustered_path):
        df = pd.read_csv(clustered_path)
    else:
        raise FileNotFoundError("Dataset not found")

    for col in NUMERIC_COLS:
        if col in df.columns:
            if df[col].dtype == object:
                df[col] = df[col].astype(str).str.replace(",", "").str.strip()
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/summary")
def get_summary(
    k: int = 2,
    predict_waste: float = None,
    predict_loss: float = None,
    predict_capita: float = None,
    predict_household: float = None,
):
    # Bound k between 2 and 6
    k = max(2, min(6, k))

    df = load_dataset()
    df_clean = df.dropna(subset=NUMERIC_COLS).copy()

    # Fit StandardScaler dynamically
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df_clean[NUMERIC_COLS])

    # Fit K-Means
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)
    df_clean["Cluster"] = clusters

    prediction_result = None
    if (
        predict_waste is not None
        and predict_loss is not None
        and predict_capita is not None
        and predict_household is not None
    ):
        input_data = [[predict_waste, predict_loss, predict_capita, predict_household]]
        input_scaled = scaler.transform(input_data)
        predicted_cluster = int(kmeans.predict(input_scaled)[0])

        # Centroid info
        centroid_scaled = kmeans.cluster_centers_[predicted_cluster]
        distance = float(np.linalg.norm(input_scaled[0] - centroid_scaled))

        # Stats for predicted cluster
        pred_group = df_clean[df_clean["Cluster"] == predicted_cluster]

        prediction_result = {
            "predicted_cluster": predicted_cluster,
            "distance_to_centroid": round(distance, 4),
            "averages": {
                "avg_total_waste_tons": round(float(pred_group[" Total Waste in Tons "].mean()), 2),
                "avg_economic_loss_million": round(float(pred_group[" Food Economic Loss (Million $) "].mean()), 2),
                "avg_per_capita_waste_kg": round(float(pred_group[" Avg Waste per Capita (Kg) "].mean()), 2),
                "avg_household_waste_percent": round(float(pred_group[" Household Waste (%) "].mean()), 2),
            }
        }

    cluster_counts = df_clean["Cluster"].value_counts().sort_index().astype(int).to_dict()

    # Per-cluster metric averages
    cluster_averages = {}
    for cluster_id, group in df_clean.groupby("Cluster"):
        cluster_averages[str(int(cluster_id))] = {
            "avg_total_waste_tons": round(float(group[" Total Waste in Tons "].mean()), 2),
            "avg_economic_loss_million": round(float(group[" Food Economic Loss (Million $) "].mean()), 2),
            "avg_per_capita_waste_kg": round(float(group[" Avg Waste per Capita (Kg) "].mean()), 2),
            "avg_household_waste_percent": round(float(group[" Household Waste (%) "].mean()), 2),
        }

    # Top 8 countries by total waste tonnage
    top_countries = (
        df_clean.groupby("Country")[" Total Waste in Tons "]
        .sum()
        .nlargest(8)
        .round(0)
        .astype(int)
        .to_dict()
    )

    # Top 8 food types by record count
    top_food_types = df_clean["Food Types"].value_counts().head(8).to_dict()

    # Year-wise total waste trend
    year_trend = (
        df_clean.groupby("Year")[" Total Waste in Tons "]
        .sum()
        .sort_index()
        .round(0)
        .astype(int)
        .to_dict()
    )

    return {
        "k": k,
        "rows": int(len(df_clean)),
        "clusters": {str(c_id): int(count) for c_id, count in cluster_counts.items()},
        "avg_total_waste_tons": round(float(df_clean[" Total Waste in Tons "].mean()), 2),
        "avg_economic_loss_million": round(float(df_clean[" Food Economic Loss (Million $) "].mean()), 2),
        "avg_per_capita_waste_kg": round(float(df_clean[" Avg Waste per Capita (Kg) "].mean()), 2),
        "avg_household_waste_percent": round(float(df_clean[" Household Waste (%) "].mean()), 2),
        "top_countries": top_countries,
        "top_food_types": top_food_types,
        "cluster_averages": cluster_averages,
        "year_trend": {str(yr): int(val) for yr, val in year_trend.items()},
        "prediction": prediction_result,
    }