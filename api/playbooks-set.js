// api/playbooks-set.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, playbook, playbooks, key } = req.body || {};

  // Delete requires the commissioner key
  if (action === 'delete') {
    const correct = process.env.COMMISSIONER_KEY;
    if (!correct || key !== correct) {
      return res.status(403).json({ error: 'Unauthorized — commissioner key required to delete playbooks.' });
    }
  }

  // ── Upsert (safe single-playbook save) ────────────────────────────────────
  // Fetches the current list fresh from the server, merges this one playbook
  // in, then writes back. Prevents race conditions where two coaches submitting
  // at the same time wipe each other's work.
  if (action === 'upsert') {
    if (!playbook || typeof playbook !== 'object' || !playbook.teamName) {
      return res.status(400).json({ error: 'Invalid payload — playbook object with teamName required.' });
    }

    // 1. Fetch the current list from Upstash
    let current = [];
    try {
      const r = await fetch(
        `${process.env.UPSTASH_URL}/get/sfl_playbooks_v3`,
        { headers: { Authorization: `Bearer ${process.env.UPSTASH_TOKEN}` } }
      );
      if (r.ok) {
        const data = await r.json();
        if (data.result) {
          current = JSON.parse(data.result);
          if (!Array.isArray(current)) current = [];
        }
      }
    } catch (e) {
      // If we can't read, fail safe — don't overwrite with unknown state
      return res.status(500).json({ error: `Could not read current playbooks before saving: ${e.message}` });
    }

    // 2. Merge: replace existing team entry or append
    const idx = current.findIndex(
      p => p.teamName && p.teamName.toLowerCase() === playbook.teamName.toLowerCase()
    );
    if (idx >= 0) {
      current[idx] = playbook;
    } else {
      current.push(playbook);
    }

    // 3. Write back
    const serialized = JSON.stringify(current);
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
      return res.status(200).json({ ok: true, total: current.length });
    } catch (e) {
      return res.status(500).json({ error: `Failed to save playbook: ${e.message}` });
    }
  }

  // ── Delete (bulk-list write, commissioner only) ───────────────────────────
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
