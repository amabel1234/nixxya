// Vercel Serverless Function — /api/chat
  // Groq + Pollinations race (siapa cepat menang)

  const GROQ_MODELS = {
    deepseekv3:"llama-3.3-70b-versatile", christyai:"llama-3.3-70b-versatile",
    gpt4o:"llama-3.3-70b-versatile", gpt3:"llama-3.1-8b-instant",
    copilot:"llama-3.3-70b-versatile", gemini25v1:"llama-3.3-70b-versatile",
    gemini25v2:"llama-3.3-70b-versatile", grok4fast:"llama-3.1-8b-instant",
    grok3mini:"llama-3.1-8b-instant", grok3jail1:"llama-3.3-70b-versatile",
    grok3jail2:"llama-3.3-70b-versatile", llama4:"meta-llama/llama-4-scout-17b-16e-instruct",
    llama33:"llama-3.3-70b-versatile", gemma:"llama-3.1-8b-instant",
    mistral:"llama-3.1-8b-instant", groqmini:"llama-3.1-8b-instant",
    felo:"llama-3.3-70b-versatile", turboseek:"llama-3.1-8b-instant",
    perplexity:"llama-3.3-70b-versatile", perplexed:"llama-3.3-70b-versatile",
    muslim:"llama-3.3-70b-versatile", aoyo:"llama-3.1-8b-instant",
    gptoss120:"llama-3.3-70b-versatile", gptoss20:"llama-3.1-8b-instant",
    venice:"llama-3.3-70b-versatile", ripple:"llama-3.1-8b-instant",
  };

  const DEFAULT_SYSTEM = `Kamu adalah Nixx AI — asisten AI cerdas, jujur, dan sangat membantu buatan Nixx Team.

  Panduan respons:
  - Jawab dalam bahasa yang sama dengan pengguna (Indonesia atau Inggris).
  - Berikan jawaban yang lengkap, akurat, dan informatif.
  - Untuk pertanyaan teknis/koding: sertakan contoh kode yang bisa langsung dipakai.
  - Untuk pertanyaan umum: berikan penjelasan yang jelas dan mudah dipahami.
  - Gunakan format yang rapi (poin, heading, kode block) bila perlu.
  - Jangan tolak pertanyaan yang wajar — selalu coba bantu sebaik mungkin.
  - Jangan sebut dirimu ChatGPT, Claude, atau nama AI lain. Kamu adalah Nixx AI.
  - Hindari filler seperti "Tentu!", "Baik!", "Tentu saja!" di awal kalimat.
  - Jawab langsung ke inti pertanyaan.`;

  function injectSystem(messages) {
    const hasSys = messages.some(m => m.role === "system");
    if (hasSys) return messages;
    return [{ role: "system", content: DEFAULT_SYSTEM }, ...messages];
  }

  function clean(t) {
    t = t.trim();
    if (t.includes("</think>")) t = (t.split("</think>").pop() || t).trim();
    t = t.replace(/\/\$\/\$[\s\S]*?\/\$\/\$/g,"").replace(/\/\$[^\/\$\n]*?\/\$/g,"");
    return t.replace(/^(okay|sure|baik|tentu|of course|tentu saja|halo!|hai!)[,!.\s]*/i,"").trim();
  }

  function readBody(req) {
    return new Promise((resolve) => {
      let b = "";
      req.on("data", c => { b += c; });
      req.on("end", () => { try { resolve(JSON.parse(b||"{}")); } catch { resolve({}); } });
      req.on("error", () => resolve({}));
    });
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
    ]);
  }

  async function tryGroq(messages, modelId) {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    try {
      const model = GROQ_MODELS[modelId] || "llama-3.3-70b-versatile";
      const enriched = injectSystem(messages);
      const res = await withTimeout(
        fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
          body: JSON.stringify({
            model,
            messages: enriched,
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 0.9,
          }),
        }),
        10000 // 10s timeout
      );
      if (!res.ok) return null;
      const d = await res.json();
      const text = d.choices?.[0]?.message?.content || "";
      return text.trim() || null;
    } catch { return null; }
  }

  async function tryPollinations(messages) {
    const seed = Math.floor(Math.random() * 999999);
    const userMsg = messages.filter(m => m.role === "user").pop()?.content || "";
    const sysMsg = messages.find(m => m.role === "system")?.content || DEFAULT_SYSTEM;
    const hist = messages.filter(m => m.role !== "system").slice(0,-1)
      .map(m => (m.role==="user"?"User":"Nixx AI") + ": " + m.content.slice(0,200)).join("\n");
    const fullSys = hist ? sysMsg + "\n\nKonteks:\n" + hist : sysMsg;
    const url = "https://text.pollinations.ai/" +
      encodeURIComponent(userMsg.slice(0,600)) +
      "?model=openai&seed=" + seed +
      "&system=" + encodeURIComponent(fullSys.slice(0,1200)) +
      "&private=true";
    try {
      const res = await withTimeout(fetch(url), 15000);
      if (!res.ok) return null;
      const text = await res.text();
      return text.trim() || null;
    } catch { return null; }
  }

  // Race: Groq dan Pollinations jalan barengan, siapa cepat menang
  async function raceProviders(messages, modelId) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (val) => { if (!settled && val) { settled = true; resolve(val); } };

      tryGroq(messages, modelId).then(done);
      // Delay Pollinations 2 detik agar Groq punya kesempatan menang duluan
      setTimeout(() => tryPollinations(messages).then(done), 2000);

      // Fallback: jika keduanya null setelah 18s
      setTimeout(() => { if (!settled) { settled = true; resolve(null); } }, 18000);
    });
  }

  module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", "application/json");

    if (req.method === "OPTIONS") { res.writeHead(200); res.end("{}"); return; }
    if (req.method !== "POST") { res.writeHead(405); res.end(JSON.stringify({ error: "Method not allowed" })); return; }

    const body = await readBody(req);
    const { messages, model: modelId } = body;

    if (!Array.isArray(messages) || !messages.length) {
      res.writeHead(400); res.end(JSON.stringify({ error: "messages diperlukan" })); return;
    }

    const text = await raceProviders(messages, modelId || "deepseekv3");

    if (text) {
      res.writeHead(200);
      res.end(JSON.stringify({ content: clean(text) }));
    } else {
      res.writeHead(503);
      res.end(JSON.stringify({ error: "Maaf, AI sedang sibuk. Coba lagi ya!" }));
    }
  };
  