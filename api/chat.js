// Vercel Serverless Function — /api/chat
    // Groq (jika ada GROQ_API_KEY) → fallback Pollinations GET (no key needed)

    const GROQ_MODELS = {
      deepseekv3:"llama-3.3-70b-versatile", christyai:"llama-3.3-70b-versatile",
      gpt4o:"llama-3.3-70b-versatile", gpt3:"llama-3.1-8b-instant",
      copilot:"llama-3.3-70b-versatile", gemini25v1:"llama-3.3-70b-versatile",
      gemini25v2:"llama-3.3-70b-versatile", grok4fast:"llama-3.3-70b-versatile",
      grok3mini:"llama-3.1-8b-instant", grok3jail1:"llama-3.3-70b-versatile",
      grok3jail2:"llama-3.3-70b-versatile", llama4:"meta-llama/llama-4-scout-17b-16e-instruct",
      llama33:"llama-3.3-70b-versatile", gemma:"llama-3.3-70b-versatile",
      mistral:"llama-3.3-70b-versatile", groqmini:"llama-3.1-8b-instant",
      felo:"llama-3.3-70b-versatile", turboseek:"llama-3.1-8b-instant",
      perplexity:"llama-3.3-70b-versatile", perplexed:"llama-3.3-70b-versatile",
      muslim:"llama-3.3-70b-versatile", aoyo:"llama-3.1-8b-instant",
      gptoss120:"llama-3.3-70b-versatile", gptoss20:"llama-3.1-8b-instant",
      venice:"llama-3.3-70b-versatile", ripple:"llama-3.1-8b-instant",
    };

    function clean(t) {
      t = t.trim();
      if (t.includes("</think>")) t = (t.split("</think>").pop() || t).trim();
      t = t.replace(/\$\$[\s\S]*?\$\$/g,"").replace(/\$[^$\n]*?\$/g,"");
      return t.replace(/^(okay|sure|baik|tentu|of course|tentu saja)[,!.\s]*/i,"").trim();
    }

    function readBody(req) {
      return new Promise((resolve) => {
        let b = "";
        req.on("data", c => { b += c; });
        req.on("end", () => { try { resolve(JSON.parse(b||"{}")); } catch { resolve({}); } });
        req.on("error", () => resolve({}));
      });
    }

    function timeout(ms) {
      return new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));
    }

    async function tryGroq(messages, modelId) {
      const key = process.env.GROQ_API_KEY;
      if (!key) { console.log("[chat] No GROQ_API_KEY"); return null; }
      try {
        const model = GROQ_MODELS[modelId] || "llama-3.3-70b-versatile";
        console.log("[chat] Groq model:", model);
        const res = await Promise.race([
          fetch("https://api.groq.com/openai/v1/chat/completions", {
            method:"POST",
            headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
            body: JSON.stringify({ model, messages, max_tokens:2048, temperature:0.7 }),
          }),
          timeout(25000),
        ]);
        if (!res.ok) {
          const errText = await res.text();
          console.log("[chat] Groq error", res.status, errText.slice(0,200));
          return null;
        }
        const d = await res.json();
        const text = d.choices?.[0]?.message?.content || "";
        console.log("[chat] Groq ok, len:", text.length);
        return text.trim() ? text : null;
      } catch(e) {
        console.log("[chat] Groq exception:", e.message);
        return null;
      }
    }

    async function tryPollinations(messages) {
      const seed = Math.floor(Math.random() * 999999);
      const userMsg = messages.filter(m => m.role === "user").pop()?.content || "";
      const sysMsg = messages.find(m => m.role === "system")?.content || "";
      const hist = messages.filter(m => m.role !== "system").slice(0,-1)
        .map(m => (m.role==="user"?"User":"AI") + ": " + m.content.slice(0,300)).join("\n");
      const fullSys = hist ? sysMsg + "\n\nKonteks:\n" + hist : sysMsg;

      // model "openai" = model yang masih aktif di Pollinations
      const url = "https://text.pollinations.ai/" +
        encodeURIComponent(userMsg.slice(0,800)) +
        "?model=openai&seed=" + seed +
        "&system=" + encodeURIComponent(fullSys.slice(0,1200)) +
        "&private=true";

      try {
        console.log("[chat] Trying Pollinations fallback");
        const res = await Promise.race([
          fetch(url),
          timeout(20000),
        ]);
        if (!res.ok) { console.log("[chat] Pollinations error", res.status); return null; }
        const text = await res.text();
        console.log("[chat] Pollinations ok, len:", text.length);
        return text.trim() || null;
      } catch(e) {
        console.log("[chat] Pollinations exception:", e.message);
        return null;
      }
    }

    module.exports = async (req, res) => {
      res.setHeader("Access-Control-Allow-Origin","*");
      res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers","Content-Type");
      res.setHeader("Content-Type","application/json");

      if (req.method === "OPTIONS") { res.writeHead(200); res.end("{}"); return; }
      if (req.method !== "POST") { res.writeHead(405); res.end(JSON.stringify({error:"Method not allowed"})); return; }

      const body = await readBody(req);
      const { messages, model: modelId } = body;

      if (!Array.isArray(messages) || !messages.length) {
        res.writeHead(400); res.end(JSON.stringify({error:"messages diperlukan"})); return;
      }

      let text = await tryGroq(messages, modelId || "deepseekv3");
      if (!text) text = await tryPollinations(messages);

      if (text) {
        res.writeHead(200);
        res.end(JSON.stringify({ content: clean(text) }));
      } else {
        res.writeHead(503);
        res.end(JSON.stringify({ error: "Maaf, AI sedang sibuk. Coba lagi ya!" }));
      }
    };
  