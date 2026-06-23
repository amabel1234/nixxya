export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  const GH_TOKEN = process.env.GH_DATA_TOKEN;
  const REPO = "amabel1234/nixxya";
  const BASE = "https://api.github.com";
  const gh = { "Authorization":`Bearer ${GH_TOKEN}`,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json" };

  let adminPass = process.env.ADMIN_PASSWORD || "nixxyadmin2024";
  if (!process.env.ADMIN_PASSWORD) {
    try { const cr = await fetch(`${BASE}/repos/${REPO}/contents/data/config.json`,{headers:gh}); if(cr.ok){const cd=await cr.json();const cfg=JSON.parse(Buffer.from(cd.content,"base64").toString("utf-8"));if(cfg.adminPassword)adminPass=cfg.adminPassword;} } catch(_){}
  }
  const pass = req.query.pass || req.headers["x-admin-pass"];
  if (pass !== adminPass) return res.status(403).json({ error: "Akses ditolak" });

  const readFile = async (path) => {
    const r = await fetch(`${BASE}/repos/${REPO}/contents/${path}`,{headers:gh});
    if(!r.ok) return { data:[], sha:null };
    const d = await r.json(); return { data: JSON.parse(Buffer.from(d.content,"base64").toString("utf-8")), sha: d.sha };
  };
  const writeFile = async (path, data, sha, msg) => {
    const body = { message: msg, content: Buffer.from(JSON.stringify(data,null,2)).toString("base64") };
    if (sha) body.sha = sha;
    await fetch(`${BASE}/repos/${REPO}/contents/${path}`,{method:"PUT",headers:gh,body:JSON.stringify(body)});
  };

  if (req.method === "GET") {
    const { data: payments } = await readFile("data/payments.json");
    return res.json({ payments });
  }
  if (req.method === "POST") {
    const { paymentId, action } = req.body || {};
    const { data: payments, sha: pSha } = await readFile("data/payments.json");
    const idx = payments.findIndex(p => p.id === paymentId);
    if (idx === -1) return res.status(404).json({ error: "Payment tidak ditemukan" });
    payments[idx].status = action;
    payments[idx].updatedAt = new Date().toISOString();
    await writeFile("data/payments.json", payments, pSha, `payment: ${action} ${payments[idx].email}`);
    if (action === "approved") {
      const { data: users, sha: uSha } = await readFile("data/users.json");
      const ui = users.findIndex(u => u.email === payments[idx].email);
      if (ui !== -1) { users[ui].isPremium = true; users[ui].premiumAt = new Date().toISOString(); }
      else { users.push({ id: Date.now(), email: payments[idx].email, username: payments[idx].username||"", isPremium: true, premiumAt: new Date().toISOString(), registeredAt: new Date().toISOString() }); }
      await writeFile("data/users.json", users, uSha, `premium: aktifkan ${payments[idx].email}`);
    }
    return res.json({ ok: true });
  }
  return res.status(405).end();
}
