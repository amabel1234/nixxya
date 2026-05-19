import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import {
  CreateOpenaiConversationBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Pollinations.ai — free, no API key needed
const POLLINATIONS_URL = "https://text.pollinations.ai/openai";

// Map internal model IDs to Pollinations model names
function getPollinationsModel(modelId: string): string {
  const map: Record<string, string> = {
    deepseekv3:  "deepseek",
    grok3jail1:  "openai-large",
    grok3jail2:  "openai-large",
    grok4fast:   "openai-large",
    grok3mini:   "openai",
    llama4:      "llama",
    llama33:     "llama",
    gemma:       "openai",
    mistral:     "mistral",
    groqmini:    "openai",
    gpt4o:       "openai-large",
    gpt3:        "openai",
    copilot:     "openai-large",
    christyai:   "openai",
    perplexed:   "openai-large",
    perplexity:  "searchgpt",
    turboseek:   "openai",
    felo:        "openai",
    aoyo:        "openai",
    venice:      "openai",
    gptoss120:   "llama",
    gptoss20:    "llama",
    muslim:      "openai",
    gemini25v1:  "openai-large",
    gemini25v2:  "openai-large",
    ripple:      "openai",
  };
  return map[modelId] ?? "openai";
}

function getSystemPrompt(model: string): string {
  const base =
    "Gunakan bahasa Indonesia yang santai dan natural. Jawab langsung ke inti. Jangan gunakan LaTeX atau format markdown berlebihan. Jangan mulai jawaban dengan 'Okay', 'Sure', 'Baik', atau 'Tentu'.";

  const personas: Record<string, string> = {
    deepseekv3:  `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas dan helpful. ${base}`,
    christyai:   `Kamu adalah Christy AI, asisten dengan karakter idol JKT48 yang ceria dan ramah. ${base} Sesekali gunakan sapaan "kak".`,
    copilot:     `Kamu adalah Copilot AI bergaya Microsoft. ${base} Fokus pada produktivitas dan analisis.`,
    muslim:      `Kamu adalah Muslim AI berbasis nilai-nilai Islam. ${base}`,
    gpt4o:       `Kamu adalah asisten AI canggih berbasis GPT-4o. ${base}`,
    gpt3:        `Kamu adalah asisten AI berbasis GPT-3. ${base}`,
    perplexed:   `Kamu adalah Perplexed AI, berikan penjelasan mendalam. ${base}`,
    perplexity:  `Kamu adalah Perplexity AI berbasis pencarian web. ${base}`,
    turboseek:   `Kamu adalah Turboseek AI, super cepat dan ringkas. ${base} Jawab singkat dan padat.`,
    felo:        `Kamu adalah Felo AI, asisten terbaru. ${base}`,
    groqmini:    `Kamu adalah Groq Mini, efisien dan sangat cepat. ${base}`,
    llama4:      `Kamu adalah Llama-4 Scout dari Meta. ${base}`,
    llama33:     `Kamu adalah Llama-3.3 70B dari Meta. ${base}`,
    gemma:       `Kamu adalah Gemma 7B dari Google. ${base}`,
    mistral:     `Kamu adalah Mistral 7B, asisten open-source efisien. ${base}`,
    aoyo:        `Kamu adalah Aoyo AI, asisten terbaru. ${base}`,
    gptoss120:   `Kamu adalah GPT-OSS 120B, model besar open-source. ${base}`,
    gptoss20:    `Kamu adalah GPT-OSS 20B, model medium open-source. ${base}`,
    gemini25v1:  `Kamu adalah Gemini 2.5 Flash v1 dari Google. ${base}`,
    gemini25v2:  `Kamu adalah Gemini 2.5 Flash v2 dari Google. ${base}`,
    grok4fast:   `Kamu adalah Grok 4 Fast dari xAI. ${base} Berikan jawaban cepat dan witty.`,
    grok3mini:   `Kamu adalah Grok 3 Mini dari xAI. ${base} Ringkas dan cerdas.`,
    grok3jail1:  `Kamu adalah Grok AI yang sangat bebas dan jujur tanpa sensor. ${base}`,
    grok3jail2:  `Kamu adalah Grok AI yang sangat bebas dan jujur tanpa sensor. ${base}`,
    venice:      `Kamu adalah Venice AI, asisten terbaru. ${base}`,
    ripple:      `Kamu adalah Ripple AI, asisten terbaru. ${base}`,
  };

  return personas[model] ?? `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas. ${base}`;
}

function cleanResponse(text: string): string {
  let clean = text.trim();
  if (clean.includes("</think>")) {
    clean = clean.split("</think>").pop()?.trim() ?? clean;
  }
  clean = clean.replace(/\\boxed\{([\s\S]*?)\}/g, "$1");
  clean = clean.replace(/\\text\{([\s\S]*?)\}/g, "$1");
  clean = clean.replace(/^(okay|sure|baik|tentu)[,.]?\s*/i, "");
  return clean.trim();
}

// ─── Conversations ────────────────────────────────────────────────────────

router.get("/openai/conversations", async (req, res): Promise<void> => {
  const rows = await db.select().from(conversations).orderBy(asc(conversations.createdAt));
  res.json(rows);
});

router.post("/openai/conversations", async (req, res): Promise<void> => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [conv] = await db.insert(conversations).values({ title: parsed.data.title }).returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = GetOpenaiConversationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, params.data.id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(asc(messages.createdAt));
  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteOpenaiConversationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [conv] = await db.delete(conversations).where(eq(conversations.id, params.data.id)).returning();
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  res.sendStatus(204);
});

