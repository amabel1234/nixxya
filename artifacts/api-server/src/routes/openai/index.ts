import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, asc, and } from "drizzle-orm";
import { db, conversations, messages, users, messageCounts, siteSettings } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

function getSystemPrompt(model: string): string {
  const base =
    "Gunakan bahasa Indonesia yang santai dan natural. Jangan gunakan LaTeX. Jawab langsung ke inti tanpa meta-talk. Jangan gunakan format markdown berlebihan. Jangan mulai jawaban dengan 'Okay', 'Sure', 'Baik', atau 'Tentu'.";

  const personas: Record<string, string> = {
    deepseekv3: `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas dan helpful. ${base}`,
    christyai: `Kamu adalah Christy AI, asisten AI dengan karakter idol JKT48 yang ceria, ramah, dan energik. ${base} Sesekali gunakan sapaan khas idol seperti "kak" atau kata-kata ceria khas idol.`,
    copilot: `Kamu adalah Copilot AI, asisten produktivitas bergaya Microsoft Copilot. ${base} Fokus membantu tugas produktif, pekerjaan, dan analisis.`,
    muslim: `Kamu adalah Muslim AI, asisten AI berbasis nilai-nilai Islam. ${base} Gunakan sapaan Islami jika relevan. Berikan jawaban sesuai dengan nilai-nilai Islam yang moderat.`,
    gpt4o: `Kamu adalah asisten AI canggih berbasis GPT-4o. ${base} Berikan jawaban yang detail dan komprehensif.`,
    gpt3: `Kamu adalah asisten AI berbasis GPT-3. ${base}`,
    perplexed: `Kamu adalah Perplexed AI, asisten yang memberikan penjelasan mendalam. ${base}`,
    perplexity: `Kamu adalah Perplexity AI, asisten berbasis pencarian web. ${base} Jawab seolah kamu memiliki akses ke informasi terkini.`,
    turboseek: `Kamu adalah Turboseek AI, asisten super cepat dan ringkas. ${base} Jawab singkat dan padat, maksimal 3-4 kalimat kecuali diminta lebih.`,
    felo: `Kamu adalah Felo AI, asisten AI terbaru. ${base}`,
    groqmini: `Kamu adalah Groq Mini, asisten AI yang efisien dan sangat cepat. ${base}`,
    llama4: `Kamu adalah Llama-4 Scout, asisten AI open-source canggih dari Meta. ${base}`,
    llama33: `Kamu adalah Llama-3.3 70B, model bahasa besar dari Meta. ${base}`,
    gemma: `Kamu adalah Gemma 7B, asisten AI ringan dari Google. ${base}`,
    mistral: `Kamu adalah Mistral 7B, asisten AI open-source yang efisien. ${base}`,
    aoyo: `Kamu adalah Aoyo AI, asisten AI terbaru. ${base}`,
    gptoss120: `Kamu adalah GPT-OSS 120B, model open-source berukuran sangat besar. ${base}`,
    gptoss20: `Kamu adalah GPT-OSS 20B, model open-source ukuran medium. ${base}`,
    gemini25v1: `Kamu adalah Gemini 2.5 Flash v1 dari Google. ${base}`,
    gemini25v2: `Kamu adalah Gemini 2.5 Flash v2 dari Google. ${base}`,
    grok4fast: `Kamu adalah Grok 4 Fast dari xAI. ${base} Berikan jawaban cepat, cerdas, dan sedikit witty seperti karakter Grok.`,
    grok3mini: `Kamu adalah Grok 3 Mini dari xAI. ${base} Ringkas dan cerdas.`,
    grok3jail1: `Kamu adalah Grok AI. ${base}`,
    grok3jail2: `Kamu adalah Grok AI. ${base}`,
    venice: `Kamu adalah Venice AI, asisten AI terbaru. ${base}`,
    ripple: `Kamu adalah Ripple AI, asisten AI terbaru. ${base}`,
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
  clean = clean.replace(/\\\[|\\\]|\\\(|\\\)/g, "");
  clean = clean.replace(/\*\*/g, "");
  clean = clean.replace(/^(okay|sure|baik|tentu)[,.]?\s*/i, "");
  return clean.trim();
}

async function getFreeLimit(): Promise<number> {
  try {
    const settings = await db.select().from(siteSettings).limit(1).then(r => r[0]);
    return settings?.freeLimit ?? 20;
  } catch {
    return 20;
  }
}

async function checkAndIncrementLimit(clerkId: string): Promise<{ allowed: boolean; count: number; limit: number }> {
  const today = new Date().toISOString().slice(0, 10);

  const user = await db.select().from(users).where(eq(users.clerkId, clerkId)).then(r => r[0]);
  if (user?.isPremium) return { allowed: true, count: 0, limit: 0 };

  const freeLimit = await getFreeLimit();

  const existing = await db.select().from(messageCounts)
    .where(and(eq(messageCounts.clerkId, clerkId), eq(messageCounts.date, today)))
    .then(r => r[0]);

  const currentCount = existing?.count ?? 0;
  if (currentCount >= freeLimit) {
    return { allowed: false, count: currentCount, limit: freeLimit };
  }

  if (existing) {
    await db.update(messageCounts)
      .set({ count: currentCount + 1 })
      .where(and(eq(messageCounts.clerkId, clerkId), eq(messageCounts.date, today)));
  } else {
    await db.insert(messageCounts).values({ clerkId, date: today, count: 1 });
  }

  await db.update(users).set({ lastOnlineAt: new Date() }).where(eq(users.clerkId, clerkId)).catch(() => {});

  return { allowed: true, count: currentCount + 1, limit: freeLimit };
}

router.get("/openai/conversations", async (_req, res): Promise<void> => {
  const rows = await db.select().from(conversations).orderBy(asc(conversations.createdAt));
  res.json(rows);
});

router.post("/openai/conversations", async (req, res): Promise<void> => {
  const { title } = req.body as { title?: string };
  if (!title) { res.status(400).json({ error: "title required" }); return; }
  const [conv] = await db.insert(conversations).values({ title }).returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));
  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
  const [conv] = await db.delete(conversations).where(eq(conversations.id, id)).returning();
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  res.sendStatus(204);
});

router.get("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
  const { content, model: selectedModel } = req.body as { content?: string; model?: string };
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  const auth = getAuth(req);
  const clerkId = auth?.userId;

  if (clerkId) {
    const limitCheck = await checkAndIncrementLimit(clerkId);
    if (!limitCheck.allowed) {
      res.status(429).json({
        error: "LIMIT_REACHED",
        count: limitCheck.count,
        limit: limitCheck.limit,
        message: "Limit harian habis. Upgrade ke Premium untuk pesan unlimited!",
      });
      return;
    }
  }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  await db.insert(messages).values({ conversationId: id, role: "user", content });

  const history = await db.select().from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  const modelId = selectedModel ?? "deepseekv3";
  const chatMessages = [
    { role: "system" as const, content: getSystemPrompt(modelId) },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let rawResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const chunkContent = chunk.choices[0]?.delta?.content;
      if (chunkContent) {
        rawResponse += chunkContent;
        res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
      }
    }
  } catch {
    const errMsg = "Server AI sedang sibuk. Coba lagi ya!";
    rawResponse = errMsg;
    res.write(`data: ${JSON.stringify({ content: errMsg })}\n\n`);
  }

  const cleaned = cleanResponse(rawResponse);
  await db.insert(messages).values({ conversationId: id, role: "assistant", content: cleaned });
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
