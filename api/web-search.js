export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(200).end();

    const q = req.query?.q || "";
    if (!q) return res.status(400).json({ error: "q required" });

    try {
      // DuckDuckGo Instant Answer API (no key needed)
      const ddgRes = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,
        { headers: { "Accept-Language": "id,en-US;q=0.9,en;q=0.8" } }
      );
      const ddg = await ddgRes.json();

      const results = [];

      if (ddg.AbstractText) {
        results.push({
          title: ddg.Heading,
          snippet: ddg.AbstractText,
          url: ddg.AbstractURL,
        });
      }

      (ddg.RelatedTopics || []).slice(0, 5).forEach(t => {
        if (t.Text && !t.Topics) {
          results.push({ title: "", snippet: t.Text, url: t.FirstURL || "" });
        }
      });

      // Jika DuckDuckGo kosong, coba Jina search
      if (results.length === 0) {
        const jinaSearch = await fetch(
          `https://s.jina.ai/${encodeURIComponent(q)}`,
          { headers: { "Accept": "application/json", "X-Respond-With": "no-content" } }
        );
        if (jinaSearch.ok) {
          const jd = await jinaSearch.json();
          (jd.data || []).slice(0, 5).forEach(r => {
            results.push({ title: r.title || "", snippet: r.description || r.content?.slice(0, 300) || "", url: r.url || "" });
          });
        }
      }

      // Fetch konten halaman pertama via Jina Reader jika ada URL
      if (results.length > 0 && results[0].url) {
        try {
          const pageRes = await fetch(`https://r.jina.ai/${results[0].url}`, {
            headers: { "Accept": "text/plain", "X-Return-Format": "text" },
            signal: AbortSignal.timeout(6000),
          });
          if (pageRes.ok) {
            const text = await pageRes.text();
            results[0].content = text.slice(0, 2500);
          }
        } catch (_) {}
      }

      return res.json({ results, query: q });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }
  