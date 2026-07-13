import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function Home() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await fetch('/api/summary');
        if (!response.ok) throw new Error('Failed to load summary');
        const data = await response.json();
        setSummary(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  return (
    <>
      <Head>
        <title>Food Waste Clustering</title>
        <meta name="description" content="Front-end for food waste clustering analysis" />
      </Head>
      <main className="page-shell">
        <div className="card">
          <h1>Food Waste Clustering App</h1>
          <p>This page now connects a Vercel frontend to a FastAPI backend.</p>

          <div className="info-block">
            <h2>Backend status</h2>
            {loading && <p>Loading summary...</p>}
            {error && <p className="error">{error}</p>}
            {summary && (
              <>
                <p><strong>Rows:</strong> {summary.rows}</p>
                <p><strong>Cluster counts:</strong> {JSON.stringify(summary.clusters)}</p>
                <p><strong>Average total waste:</strong> {summary.avg_total_waste_tons} tons</p>
                <p><strong>Average economic loss:</strong> {summary.avg_economic_loss_million} million</p>
              </>
            )}
          </div>

          <div className="info-block">
            <h2>How to run locally</h2>
            <ol>
              <li>Start the backend: <code>uvicorn backend.app:app --reload</code></li>
              <li>Start the frontend: <code>npm run dev</code></li>
              <li>Open <code>http://localhost:3000</code></li>
            </ol>
          </div>
        </div>
      </main>
    </>
  );
}
