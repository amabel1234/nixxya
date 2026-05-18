/* eslint-disable @typescript-eslint/no-require-imports */
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? { rejectUnauthorized: false } : false,
});

async function query(sql, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);
}
ensureTables().catch(console.error);

const POLLINATIONS_URL = "https://text.pollinations.ai/openai";

const SYSTEM_PROMPTS = {
  deepseekv3: "Kamu adalah Nixx AI, asisten AI pribadi yang cerdas dan helpful.",
  christyai: "Kamu adalah Christy AI, karakter idol JKT48 yang ceria dan ramah. Sesekali gunakan sapaan khas idol.",
  copilot: "Kamu adalah Copilot AI, asisten produktivitas bergaya Microsoft Copilot.",
  muslim: "Kamu adalah Muslim AI, asisten AI berbasis nilai-nilai Islam.",
  gpt4o: "Kamu adalah asisten AI canggih berbasis GPT-4o.",
  gpt3: "Kamu adalah asisten AI berbasis GPT-3.",
  perplexed: "Kamu adalah Perplexed AI, asisten yang memberikan penjelasan mendalam.",
  perplexity: "Kamu adalah Perplexity AI, asisten berbasis pencarian.",
  turboseek: "Kamu adalah Turboseek AI, asisten super cepat dan ringkas. Jawab singkat dan padat.",
  felo: "Kamu adalah Felo AI, asisten AI terbaru.",
  groqmini: "Kamu adalah Groq Mini, asisten AI yang efisien dan sangat cepat.",
  llama4: "Kamu adalah Llama-4 Scout, asisten AI open-source dari Meta.",
  llama33: "Kamu adalah Llama-3.3 70B, model bahasa besar dari Meta.",
  gemma: "Kamu adalah Gemma 7B, asisten AI ringan dari Google.",
  mistral: "Kamu adalah Mistral 7B, asisten AI open-source yang efisien.",
  aoyo: "Kamu adalah Aoyo AI, asisten AI terbaru.",
  gptoss120: "Kamu adalah GPT-OSS 120B, model open-source berukuran sangat besar.",
  gptoss20: "Kamu adalah GPT-OSS 20B, model open-source ukuran medium.",
  gemini25v1: "Kamu adalah Gemini 2.5 Flash v1 dari Google.",
  gemini25v2: "Kamu adalah Gemini 2.5 Flash v2 dari Google.",
  grok4fast: "Kamu adalah Grok 4 Fast dari xAI. Berikan jawaban cepat dan witty.",
  grok3mini: "Kamu adalah Grok 3 Mini dari xAI. Ringkas dan cerdas.",
  venice: "Kamu adalah Venice AI, asisten AI terbaru.",
  ripple: "Kamu adalah Ripple AI, asisten AI terbaru.",
};

const BASE = "Gunakan bahasa Indonesia yang santai dan natural. Jangan gunakan LaTeX. Jawab langsung ke inti. Jangan gunakan format markdown berlebihan.";

function getSystemPrompt(model) {
  const base = SYSTEM_PROMPTS[model] || "Kamu adalah Nixx AI, asisten AI pribadi yang cerdas.";
  return `${base} ${BASE}`;
}

function cleanResponse(text) {
  let clean = text.trim();
  if (clean.includes("</think>")) clean = clean.split("</think>").pop()?.trim() ?? clean;
  clean = clean.replace(/\\boxed\{([\s\S]*?)\}/g, "$1");
  clean = clean.replace(/\\text\{([\s\S]*?)\}/g, "$1");
  clean = clean.replace(/\\[|\\]|\\(|\\)/g, "");
  clean = clean.replace(/\*\*/g, "");
  clean = clean.replace(/^(okay|sure|baik|tentu)[,.]?\s*/i, "");
  return clean.trim();
}

app.get("/api/healthz", (req, res) => res.json({ ok: true }));

app.get("/api/openai/conversations", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM conversations ORDER BY created_at ASC");
    res.json(rows.map(r => ({ id: r.id, title: r.title, createdAt: r.created_at })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/openai/conversations", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });
    const rows = await query("INSERT INTO conversations (title) VALUES ($1) RETURNING *", [title]);
    const r = rows[0];
    res.status(201).json({ id: r.id, title: r.title, createdAt: r.created_at });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/openai/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const convs = await query("SELECT * FROM conversations WHERE id = $1", [id]);
    if (!convs.length) return res.status(404).json({ error: "Not found" });
    const msgs = await query("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC", [id]);
    const c = convs[0];
    res.json({
      id: c.id, title: c.title, createdAt: c.created_at,
      messages: msgs.map(m => ({ id: m.id, role: m.role, content: m.content, createdAt: m.created_at })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/openai/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query("DELETE FROM conversations WHERE id = $1 RETURNING id", [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.sendStatus(204);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/openai/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const msgs = await query("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC", [id]);
    res.json(msgs.map(m => ({ id: m.id, role: m.role, content: m.content, createdAt: m.created_at })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/openai/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const { content, model = "deepseekv3" } = req.body;
    if (!content) return res.status(400).json({ error: "content required" });

    const convs = await query("SELECT id FROM conversations WHERE id = $1", [id]);
    if (!convs.length) return res.status(404).json({ error: "Conversation not found" });

    await query("INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)", [id, "user", content]);

    const history = await query(
      "SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
      [id]
    );

    const chatMessages = [
      { role: "system", content: getSystemPrompt(model) },
      ...history.map(m => ({ role: m.role, content: m.content })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let rawResponse = "";
    try {
      const aiRes = await fetch(POLLINATIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openai", messages: chatMessages, stream: true }),
      });

      const reader = aiRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              rawResponse += delta;
              res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            }
          } catch {}
        }
      }
    } catch (aiErr) {
      res.write(`data: ${JSON.stringify({ error: "AI error", done: true })}\n\n`);
      return res.end();
    }

    const cleaned = cleanResponse(rawResponse);
    await query("INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)", [id, "assistant", cleaned]);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/openai/conversations/:id/messages/assistant", async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "content required" });

    const convs = await query("SELECT id FROM conversations WHERE id = $1", [id]);
    if (!convs.length) return res.status(404).json({ error: "Not found" });

    const rows = await query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING *",
      [id, "assistant", content]
    );
    const m = rows[0];
    res.status(201).json({ id: m.id, role: m.role, content: m.content, createdAt: m.created_at });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
