export default async function handler(req, res) {
  try {
    const apiUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      res.status(500).json({
        error: 'Missing backend URL configuration',
        details: 'Set BACKEND_API_URL (or NEXT_PUBLIC_API_URL) to your FastAPI deployment URL.',
      });
      return;
    }

    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/summary`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Unable to reach FastAPI backend', details: error.message });
  }
}
