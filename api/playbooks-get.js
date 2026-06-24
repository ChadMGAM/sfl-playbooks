// api/playbooks-get.js
// Serverless function — runs on Vercel, token never exposed to browser

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const r = await fetch(
      `${process.env.UPSTASH_URL}/get/sfl_playbooks_v3`,
      { headers: { Authorization: `Bearer ${process.env.UPSTASH_TOKEN}` } }
    );
    const data = await r.json();
    // data.result is the stored JSON string, or null if nothing saved yet
    res.status(200).json({ result: data.result });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load playbooks' });
  }
}
