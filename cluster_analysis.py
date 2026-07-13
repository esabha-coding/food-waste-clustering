import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load clustered dataset
df = pd.read_csv('food_waste_clustered.csv')

print('='*70)
print('CLUSTER CHARACTERISTICS & ANALYSIS')
print('='*70)

# ===== CLUSTER STATISTICS =====
numeric_cols = [
    ' Total Waste in Tons ',
    ' Food Economic Loss (Million $) ',
    ' Avg Waste per Capita (Kg) ',
    ' Household Waste (%) '
]

print('\n--- STATISTICAL SUMMARY BY CLUSTER ---\n')
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce')

cluster_stats = df.groupby('Cluster')[numeric_cols].agg(['mean', 'std', 'min', 'max'])
print(cluster_stats.to_string())

# ===== CLUSTER COMPOSITION =====
print('\n\n--- CLUSTER COMPOSITION ---')
print('\nTop 10 Countries by cluster:')
for cluster_id in sorted(df['Cluster'].unique()):
    print(f'\n  Cluster {cluster_id}:')
    top_countries = df[df['Cluster'] == cluster_id]['Country'].value_counts().head(10)
    for idx, (country, count) in enumerate(top_countries.items(), 1):
        print(f'    {idx:2d}. {country:20s} ({count:4d} records)')

print('\n\nTop 5 Food Types by cluster:')
for cluster_id in sorted(df['Cluster'].unique()):
    print(f'\n  Cluster {cluster_id}:')
    top_foods = df[df['Cluster'] == cluster_id]['Food Types'].value_counts().head(5)
    for idx, (food, count) in enumerate(top_foods.items(), 1):
        print(f'    {idx}. {food:25s} ({count:4d} records)')

# ===== WASTE PATTERNS =====
print('\n\n--- WASTE PATTERN ANALYSIS ---')
for cluster_id in sorted(df['Cluster'].unique()):
    cluster_data = df[df['Cluster'] == cluster_id]
    print(f'\nCluster {cluster_id} Waste Profile:')
    print(f'  Avg Total Waste:          {cluster_data[" Total Waste in Tons "].mean():>15,.0f} tons')
    print(f'  Avg Economic Loss:        ${cluster_data[" Food Economic Loss (Million $) "].mean():>14,.1f}M')
    print(f'  Avg Per Capita Waste:     {cluster_data[" Avg Waste per Capita (Kg) "].mean():>15.1f} kg')
    print(f'  Avg Household Waste:      {cluster_data[" Household Waste (%) "].mean():>14.1f}%')

# ===== INTERPRETATION =====
print('\n\n--- CLUSTER INTERPRETATION ---')
cluster_0 = df[df['Cluster'] == 0]
cluster_1 = df[df['Cluster'] == 1]

print('\nCluster 0 (Lower Waste Regions):')
print(f'  • Size: {len(cluster_0)} samples ({100*len(cluster_0)/len(df):.1f}%)')
print(f'  • Characteristics: {cluster_0[" Total Waste in Tons "].mean():.0f} tons avg waste')
print(f'  • Representative countries: {", ".join(cluster_0["Country"].value_counts().head(3).index.tolist())}')

print('\nCluster 1 (Higher Waste Regions):')
print(f'  • Size: {len(cluster_1)} samples ({100*len(cluster_1)/len(df):.1f}%)')
print(f'  • Characteristics: {cluster_1[" Total Waste in Tons "].mean():.0f} tons avg waste')
print(f'  • Representative countries: {", ".join(cluster_1["Country"].value_counts().head(3).index.tolist())}')

# ===== VISUALIZATION: Box plots =====
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('Cluster Characteristics - Distribution Analysis', fontsize=16, fontweight='bold')

for idx, col in enumerate(numeric_cols):
    ax = axes[idx // 2, idx % 2]
    data_to_plot = [df[df['Cluster'] == i][col].dropna() for i in sorted(df['Cluster'].unique())]
    bp = ax.boxplot(data_to_plot, patch_artist=True)
    ax.set_xticklabels([f'Cluster {i}' for i in sorted(df['Cluster'].unique())])
    for patch, color in zip(bp['boxes'], ['lightblue', 'lightcoral']):
        patch.set_facecolor(color)
    ax.set_ylabel(col.strip(), fontsize=11, fontweight='bold')
    ax.set_title(f'Distribution of {col.strip()}', fontsize=12)
    ax.grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig('cluster_characteristics.png', dpi=300, bbox_inches='tight')
print('\n✓ Saved cluster_characteristics.png')

# ===== YEAR TREND ANALYSIS =====
print('\n\n--- TEMPORAL TREND BY CLUSTER ---')
year_cluster = df.groupby(['Year', 'Cluster']).size().unstack(fill_value=0)
print('\nRecords per year and cluster:')
print(year_cluster.to_string())

fig, ax = plt.subplots(figsize=(12, 6))
for cluster_id in sorted(df['Cluster'].unique()):
    cluster_year_counts = df[df['Cluster'] == cluster_id].groupby('Year').size()
    ax.plot(cluster_year_counts.index, cluster_year_counts.values, marker='o', 
            linewidth=2, markersize=8, label=f'Cluster {cluster_id}')

ax.set_xlabel('Year', fontsize=12, fontweight='bold')
ax.set_ylabel('Number of Records', fontsize=12, fontweight='bold')
ax.set_title('Cluster Distribution Over Time', fontsize=14, fontweight='bold')
ax.legend(fontsize=11)
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('cluster_timeline.png', dpi=300, bbox_inches='tight')
print('✓ Saved cluster_timeline.png')

print('\n' + '='*70)
print('Analysis complete!')
print('='*70)
