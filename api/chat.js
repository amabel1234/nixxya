// Vercel Serverless Function — /api/chat
// CommonJS, no external dependencies, uses native fetch (Node 18+)

const GROQ_MODEL_MAP = {
  deepseekv3:  "llama-3.3-70b-versatile",
  christyai:   "llama-3.3-70b-versatile",
  gpt4o:       "llama-3.3-70b-versatile",
  gpt3:        "llama-3.1-8b-instant",
  copilot:     "llama-3.3-70b-versatile",
  gemini25v1:  "llama-3.3-70b-versatile",
  gemini25v2:  "llama-3.3-70b-versatile",
  grok4fast:   "llama-3.3-70b-versatile",
  grok3mini:   "llama-3.1-8b-instant",
  grok3jail1:  "llama-3.3-70b-versatile",
  grok3jail2:  "llama-3.3-70b-versatile",
  llama4:      "meta-llama/llama-4-scout-17b-16e-instruct",
  llama33:     "llama-3.3-70b-versatile",
  gemma:       "llama-3.3-70b-versatile",
  mistral:     "llama-3.3-70b-versatile",
  groqmini:    "llama-3.1-8b-instant",
  felo:        "llama-3.3-70b-versatile",
  turboseek:   "llama-3.1-8b-instant",
  perplexity:  "llama-3.3-70b-versatile",
  perplexed:   "llama-3.3-70b-versatile",
  muslim:      "llama-3.3-70b-versatile",
  aoyo:        "llama-3.1-8b-instant",
  gptoss120:   "llama-3.3-70b-versatile",
  gptoss20:    "llama-3.1-8b-instant",
  venice:      "llama-3.3-70b-versatile",
  ripple:      "llama-3.1-8b-instant",
};

function cleanResponse(text) {
  let t = text.trim();
  if (t.includes("</think>")) t = t.split("</think>").pop()?.trim() ?? t;
  t = t.replace(/\$\$[\s\S]*?\$\$/g, "").replace(/\$[^$\n]*?\$/g, "");
  t = t.replace(/^(okay|sure|baik|tentu|of course|tentu saja)[,!.]?\s*/i, "");
  return t.trim();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); } catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

async function fetchWithTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Returns { text, error } — never throws
async function tryGroq(messages, modelId) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { text: "", error: "GROQ_API_KEY not set" };
  try {
    const model = GROQ_MODEL_MAP[modelId] ?? "llama-3.3-70b-versatile";
    const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, max_tokens: 2048, temperature: 0.7 }),
    }, 25000);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { text: "", error: `Groq ${res.status}: ${errBody.error?.message ?? "unknown"}` };
    }
    const data = await res.json();
    return { text: data.choices?.[0]?.message?.content ?? "", error: "" };
  } catch (e) {
    return { text: "", error: `Groq exception: ${e.message}` };
  }
}

// Returns { text, error } — never throws
async function tryPollinations(messages) {
  const seed = Math.floor(Math.random() * 999999);
  const errors = [];
  for (const model of ["openai-large", "openai", "mistral"]) {
    try {
      const res = await fetchWithTimeout("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: false, seed, private: true }),
      }, 20000);
      if (!res.ok) { errors.push(`Pollinations/${model}: ${res.status}`); continue; }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      if (text.trim()) return { text, error: "" };
      errors.push(`Pollinations/${model}: empty`);
    } catch (e) { errors.push(`Pollinations/${model}: ${e.message}`); }
  }
  return { text: "", error: errors.join("; ") };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") { res.writeHead(200); res.end("{}"); return; }
  if (req.method !== "POST") {
    res.writeHead(405);
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const body = await readBody(req);
  const { messages, model: modelId } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "messages diperlukan" }));
    return;
  }

  const id = modelId ?? "deepseekv3";

  const groqResult = await tryGroq(messages, id);
  if (groqResult.text.trim()) {
    res.writeHead(200);
    res.end(JSON.stringify({ content: cleanResponse(groqResult.text) }));
    return;
  }

  const pollResult = await tryPollinations(messages);
  if (pollResult.text.trim()) {
    res.writeHead(200);
    res.end(JSON.stringify({ content: cleanResponse(pollResult.text) }));
    return;
  }

  // Both failed — return diagnostic info
  res.writeHead(503);
  res.end(JSON.stringify({
    error: "Semua AI sedang sibuk, coba lagi sebentar ya!",
    debug: `groq=${groqResult.error} | poll=${pollResult.error}`,
  }));
};
