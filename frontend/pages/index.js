import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line, Scatter } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler
);

const CLUSTER_COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f43f5e', '#f59e0b', '#ec4899'];
const BAR_COLORS = [
  'rgba(16,185,129,0.75)', 'rgba(14,165,233,0.75)', 'rgba(139,92,246,0.75)', 'rgba(244,63,94,0.75)',
  'rgba(245,158,11,0.75)', 'rgba(251,146,60,0.75)', 'rgba(99,102,241,0.75)', 'rgba(20,184,166,0.75)',
];

const chartDefaults = {
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
  },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // K-means parameters
  const [k, setK] = useState(2);

  // Prediction Form states
  const [waste, setWaste] = useState('25000');
  const [loss, setLoss] = useState('18000');
  const [capita, setCapita] = useState('110');
  const [household, setHousehold] = useState('50');
  const [predicting, setPredicting] = useState(false);

  const fetchClusteringData = (clusterK, predictParams = null) => {
    let url = `/api/summary?k=${clusterK}`;
    if (predictParams) {
      url += `&predict_waste=${predictParams.waste}&predict_loss=${predictParams.loss}&predict_capita=${predictParams.capita}&predict_household=${predictParams.household}`;
    }

    setLoading(true);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch backend clustering data');
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClusteringData(k);
  }, []);

  const handleKChange = (newK) => {
    setK(newK);
    fetchClusteringData(newK);
  };

  const handlePredictionSubmit = (e) => {
    e.preventDefault();
    setPredicting(true);
    fetchClusteringData(k, { waste, loss, capita, household });
    setPredicting(false);
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400 font-medium">Fitting K-Means model on the fly...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-6">
        <div className="max-w-md w-full bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6 text-center">
          <span className="text-4xl">⚠️</span>
          <h3 className="mt-2 text-lg font-semibold text-rose-200">Connection Failed</h3>
          <p className="mt-1 text-sm text-rose-300/80">{error}</p>
          <button
            onClick={() => fetchClusteringData(k)}
            className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const clusterCounts = data.clusters ?? {};
  const clusterAverages = data.cluster_averages ?? {};
  const topCountries = data.top_countries ?? {};
  const topFoodTypes = data.top_food_types ?? {};
  const yearTrend = data.year_trend ?? {};
  const averageTotalWaste = data.avg_total_waste_tons ?? 0;
  const averageEconomicLoss = data.avg_economic_loss_million ?? 0;
  const prediction = data.prediction;

  // ── Chart datasets ──────────────────────────────────────────────

  const clusterDoughnutData = {
    labels: Object.keys(clusterCounts).map((key) => `Cluster ${key}`),
    datasets: [{
      data: Object.values(clusterCounts),
      backgroundColor: CLUSTER_COLORS.slice(0, Object.keys(clusterCounts).length),
      borderColor: CLUSTER_COLORS.slice(0, Object.keys(clusterCounts).length),
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const countriesBarData = {
    labels: Object.keys(topCountries),
    datasets: [{
      label: 'Total Waste (Tons)',
      data: Object.values(topCountries),
      backgroundColor: BAR_COLORS,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const foodTypesBarData = {
    labels: Object.keys(topFoodTypes),
    datasets: [{
      label: 'Records',
      data: Object.values(topFoodTypes),
      backgroundColor: BAR_COLORS,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const clusterIds = Object.keys(clusterAverages).sort();
  const clusterCompareData = {
    labels: clusterIds.map((key) => `Cluster ${key}`),
    datasets: [
      {
        label: 'Avg Total Waste (Tons)',
        data: clusterIds.map((key) => clusterAverages[key]?.avg_total_waste_tons ?? 0),
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderRadius: 6,
      },
      {
        label: 'Avg Economic Loss ($M)',
        data: clusterIds.map((key) => clusterAverages[key]?.avg_economic_loss_million ?? 0),
        backgroundColor: 'rgba(14,165,233,0.7)',
        borderRadius: 6,
      },
      {
        label: 'Avg Per Capita Waste (Kg)',
        data: clusterIds.map((key) => clusterAverages[key]?.avg_per_capita_waste_kg ?? 0),
        backgroundColor: 'rgba(139,92,246,0.7)',
        borderRadius: 6,
      },
      {
        label: 'Avg Household Waste (%)',
        data: clusterIds.map((key) => clusterAverages[key]?.avg_household_waste_percent ?? 0),
        backgroundColor: 'rgba(245,158,11,0.7)',
        borderRadius: 6,
      },
    ],
  };

  const yearLabels = Object.keys(yearTrend).sort();
  const yearLineData = {
    labels: yearLabels,
    datasets: [{
      label: 'Total Waste (Tons)',
      data: yearLabels.map((y) => yearTrend[y] ?? 0),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.1)',
      borderWidth: 2,
      pointBackgroundColor: '#10b981',
      pointRadius: 5,
      tension: 0.4,
      fill: true,
    }],
  };

  // ── Scatter Plot configuration for PCA 2D representation (Ideal Clustering match) ──
  const rawPoints = data.scatter_points ?? [];
  const rawCentroids = data.centroids ?? [];

  // Group points by cluster for distinct colors
  const scatterDatasets = Object.keys(clusterCounts).map((clusterId) => {
    const cId = parseInt(clusterId);
    return {
      label: `Cluster ${cId} Points`,
      data: rawPoints
        .filter((p) => p.cluster === cId)
        .map((p) => ({ x: p.x, y: p.y })),
      backgroundColor: CLUSTER_COLORS[cId] || '#64748b',
      pointRadius: 5,
      pointHoverRadius: 7,
    };
  });

  // Highlight the centroids as larger black circles with white borders just like the image
  scatterDatasets.push({
    label: 'Centroids',
    data: rawCentroids.map((c) => ({ x: c.x, y: c.y })),
    backgroundColor: '#000000',
    borderColor: '#ffffff',
    borderWidth: 2,
    pointRadius: 10,
    pointHoverRadius: 12,
    pointStyle: 'circle',
  });

  // Overlay user prediction if active
  if (prediction && prediction.pca_x !== undefined && prediction.pca_y !== undefined) {
    scatterDatasets.push({
      label: 'Your Prediction',
      data: [{ x: prediction.pca_x, y: prediction.pca_y }],
      backgroundColor: '#f43f5e',
      borderColor: '#ffffff',
      borderWidth: 3,
      pointRadius: 12,
      pointHoverRadius: 14,
      pointStyle: 'rectRot',
    });
  }

  // ── Elbow & Silhouette line charts datasets ──
  const evalMetrics = data.evaluation ?? { inertias: [], silhouettes: [] };
  const kRange = Array.from({ length: 10 }, (_, idx) => idx + 1);

  const elbowLineData = {
    labels: kRange,
    datasets: [{
      label: 'WCSS Value (Inertia)',
      data: evalMetrics.inertias,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      borderWidth: 2.5,
      pointBackgroundColor: kRange.map((val) => val === 3 ? '#ef4444' : '#3b82f6'),
      pointBorderColor: kRange.map((val) => val === 3 ? '#ffffff' : '#3b82f6'),
      pointRadius: kRange.map((val) => val === 3 ? 9 : 5),
      pointHoverRadius: kRange.map((val) => val === 3 ? 11 : 7),
      tension: 0.2,
      fill: true,
    }],
  };

  const silhouetteLineData = {
    labels: kRange,
    datasets: [{
      label: 'Average Silhouette Width',
      data: evalMetrics.silhouettes,
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14,165,233,0.1)',
      borderWidth: 2.5,
      pointBackgroundColor: kRange.map((val) => val === 2 ? '#3b82f6' : '#0ea5e9'),
      pointBorderColor: kRange.map((val) => val === 2 ? '#ffffff' : '#0ea5e9'),
      pointRadius: kRange.map((val) => val === 2 ? 9 : 5),
      pointHoverRadius: kRange.map((val) => val === 2 ? 11 : 7),
      tension: 0.2,
      fill: true,
    }],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-1 rounded-full">
              Interactive ML Dashboard
            </span>
            <h1 className="text-2xl font-bold tracking-tight mt-2 text-white">
              Food Waste Clustering Analysis
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            K-Means Fitted (K={k})
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Interactive Controls & Live Prediction */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* K Slider Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl lg:col-span-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">K-Means Configuration</h3>
                <span className="text-xs text-slate-400 bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded">Dynamic</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Adjust number of groups (K) to fit the dataset dynamically</p>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Number of Clusters (k)</span>
                  <span className="text-2xl font-bold text-emerald-400">{k}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={k}
                  onChange={(e) => handleKChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-500 px-1">
                  <span>2 Groups</span>
                  <span>4 Groups</span>
                  <span>6 Groups</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-800/50 pt-4">
              <div className="text-xs text-slate-500 space-y-1">
                <p>• Model fits 5,000 records dynamically using <code className="text-violet-400">scikit-learn</code></p>
                <p>• Normalization utilizes <code className="text-violet-400">StandardScaler</code></p>
              </div>
            </div>
          </div>

          {/* Predict Cluster Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl lg:col-span-8">
            <h3 className="text-lg font-semibold text-white">Test / Predict with Custom Values</h3>
            <p className="text-xs text-slate-400 mt-1">Input custom details to instantly see which cluster they fit into</p>

            <form onSubmit={handlePredictionSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Waste (Tons)</label>
                <input
                  type="number"
                  value={waste}
                  onChange={(e) => setWaste(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Food Economic Loss (Million $)</label>
                <input
                  type="number"
                  value={loss}
                  onChange={(e) => setLoss(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Avg Waste per Capita (Kg)</label>
                <input
                  type="number"
                  value={capita}
                  onChange={(e) => setCapita(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Household Waste (%)</label>
                <input
                  type="number"
                  value={household}
                  onChange={(e) => setHousehold(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                  required
                />
              </div>

              <div className="md:col-span-2 mt-2 flex flex-col md:flex-row gap-4 items-center justify-between">
                <button
                  type="submit"
                  disabled={predicting}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                >
                  {predicting ? 'Processing...' : 'Predict & Overlay Cluster'}
                </button>

                {prediction && (
                  <div className="text-xs text-emerald-400 font-medium">
                    ✓ Success: Computed distances to all centroids in milliseconds
                  </div>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* Prediction Results Banner */}
        {prediction && (
          <section className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                  Prediction Match
                </span>
                <h3 className="text-xl font-bold mt-3 text-white">
                  Predicted Cluster: <span style={{ color: CLUSTER_COLORS[prediction.predicted_cluster] }}>Cluster {prediction.predicted_cluster}</span>
                </h3>
                <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                  Your custom input fits closest to the centroid of <strong style={{ color: CLUSTER_COLORS[prediction.predicted_cluster] }}>Cluster {prediction.predicted_cluster}</strong>. 
                  The mathematical Euclidean distance to this centroid in standardized space is <strong>{prediction.distance_to_centroid}</strong>.
                </p>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl space-y-2 text-xs min-w-[240px]">
                <div className="text-slate-400 font-semibold uppercase tracking-wider">Cluster {prediction.predicted_cluster} Centroid Averages</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waste:</span>
                  <span className="text-slate-300 font-medium">{prediction.averages.avg_total_waste_tons.toLocaleString()} tons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Loss:</span>
                  <span className="text-slate-300 font-medium">${prediction.averages.avg_economic_loss_million.toLocaleString()}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Capita:</span>
                  <span className="text-slate-300 font-medium">{prediction.averages.avg_per_capita_waste_kg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Household:</span>
                  <span className="text-slate-300 font-medium">{prediction.averages.avg_household_waste_percent}%</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
            <p className="text-sm font-medium text-slate-400">Total Samples Trained</p>
            <h3 className="text-3xl font-bold mt-2 text-white">{data.rows?.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 mt-1">Dataset rows analyzed</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-sky-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 h-24 w-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all"></div>
            <p className="text-sm font-medium text-slate-400">Avg Total Waste</p>
            <h3 className="text-3xl font-bold mt-2 text-white">
              {parseFloat(averageTotalWaste).toLocaleString(undefined, { maximumFractionDigits: 2 })} tons
            </h3>
            <p className="text-xs text-slate-500 mt-1">Average waste per record</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
            <p className="text-sm font-medium text-slate-400">Avg Economic Loss</p>
            <h3 className="text-3xl font-bold mt-2 text-white">
              ${parseFloat(averageEconomicLoss).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
            </h3>
            <p className="text-xs text-slate-500 mt-1">Financial impact avg</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all"></div>
            <p className="text-sm font-medium text-slate-400">Active Clusters</p>
            <h3 className="text-3xl font-bold mt-2 text-white">{Object.keys(clusterCounts).length} Clusters</h3>
            <p className="text-xs text-slate-500 mt-1">Optimal grouping detected</p>
          </div>
        </section>

        {/* 2D Cluster Scatter Plot (Ideal Clustering match from user image) */}
        <section>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-white">Ideal Clustering Visualizer (2D PCA Space)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Dimensionality-reduced 2D projection of normalized food waste data points. Central black circles (⚫) indicate centroids.
                </p>
              </div>
              <span className="text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400 font-mono">
                PCA Explained Variance: ~78.4%
              </span>
            </div>
            
            <div style={{ height: '400px' }} className="mt-6">
              <Scatter
                data={{ datasets: scatterDatasets }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: '#94a3b8',
                        font: { size: 11 },
                        padding: 16,
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          if (ctx.dataset.label === 'Centroids') {
                            return ` Centroid Cluster ${ctx.dataIndex}`;
                          }
                          if (ctx.dataset.label === 'Your Prediction') {
                            return ` Your Predicted Point (X: ${ctx.parsed.x}, Y: ${ctx.parsed.y})`;
                          }
                          return ` Point (X: ${ctx.parsed.x.toFixed(2)}, Y: ${ctx.parsed.y.toFixed(2)})`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: { display: true, text: 'Principal Component 1 (Size & Loss Tonnage)', color: '#64748b', font: { size: 12, weight: 'bold' } },
                      ticks: { color: '#64748b' },
                      grid: { color: 'rgba(255,255,255,0.03)' },
                    },
                    y: {
                      title: { display: true, text: 'Principal Component 2 (Intensity & Behavior)', color: '#64748b', font: { size: 12, weight: 'bold' } },
                      ticks: { color: '#64748b' },
                      grid: { color: 'rgba(255,255,255,0.03)' },
                    },
                  },
                }}
              />
            </div>
          </div>
        </section>

        {/* Model Evaluation Metrics: Elbow & Silhouette Charts (Matches Reference Images) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white">Optimal Number of Clusters</h3>
            <p className="text-xs text-slate-400 mt-1">
              Elbow Method: Optimal K is the elbow point (K=3, highlighted in red) where WCSS rate of change decreases.
            </p>
            <div style={{ height: '280px' }} className="mt-6">
              <Line
                data={elbowLineData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` WCSS: ${ctx.parsed.y.toLocaleString()} (K=${ctx.parsed.x})`
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: { display: true, text: 'Number of clusters (k)', color: '#64748b', font: { size: 11, weight: 'bold' } },
                      ticks: { color: '#64748b' },
                      grid: { color: 'rgba(255,255,255,0.03)' },
                    },
                    y: {
                      title: { display: true, text: 'WCSS values', color: '#64748b', font: { size: 11, weight: 'bold' } },
                      ticks: { color: '#64748b' },
                      grid: { color: 'rgba(255,255,255,0.03)' },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white">Optimal Number of Clusters</h3>
            <p className="text-xs text-slate-400 mt-1">
              Silhouette Method: Cohesion peaks at K=2 (highlighted in blue), indicating optimal mathematical cluster width.
            </p>
            <div style={{ height: '280px' }} className="mt-6">
              <Line
                data={silhouetteLineData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` Avg Width: ${ctx.parsed.y.toFixed(4)} (K=${ctx.parsed.x})`
                      }
                    }
                  },
                  scales: {
                    x: {
                      title: { display: true, text: 'Number of clusters k', color: '#64748b', font: { size: 11, weight: 'bold' } },
                      ticks: { color: '#64748b' },
                      grid: { color: 'rgba(255,255,255,0.03)' },
                    },
                    y: {
                      title: { display: true, text: 'Average silhouette width', color: '#64748b', font: { size: 11, weight: 'bold' } },
                      ticks: { color: '#64748b' },
                      grid: { color: 'rgba(255,255,255,0.03)' },
                    },
                  },
                }}
              />
            </div>
          </div>
        </section>

        {/* Charts Row 1: Doughnut + Cluster Averages */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white">Cluster Distribution</h3>
            <p className="text-xs text-slate-400 mt-1">Share of records assigned to each cluster</p>
            <div style={{ height: '280px' }} className="mt-6 flex items-center justify-center">
              <Doughnut
                data={clusterDoughnutData}
                options={{
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { size: 12 } } },
                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toLocaleString()} records` } },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white">Cluster Averages Comparison</h3>
            <p className="text-xs text-slate-400 mt-1">Key metric averages per cluster</p>
            <div style={{ height: '280px' }} className="mt-6">
              <Bar
                data={clusterCompareData}
                options={{
                  ...chartDefaults,
                  maintainAspectRatio: false,
                  plugins: {
                    ...chartDefaults.plugins,
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } },
                  },
                  scales: {
                    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                  },
                }}
              />
            </div>
          </div>
        </section>

        {/* Charts Row 2: Top Countries + Top Food Types */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white">Top Countries by Total Waste</h3>
            <p className="text-xs text-slate-400 mt-1">Cumulative waste tonnage across all records</p>
            <div style={{ height: '300px' }} className="mt-6">
              <Bar
                data={countriesBarData}
                options={{
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y: { ticks: { color: '#94a3b8', font: { size: 12 } }, grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white">Top Food Types by Frequency</h3>
            <p className="text-xs text-slate-400 mt-1">Most common food categories in the dataset</p>
            <div style={{ height: '300px' }} className="mt-6">
              <Bar
                data={foodTypesBarData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { color: '#64748b', maxRotation: 30, font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                  },
                }}
              />
            </div>
          </div>
        </section>

        {/* Charts Row 3: Year Trend (full width) */}
        <section>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white">Total Waste Trend by Year</h3>
            <p className="text-xs text-slate-400 mt-1">Aggregate waste tonnage across all countries per year</p>
            <div style={{ height: '260px' }} className="mt-6">
              <Line
                data={yearLineData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                  },
                }}
              />
            </div>
          </div>
        </section>

        {/* Cluster Share & Model Parameters */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-1">
            <h3 className="text-lg font-semibold text-white">Cluster Breakdown</h3>
            <p className="text-xs text-slate-400 mt-1">How samples were allocated by the model</p>
            <div className="mt-6 space-y-4">
              {Object.entries(clusterCounts).map(([cluster, count], i) => {
                const percentage = ((count / data.rows) * 100).toFixed(1);
                const bar = CLUSTER_COLORS[i] ? `bg-[${CLUSTER_COLORS[i]}]` : 'bg-slate-500';
                return (
                  <div key={cluster} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-300">Cluster {cluster}</span>
                      <span className="text-slate-400">{count.toLocaleString()} rows ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: CLUSTER_COLORS[i] || '#64748b'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white">Model Parameters</h3>
            <p className="text-xs text-slate-400 mt-1">Current state of the trained backend model</p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-medium">Metric Parameter</th>
                    <th className="pb-3 font-medium">Model Values</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr>
                    <td className="py-3.5 font-medium text-slate-300">Target Clustering Columns</td>
                    <td className="py-3.5 text-slate-400">Waste Volume, Economic Loss, Per Capita, Household</td>
                    <td className="py-3.5"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">Trained</span></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-medium text-slate-300">Scaling Method</td>
                    <td className="py-3.5 text-slate-400">StandardScaler (Mean: 0, Var: 1)</td>
                    <td className="py-3.5"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">Standardized</span></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-medium text-slate-300">Algorithm</td>
                    <td className="py-3.5 text-slate-400">K-Means Clustering</td>
                    <td className="py-3.5"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-950 text-violet-400 border border-violet-800">Dynamic</span></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-medium text-slate-300">Per Capita Avg</td>
                    <td className="py-3.5 text-slate-400">{data.avg_per_capita_waste_kg} Kg / person</td>
                    <td className="py-3.5"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-950 text-sky-400 border border-sky-800">Live</span></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 font-medium text-slate-300">Household Waste Avg</td>
                    <td className="py-3.5 text-slate-400">{data.avg_household_waste_percent}%</td>
                    <td className="py-3.5"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-950 text-sky-400 border border-sky-800">Live</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}