import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/summary')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch backend data');
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400 font-medium">Analyzing trained model metrics...</p>
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
        </div>
      </div>
    );
  }

  const clusterCountsRaw = data.cluster_counts ?? data.clusters ?? {};
  const clusterCounts = typeof clusterCountsRaw === 'string'
    ? JSON.parse(clusterCountsRaw)
    : clusterCountsRaw;
  const averageTotalWaste = data.average_total_waste ?? data.avg_total_waste_tons ?? 0;
  const averageEconomicLoss = data.average_economic_loss ?? data.avg_economic_loss_million ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-1 rounded-full">
              ML Clustering Active
            </span>
            <h1 className="text-2xl font-bold tracking-tight mt-2 text-white">
              Food Waste Clustering Analysis
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected to API
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* KPI Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KPI 1 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
            <p className="text-sm font-medium text-slate-400">Total Samples Trained</p>
            <h3 className="text-3xl font-bold mt-2 text-white">{data.rows?.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 mt-1">Dataset rows analyzed</p>
          </div>

          {/* KPI 2 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-sky-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 h-24 w-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all"></div>
            <p className="text-sm font-medium text-slate-400">Avg Total Waste</p>
            <h3 className="text-3xl font-bold mt-2 text-white">
              {parseFloat(averageTotalWaste).toLocaleString(undefined, { maximumFractionDigits: 2 })} tons
            </h3>
            <p className="text-xs text-slate-500 mt-1">Average waste per record</p>
          </div>

          {/* KPI 3 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
            <p className="text-sm font-medium text-slate-400">Avg Economic Loss</p>
            <h3 className="text-3xl font-bold mt-2 text-white">
              ${parseFloat(averageEconomicLoss).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
            </h3>
            <p className="text-xs text-slate-500 mt-1">Financial impact avg</p>
          </div>

          {/* KPI 4 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-violet-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all"></div>
            <p className="text-sm font-medium text-slate-400">Active Clusters</p>
            <h3 className="text-3xl font-bold mt-2 text-white">{Object.keys(clusterCounts || {}).length} Clusters</h3>
            <p className="text-xs text-slate-500 mt-1">Optimal grouping detected</p>
          </div>
        </section>

        {/* Cluster Share & Models */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cluster Breakdown Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-1">
            <h3 className="text-lg font-semibold text-white">Cluster Distribution</h3>
            <p className="text-xs text-slate-400 mt-1">How samples were allocated by the model</p>
            
            <div className="mt-6 space-y-4">
              {clusterCounts && Object.entries(clusterCounts).map(([cluster, count]) => {
                const percentage = ((count / data.rows) * 100).toFixed(1);
                const color = cluster === '0' ? 'bg-emerald-500' : 'bg-sky-500';
                return (
                  <div key={cluster} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-300">Cluster {cluster}</span>
                      <span className="text-slate-400">{count.toLocaleString()} rows ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className={`${color} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Summary Table */}
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
                    <td className="py-3.5 text-slate-400">Waste Volume, Economic Loss</td>
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
                    <td className="py-3.5"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-950 text-violet-400 border border-violet-800">Fitted</span></td>
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