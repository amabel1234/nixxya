import { Router, type IRouter } from "express";
import { eq, asc, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, conversations, messages, messageCounts, users } from "@workspace/db";
import {
  CreateOpenaiConversationBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiMessageBody,
} from "@workspace/api-zod";
import { openai, AI_MODEL, STREAMING_ENABLED } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const FREE_DAILY_LIMIT = 20;

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });
  req.clerkId = auth.userId;
  next();
}

function getSystemPrompt(model: string): string {
  const base =
    "Gunakan bahasa Indonesia yang santai dan natural. Jangan gunakan LaTeX. Jawab langsung ke inti tanpa meta-talk. Jangan gunakan format markdown berlebihan. Jangan mulai jawaban dengan 'Okay', 'Sure', 'Baik', atau 'Tentu'.";

  const personas: Record<string, string> = {
    deepseekv3: `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas dan helpful. ${base}`,
    christyai: `Kamu adalah Christy AI, asisten AI dengan karakter idol JKT48 yang ceria, ramah, dan energik. ${base} Sesekali gunakan sapaan khas idol seperti "kak" atau kata-kata ceria khas idol.`,
    copilot: `Kamu adalah Copilot AI, asisten produktivitas bergaya Microsoft Copilot. ${base} Fokus membantu tugas produktif, pekerjaan, dan analisis.`,
    muslim: `Kamu adalah Muslim AI, asisten AI berbasis nilai-nilai Islam. ${base} Gunakan sapaan Islami jika relevan.`,
    gpt4o: `Kamu adalah asisten AI canggih berbasis GPT-4o. ${base}`,
    gpt3: `Kamu adalah asisten AI berbasis GPT-3. ${base}`,
    perplexed: `Kamu adalah Perplexed AI, asisten yang memberikan penjelasan mendalam. ${base}`,
    perplexity: `Kamu adalah Perplexity AI, asisten berbasis pencarian web. ${base}`,
    turboseek: `Kamu adalah Turboseek AI, asisten super cepat dan ringkas. ${base} Jawab singkat dan padat.`,
    felo: `Kamu adalah Felo AI, asisten AI terbaru. ${base}`,
    groqmini: `Kamu adalah Groq Mini, asisten AI yang efisien dan sangat cepat. ${base}`,
    llama4: `Kamu adalah Llama-4 Scout, asisten AI open-source dari Meta. ${base}`,
    llama33: `Kamu adalah Llama-3.3 70B, model bahasa besar dari Meta. ${base}`,
    gemma: `Kamu adalah Gemma 7B, asisten AI ringan dari Google. ${base}`,
    mistral: `Kamu adalah Mistral 7B, asisten AI open-source yang efisien. ${base}`,
    aoyo: `Kamu adalah Aoyo AI, asisten AI terbaru. ${base}`,
    gptoss120: `Kamu adalah GPT-OSS 120B, model open-source berukuran sangat besar. ${base}`,
    gptoss20: `Kamu adalah GPT-OSS 20B, model open-source ukuran medium. ${base}`,
    gemini25v1: `Kamu adalah Gemini 2.5 Flash v1 dari Google. ${base}`,
    gemini25v2: `Kamu adalah Gemini 2.5 Flash v2 dari Google. ${base}`,
    grok4fast: `Kamu adalah Grok 4 Fast dari xAI. ${base} Berikan jawaban cepat dan witty.`,
    grok3mini: `Kamu adalah Grok 3 Mini dari xAI. ${base} Ringkas dan cerdas.`,
    grok3jail1: `Kamu adalah Grok AI. ${base}`,
    grok3jail2: `Kamu adalah Grok AI. ${base}`,
    venice: `Kamu adalah Venice AI, asisten AI terbaru. ${base}`,
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
  clean = clean.replace(/\\[|\\]|\\(|\\)/g, "");
  clean = clean.replace(/\*\*/g, "");
  clean = clean.replace(/^(okay|sure|baik|tentu)[,.]?\s*/i, "");
  return clean.trim();
}

router.get("/openai/conversations", requireAuth, async (req: any, res): Promise<void> => {
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.clerkId, req.clerkId))
    .orderBy(asc(conversations.createdAt));
  res.json(rows);
});

