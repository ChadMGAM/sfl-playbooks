// api/playbooks-set.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, playbooks, key } = req.body || {};

  // Delete requires the commissioner key
  if (action === 'delete') {
    const correct = process.env.COMMISSIONER_KEY;
    if (!correct || key !== correct) {
      return res.status(403).json({ error: 'Unauthorized — commissioner key required to delete playbooks.' });
    }
  }

  if (!Array.isArray(playbooks)) {
    return res.status(400).json({ error: 'Invalid payload — playbooks must be an array.' });
  }

  const serialized = JSON.stringify(playbooks);
  if (serialized.length > 4_000_000) {
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
        body: serialized,
      }
    );
    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: `Upstash error: ${r.status} ${text}` });
    }
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: `Failed to save playbooks: ${e.message}` });
  }
}
