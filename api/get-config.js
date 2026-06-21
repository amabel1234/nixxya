export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const GH_TOKEN = process.env.GH_DATA_TOKEN;
    const gh = { "Authorization":`Bearer ${GH_TOKEN}`,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28" };
    try {
      const r = await fetch("https://api.github.com/repos/amabel1234/nixxya/contents/data/config.json",{headers:gh});
      if (!r.ok) return res.json({ premiumPrice:10000, dailyFreeLimit:20, qrisUrl:"", danaNumber:"", danaName:"" });
      const d = await r.json();
      const cfg = JSON.parse(Buffer.from(d.content,"base64").toString("utf-8"));
      const { premiumPrice=10000, dailyFreeLimit=20, qrisUrl="", danaNumber="", danaName="" } = cfg;
      return res.json({ premiumPrice, dailyFreeLimit, qrisUrl, danaNumber, danaName });
    } catch { return res.json({ premiumPrice:10000, dailyFreeLimit:20, qrisUrl:"", danaNumber:"", danaName:"" }); }
  }