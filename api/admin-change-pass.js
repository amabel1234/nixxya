export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { currentPass, newPass } = req.body || {};
    if (!currentPass || !newPass) return res.status(400).json({ error: "currentPass dan newPass wajib" });
    if (newPass.length < 6) return res.status(400).json({ error: "Password baru minimal 6 karakter" });

    const GH_TOKEN = process.env.GH_DATA_TOKEN;
    const REPO = "amabel1234/nixxya";
    const FILE_PATH = "data/config.json";
    const BASE = "https://api.github.com";
    const headers = {
      "Authorization": `Bearer ${GH_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    };

    try {
      // Baca config yang ada
      let config = { adminPassword: process.env.ADMIN_PASSWORD || "nixxyadmin2024" };
      let fileSha = null;
      const getRes = await fetch(`${BASE}/repos/${REPO}/contents/${FILE_PATH}`, { headers });
      if (getRes.ok) {
        const data = await getRes.json();
        fileSha = data.sha;
        config = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
      }

      // Verifikasi password lama
      const currentStored = config.adminPassword || process.env.ADMIN_PASSWORD || "nixxyadmin2024";
      if (currentPass !== currentStored) {
        return res.status(403).json({ error: "Password lama salah!" });
      }

      // Update password baru
      config.adminPassword = newPass;
      const body = {
        message: "data: update admin password",
        content: Buffer.from(JSON.stringify(config, null, 2)).toString("base64"),
      };
      if (fileSha) body.sha = fileSha;

      await fetch(`${BASE}/repos/${REPO}/contents/${FILE_PATH}`, {
        method: "PUT", headers, body: JSON.stringify(body),
      });

      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }