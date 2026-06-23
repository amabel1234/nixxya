export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const GH_TOKEN = process.env.GH_DATA_TOKEN;
  const REPO = "amabel1234/nixxya";
  const BASE = "https://api.github.com";
  const gh = { "Authorization":`Bearer ${GH_TOKEN}`,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json" };

  let adminPass = process.env.ADMIN_PASSWORD || "nixxyadmin2024";
  try { const cr = await fetch(`${BASE}/repos/${REPO}/contents/data/config.json`,{headers:gh}); if(cr.ok){const cd=await cr.json();const cfg=JSON.parse(Buffer.from(cd.content,"base64").toString("utf-8"));if(cfg.adminPassword)adminPass=cfg.adminPassword;} } catch(_){}
  const pass = req.headers["x-admin-pass"] || req.query.pass;
  if (pass !== adminPass) return res.status(403).json({ error: "Akses ditolak" });

  const { email, action } = req.body || {};
  if (!email || !action) return res.status(400).json({ error: "email dan action wajib" });

  try {
    const gr = await fetch(`${BASE}/repos/${REPO}/contents/data/users.json`, { headers: gh });
    if (!gr.ok) return res.status(404).json({ error: "users.json tidak ditemukan" });
    const gd = await gr.json();
    let users = JSON.parse(Buffer.from(gd.content, "base64").toString("utf-8"));
    const sha = gd.sha;

    if (action === "delete") {
      users = users.filter(u => u.email !== email.toLowerCase());
    } else if (action === "suspend") {
      const idx = users.findIndex(u => u.email === email.toLowerCase());
      if (idx !== -1) users[idx].suspended = true;
      else users.push({ id: Date.now(), email: email.toLowerCase(), username: "", suspended: true, registeredAt: new Date().toISOString() });
    } else if (action === "unsuspend") {
      const idx = users.findIndex(u => u.email === email.toLowerCase());
      if (idx !== -1) users[idx].suspended = false;
    } else if (action === "reset-limit") {
      const idx = users.findIndex(u => u.email === email.toLowerCase());
      if (idx !== -1) users[idx].chatCount = 0;
    } else {
      return res.status(400).json({ error: "action tidak dikenal" });
    }

    const body = { message: `admin: ${action} user ${email}`, content: Buffer.from(JSON.stringify(users, null, 2)).toString("base64"), sha };
    await fetch(`${BASE}/repos/${REPO}/contents/data/users.json`, { method: "PUT", headers: gh, body: JSON.stringify(body) });
    return res.json({ ok: true, total: users.length });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
