export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();
    const GH_TOKEN = process.env.GH_DATA_TOKEN;
    const REPO = "amabel1234/nixxya";
    const BASE = "https://api.github.com";
    const gh = { "Authorization":`Bearer ${GH_TOKEN}`,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json" };

    let adminPass = process.env.ADMIN_PASSWORD || "nixxyadmin2024";
    try { const cr = await fetch(`${BASE}/repos/${REPO}/contents/data/config.json`,{headers:gh}); if(cr.ok){const cd=await cr.json();const cfg=JSON.parse(Buffer.from(cd.content,"base64").toString("utf-8"));if(cfg.adminPassword)adminPass=cfg.adminPassword;} } catch(_){}
    const pass = req.query.pass || req.headers["x-admin-pass"];
    if (pass !== adminPass) return res.status(403).json({ error: "Akses ditolak" });

    const cr = await fetch(`${BASE}/repos/${REPO}/contents/data/config.json`,{headers:gh});
    let config = { adminPassword: adminPass, premiumPrice: 10000, dailyFreeLimit: 20, qrisUrl: "", danaNumber: "", danaName: "" };
    let sha = null;
    if (cr.ok) { const cd = await cr.json(); sha = cd.sha; config = { ...config, ...JSON.parse(Buffer.from(cd.content,"base64").toString("utf-8")) }; }

    if (req.method === "GET") return res.json({ config });

    if (req.method === "POST") {
      const updates = req.body || {};
      const newConfig = { ...config, ...updates };
      if (updates.adminPassword) newConfig.adminPassword = updates.adminPassword;
      const body = { message:"config: update pengaturan premium", content: Buffer.from(JSON.stringify(newConfig,null,2)).toString("base64") };
      if (sha) body.sha = sha;
      await fetch(`${BASE}/repos/${REPO}/contents/data/config.json`,{method:"PUT",headers:gh,body:JSON.stringify(body)});
      return res.json({ ok: true, config: newConfig });
    }
    return res.status(405).end();
  }