import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

# Load dataset
df = pd.read_csv('WorldWide_foodwastage_dataset.csv')
print('Dataset shape:', df.shape)
print('\nColumns:', list(df.columns))
print('\nData types before conversion:\n', df.dtypes.to_string())

# ===== PREPROCESSING =====
# 1. Identify numeric feature columns (stored as strings, need conversion)
numeric_cols = [
    ' Total Waste in Tons ',
    ' Food Economic Loss (Million $) ',
    ' Avg Waste per Capita (Kg) ',
    ' Household Waste (%) '
]

# 2. Clean and convert numeric columns
print('\n--- PREPROCESSING ---')
for col in numeric_cols:
    # Remove any commas and convert to float
    df[col] = df[col].astype(str).str.replace(',', '').astype(float)

print('Converted dtypes:\n', df[numeric_cols].dtypes.to_string())

# 3. Check for missing values after conversion
print('\nMissing values after conversion:')
print(df[numeric_cols].isna().sum())

# 4. Handle any potential NaN values (drop rows with NaN in clustering features)
df_clean = df[numeric_cols].dropna()
print(f'\nRows after removing NaN: {len(df_clean)} (removed {len(df) - len(df_clean)})')

# ===== FEATURE SELECTION & SCALING =====
# 5. Standardize features (critical for K-Means)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(df_clean)
print('\nFeatures scaled. Shape:', X_scaled.shape)
print('Mean (should be ~0):', X_scaled.mean(axis=0))
print('Std Dev (should be ~1):', X_scaled.std(axis=0))

# ===== K-MEANS CLUSTERING =====
# 6. Determine optimal number of clusters (Elbow Method + Silhouette)
print('\n--- K-MEANS CLUSTERING ---')
inertias = []
silhouette_scores = []
K_range = range(2, 11)

for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(X_scaled)
    inertias.append(kmeans.inertia_)
    silhouette_scores.append(silhouette_score(X_scaled, kmeans.labels_))

print('\nK\tInertia\t\tSilhouette Score')
for k, inertia, sil in zip(K_range, inertias, silhouette_scores):
    print(f'{k}\t{inertia:.2f}\t\t{sil:.4f}')

# 7. Choose optimal K (best silhouette score)
optimal_k = K_range[np.argmax(silhouette_scores)]
print(f'\nOptimal K (by Silhouette Score): {optimal_k}')

# 8. Fit final K-Means model
kmeans_final = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
clusters = kmeans_final.fit_predict(X_scaled)

print(f'\nFinal Model - Clusters: {optimal_k}')
print(f'Inertia: {kmeans_final.inertia_:.2f}')
print(f'Silhouette Score: {silhouette_score(X_scaled, clusters):.4f}')
print(f'\nCluster distribution:')
unique, counts = np.unique(clusters, return_counts=True)
for cluster_id, count in zip(unique, counts):
    print(f'  Cluster {cluster_id}: {count} samples ({100*count/len(clusters):.1f}%)')

# ===== VISUALIZATION =====
# 9. Plot Elbow and Silhouette curves
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Elbow plot
axes[0].plot(K_range, inertias, 'bo-', linewidth=2, markersize=8)
axes[0].set_xlabel('Number of Clusters (K)', fontsize=12)
axes[0].set_ylabel('Inertia (Within-Cluster Sum of Squares)', fontsize=12)
axes[0].set_title('Elbow Method', fontsize=14, fontweight='bold')
axes[0].grid(True, alpha=0.3)

# Silhouette plot
axes[1].plot(K_range, silhouette_scores, 'ro-', linewidth=2, markersize=8)
axes[1].axvline(x=optimal_k, color='green', linestyle='--', linewidth=2, label=f'Optimal K={optimal_k}')
axes[1].set_xlabel('Number of Clusters (K)', fontsize=12)
axes[1].set_ylabel('Silhouette Score', fontsize=12)
axes[1].set_title('Silhouette Analysis', fontsize=14, fontweight='bold')
axes[1].legend()
axes[1].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('clustering_analysis.png', dpi=300, bbox_inches='tight')
print('\n✓ Saved clustering_analysis.png')

# 10. Add cluster labels back to original dataset
df_clustered = df.copy()
df_clustered['Cluster'] = clusters
print(f'\n✓ Cluster labels added to dataset')
print('\nSample clustered data:')
print(df_clustered[['Country', 'Year', 'Cluster']].head(10))

# 11. Save clustered dataset
df_clustered.to_csv('food_waste_clustered.csv', index=False)
print('\n✓ Saved food_waste_clustered.csv')