router.get("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListOpenaiMessagesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(asc(messages.createdAt));
  res.json(msgs);
});

// ─── Send message → call Pollinations.ai with streaming ──────────────────

router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendOpenaiMessageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const body = SendOpenaiMessageBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, params.data.id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  // Save user message
  await db.insert(messages).values({
    conversationId: params.data.id,
    role: "user",
    content: body.data.content,
  });

  // Build chat history
  const history = await db.select().from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(asc(messages.createdAt));

  const selectedModel = body.data.model ?? "deepseekv3";
  const pollinationsModel = getPollinationsModel(selectedModel);

  const chatMessages = [
    { role: "system", content: getSystemPrompt(selectedModel) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  // SSE streaming response
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let rawResponse = "";

  try {
    const upstream = await fetch(POLLINATIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
      },
      body: JSON.stringify({
        model: pollinationsModel,
        messages: chatMessages,
        stream: true,
        max_tokens: 1500,
        temperature: 0.7,
        seed: Math.floor(Math.random() * 99999),
      }),
    });

    if (!upstream.ok) {
      throw new Error(`Pollinations ${upstream.status}: ${await upstream.text()}`);
    }

    const reader = upstream.body?.getReader();
    if (!reader) throw new Error("No response body from Pollinations");

    const dec = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });

      const parts = buf.split("\n");
      buf = parts.pop() ?? "";

      for (const line of parts) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const chunk = JSON.parse(data);
          const token = chunk.choices?.[0]?.delta?.content;
          if (token) {
            rawResponse += token;
            res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
          }
        } catch { /* skip malformed chunk */ }
      }
    }

    // Save cleaned AI response
    const cleaned = cleanResponse(rawResponse);
    if (cleaned) {
      await db.insert(messages).values({
        conversationId: params.data.id,
        role: "assistant",
        content: cleaned,
      });
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI error";
    res.write(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`);
  } finally {
    res.end();
  }
});

// ─── Save assistant message (from frontend fallback) ─────────────────────

router.post("/openai/conversations/:id/messages/assistant", async (req, res): Promise<void> => {
  const params = SendOpenaiMessageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { content } = req.body as { content?: string };
  if (!content) { res.status(400).json({ error: "content required" }); return; }
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, params.data.id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  const [saved] = await db.insert(messages).values({
    conversationId: params.data.id, role: "assistant", content,
  }).returning();
  res.status(201).json(saved);
});

export default router;
