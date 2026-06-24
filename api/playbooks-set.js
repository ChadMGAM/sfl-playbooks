// api/playbooks-set.js
// Serverless function — runs on Vercel, token never exposed to browser

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic size guard — free Upstash has 1MB per value limit
  const body = JSON.stringify(req.body);
  if (body.length > 900_000) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  try {
    const r = await fetch(
      `${process.env.UPSTASH_URL}/set/sfl_playbooks_v3`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body,
      }
    );
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save playbooks' });
  }
}
