from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

BASE_DIR = Path(__file__).resolve().parent.parent

NUMERIC_COLS = [
    " Total Waste in Tons ",
    " Food Economic Loss (Million $) ",
    " Avg Waste per Capita (Kg) ",
    " Household Waste (%) ",
]

# Cache to avoid re-calculating on every request
EVALUATION_METRICS = None

app = FastAPI(title="Food Waste Clustering API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_dataset():
    raw_path = BASE_DIR / "WorldWide_foodwastage_dataset.csv"
    clustered_path = BASE_DIR / "food_waste_clustered.csv"

    if raw_path.exists():
        df = pd.read_csv(raw_path)
    elif clustered_path.exists():
        df = pd.read_csv(clustered_path)
    else:
        raise FileNotFoundError("Dataset not found")

    for col in NUMERIC_COLS:
        if col in df.columns:
            if df[col].dtype == object:
                df[col] = df[col].astype(str).str.replace(",", "").str.strip()
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def get_evaluation_metrics(X_scaled):
    global EVALUATION_METRICS
    if EVALUATION_METRICS is not None:
        return EVALUATION_METRICS

    inertias = []
    silhouettes = [0.0]  # K=1 silhouette score is undefined/0.0

    # Downsample slightly to 1200 rows for near-instant calculation on local dev startup
    n_samples = len(X_scaled)
    downsample_factor = max(1, n_samples // 1200)
    X_sub = X_scaled[::downsample_factor]

    from sklearn.metrics import silhouette_score

    for temp_k in range(1, 11):
        km = KMeans(n_clusters=temp_k, random_state=42, n_init=5)
        labels = km.fit_predict(X_scaled)
        inertias.append(round(float(km.inertia_), 2))

        if temp_k > 1:
            km_sub = KMeans(n_clusters=temp_k, random_state=42, n_init=5)
            labels_sub = km_sub.fit_predict(X_sub)
            score = silhouette_score(X_sub, labels_sub)
            silhouettes.append(round(float(score), 4))

    EVALUATION_METRICS = {
        "inertias": inertias,
        "silhouettes": silhouettes,
    }
    return EVALUATION_METRICS


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

    # Project to 2D PCA Space for Scatter Plot (Ideal Clustering representation)
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X_scaled)

    # Get centroids in PCA 2D space
    centroids_pca = pca.transform(kmeans.cluster_centers_)

    # Stable downsampled coordinates for the frontend scatter plot (using fixed seed to avoid layout jumps)
    sample_indices = df_clean.sample(n=min(300, len(df_clean)), random_state=42).index
    scatter_points = []
    for idx in sample_indices:
        pos = df_clean.index.get_loc(idx)
        scatter_points.append({
            "x": round(float(X_pca[pos][0]), 3),
            "y": round(float(X_pca[pos][1]), 3),
            "cluster": int(clusters[pos])
        })

    centroids = []
    for c_id, centroid_coords in enumerate(centroids_pca):
        centroids.append({
            "x": round(float(centroid_coords[0]), 3),
            "y": round(float(centroid_coords[1]), 3),
            "cluster": c_id
        })

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

        # Project user's prediction to PCA 2D space as well to plot it!
        input_pca = pca.transform(input_scaled)[0]

        # Centroid info
        centroid_scaled = kmeans.cluster_centers_[predicted_cluster]
        distance = float(np.linalg.norm(input_scaled[0] - centroid_scaled))

        # Stats for predicted cluster
        pred_group = df_clean[df_clean["Cluster"] == predicted_cluster]

        prediction_result = {
            "predicted_cluster": predicted_cluster,
            "distance_to_centroid": round(distance, 4),
            "pca_x": round(float(input_pca[0]), 3),
            "pca_y": round(float(input_pca[1]), 3),
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

    # Retrieve evaluation metrics
    eval_metrics = get_evaluation_metrics(X_scaled)

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
        "scatter_points": scatter_points,
        "centroids": centroids,
        "evaluation": eval_metrics,
    }