router.post("/openai/conversations", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [conv] = await db
    .insert(conversations)
    .values({ title: parsed.data.title, clerkId: req.clerkId })
    .returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = GetOpenaiConversationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, params.data.id), eq(conversations.clerkId, req.clerkId)));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(asc(messages.createdAt));
  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteOpenaiConversationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [conv] = await db
    .delete(conversations)
    .where(and(eq(conversations.id, params.data.id), eq(conversations.clerkId, req.clerkId)))
    .returning();
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  res.sendStatus(204);
});

router.get("/openai/conversations/:id/messages", requireAuth, async (req: any, res): Promise<void> => {
  const params = ListOpenaiMessagesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(asc(messages.createdAt));
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", requireAuth, async (req: any, res): Promise<void> => {
  const params = SendOpenaiMessageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const body = SendOpenaiMessageBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const clerkId: string = req.clerkId;

  // Cek status premium user
  const user = await db.select().from(users).where(eq(users.clerkId, clerkId)).then((r) => r[0]);
  const isPremium = user?.isPremium ?? false;

  // Cek batas pesan harian untuk free user
  if (!isPremium) {
    const today = new Date().toISOString().slice(0, 10);
    const countRow = await db
      .select()
      .from(messageCounts)
      .where(and(eq(messageCounts.clerkId, clerkId), eq(messageCounts.date, today)))
      .then((r) => r[0]);
    const usedToday = countRow?.count ?? 0;
    if (usedToday >= FREE_DAILY_LIMIT) {
      res.status(429).json({ error: "Batas pesan harian tercapai. Upgrade ke Premium untuk chat tanpa batas!", limitReached: true });
      return;
    }
  }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, params.data.id), eq(conversations.clerkId, clerkId)));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  const [savedMsg] = await db.insert(messages).values({
    conversationId: params.data.id, role: "user", content: body.data.content,
  }).returning();

  // Increment message count
  if (!isPremium) {
    const today = new Date().toISOString().slice(0, 10);
    const countRow = await db
      .select()
      .from(messageCounts)
      .where(and(eq(messageCounts.clerkId, clerkId), eq(messageCounts.date, today)))
      .then((r) => r[0]);
    if (countRow) {
      await db
        .update(messageCounts)
        .set({ count: countRow.count + 1 })
        .where(eq(messageCounts.id, countRow.id));
    } else {
      await db.insert(messageCounts).values({ clerkId, date: today, count: 1 });
    }
  }

  const history = await db.select().from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(asc(messages.createdAt));

  const selectedModel = body.data.model ?? "deepseekv3";
  const chatMessages = [
    { role: "system" as const, content: getSystemPrompt(selectedModel) },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  if (STREAMING_ENABLED) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let rawResponse = "";
    try {
      const stream = await openai.chat.completions.create({
        model: AI_MODEL,
        max_tokens: 1024,
        messages: chatMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          rawResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      const cleaned = cleanResponse(rawResponse);
      await db.insert(messages).values({ conversationId: params.data.id, role: "assistant", content: cleaned });
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (_err) {
      res.write(`data: ${JSON.stringify({ error: "AI error", done: true })}\n\n`);
    } finally {
      res.end();
    }
    return;
  }

  res.status(201).json({ message: savedMsg, history });
});

router.post("/openai/conversations/:id/messages/assistant", requireAuth, async (req: any, res): Promise<void> => {
  const params = SendOpenaiMessageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { content } = req.body as { content?: string };
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  const clerkId: string = req.clerkId;
  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, params.data.id), eq(conversations.clerkId, clerkId)));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  const [savedMsg] = await db.insert(messages).values({
    conversationId: params.data.id, role: "assistant", content,
  }).returning();

  res.status(201).json(savedMsg);
});

export default router;
