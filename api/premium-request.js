export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).end();
    const { email, username, name, phone, payRef } = req.body || {};
    if (!email || !name || !phone) return res.status(400).json({ error: "Data tidak lengkap" });
    const GH_TOKEN = process.env.GH_DATA_TOKEN;
    const REPO = "amabel1234/nixxya";
    const BASE = "https://api.github.com";
    const headers = { "Authorization":`Bearer ${GH_TOKEN}`,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json" };
    try {
      // Read payments
      let payments = []; let sha = null;
      const gr = await fetch(`${BASE}/repos/${REPO}/contents/data/payments.json`, { headers });
      if (gr.ok) { const d = await gr.json(); sha = d.sha; payments = JSON.parse(Buffer.from(d.content,"base64").toString("utf-8")); }
      // Check duplicate
      if (payments.find(p => p.email === email.toLowerCase() && p.status === "pending"))
        return res.json({ ok: true, message: "already pending" });
      payments.push({ id: Date.now(), email: email.toLowerCase(), username, name, phone, payRef: payRef||"", status:"pending", createdAt: new Date().toISOString() });
      const body = { message: `payment: request dari ${username||email}`, content: Buffer.from(JSON.stringify(payments,null,2)).toString("base64") };
      if (sha) body.sha = sha;
      await fetch(`${BASE}/repos/${REPO}/contents/data/payments.json`, { method:"PUT", headers, body: JSON.stringify(body) });
      return res.json({ ok: true });
    } catch(err) { return res.status(500).json({ error: String(err) }); }
  }