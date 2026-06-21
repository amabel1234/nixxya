export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();

    const GH_TOKEN = process.env.GH_DATA_TOKEN;
    const REPO = "amabel1234/nixxya";
    const BASE = "https://api.github.com";
    const headers = {
      "Authorization": `Bearer ${GH_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // Baca password dari config.json (atau fallback ke env var)
    let adminPass = process.env.ADMIN_PASSWORD || "nixxyadmin2024";
    try {
      const cfgRes = await fetch(`${BASE}/repos/${REPO}/contents/data/config.json`, { headers });
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        const cfg = JSON.parse(Buffer.from(cfgData.content, "base64").toString("utf-8"));
        if (cfg.adminPassword) adminPass = cfg.adminPassword;
      }
    } catch (_) {}

    const pass = req.query.pass || req.headers["x-admin-pass"];
    if (pass !== adminPass) return res.status(403).json({ error: "Akses ditolak" });

    try {
      const getRes = await fetch(`${BASE}/repos/${REPO}/contents/data/users.json`, { headers });
      if (!getRes.ok) return res.json({ total: 0, users: [] });
      const data = await getRes.json();
      const users = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
      return res.json({ total: users.length, users });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }