export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();
    const email = (req.query.email || "").toLowerCase().trim();
    if (!email) return res.json({ isPremium: false });
    const GH_TOKEN = process.env.GH_DATA_TOKEN;
    const headers = { "Authorization":`Bearer ${GH_TOKEN}`,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28" };
    try {
      const r = await fetch("https://api.github.com/repos/amabel1234/nixxya/contents/data/users.json", { headers });
      if (!r.ok) return res.json({ isPremium: false });
      const d = await r.json();
      const users = JSON.parse(Buffer.from(d.content,"base64").toString("utf-8"));
      const u = users.find(u => u.email === email);
      return res.json({ isPremium: u?.isPremium === true });
    } catch { return res.json({ isPremium: false }); }
  }