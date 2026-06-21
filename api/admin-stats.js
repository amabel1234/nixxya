export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();

    const pass = req.query.pass || req.headers["x-admin-pass"];
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || "nixxyadmin2024";
    if (pass !== ADMIN_PASS) return res.status(403).json({ error: "Akses ditolak" });

    const GH_TOKEN = process.env.GH_DATA_TOKEN;
    const REPO = "amabel1234/nixxya";
    const FILE_PATH = "data/users.json";
    const BASE = "https://api.github.com";
    const headers = {
      "Authorization": `Bearer ${GH_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    try {
      const getRes = await fetch(`${BASE}/repos/${REPO}/contents/${FILE_PATH}`, { headers });
      if (!getRes.ok) return res.json({ total: 0, users: [] });
      const data = await getRes.json();
      const users = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
      return res.json({ total: users.length, users });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }