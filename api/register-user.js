export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { email, username, registeredAt } = req.body || {};
    if (!email || !username) return res.status(400).json({ error: "email dan username wajib" });

    const GH_TOKEN = process.env.GH_DATA_TOKEN;
    const REPO = "amabel1234/nixxya";
    const FILE_PATH = "data/users.json";
    const BASE = "https://api.github.com";
    const headers = {
      "Authorization": `Bearer ${GH_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    };

    try {
      // Baca file yang ada
      const getRes = await fetch(`${BASE}/repos/${REPO}/contents/${FILE_PATH}`, { headers });
      let users = [];
      let fileSha = null;
      if (getRes.ok) {
        const data = await getRes.json();
        fileSha = data.sha;
        users = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
      }

      // Cek duplikat email
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.json({ ok: true, message: "already exists" });
      }

      // Tambah user baru
      users.push({
        id: Date.now(),
        email: email.trim().toLowerCase(),
        username: username.trim(),
        registeredAt: registeredAt || new Date().toISOString(),
      });

      // Simpan kembali ke GitHub
      const body = {
        message: `data: daftar baru ${username}`,
        content: Buffer.from(JSON.stringify(users, null, 2)).toString("base64"),
      };
      if (fileSha) body.sha = fileSha;

      await fetch(`${BASE}/repos/${REPO}/contents/${FILE_PATH}`, {
        method: "PUT", headers,
        body: JSON.stringify(body),
      });

      return res.json({ ok: true, total: users.length });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: String(err) });
    }
  }