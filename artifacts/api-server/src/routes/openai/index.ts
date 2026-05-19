import { Router, type IRouter } from "express";
import { eq, asc, and, sql } from "drizzle-orm";
import { db, conversations, messages, users, paymentRequests, messageUsage } from "@workspace/db";
import {
  CreateOpenaiConversationBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiMessageBody,
} from "@workspace/api-zod";
import { getAuth } from "@clerk/express";
import OpenAI from "openai";

const router: IRouter = Router();

const FREE_DAILY_LIMIT = 20;

function getOrCreateOpenAI() {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? "dummy";
  if (baseURL) return { client: new OpenAI({ apiKey, baseURL }), model: "gpt-4o-mini", stream: true };
  if (process.env.OPENAI_API_KEY) return { client: new OpenAI({ apiKey }), model: "gpt-4o-mini", stream: true };
  return { client: new OpenAI({ apiKey: "dummy", baseURL: "https://text.pollinations.ai/openai" }), model: "gpt-oss-20b", stream: false };
}

function getSystemPrompt(model: string): string {
  const base = "Gunakan bahasa Indonesia yang santai dan natural. Jangan gunakan LaTeX. Jawab langsung tanpa meta-talk. Jangan gunakan format markdown berlebihan. Jangan mulai dengan 'Okay', 'Sure', 'Baik', atau 'Tentu'.";
  const map: Record<string, string> = {
    deepseekv3: `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas dan helpful. ${base}`,
    christyai: `Kamu adalah Christy AI berkarakter idol JKT48 yang ceria dan ramah. ${base} Sesekali gunakan sapaan "kak".`,
    copilot: `Kamu adalah Copilot AI bergaya Microsoft. ${base}`,
    muslim: `Kamu adalah Muslim AI berbasis nilai-nilai Islam. ${base}`,
    gpt4o: `Kamu adalah asisten AI canggih berbasis GPT-4o. ${base}`,
    turboseek: `Kamu adalah Turboseek AI yang super cepat. ${base} Jawab singkat dan padat.`,
    grok4fast: `Kamu adalah Grok 4 Fast dari xAI. ${base} Witty dan cepat.`,
    grok3mini: `Kamu adalah Grok 3 Mini dari xAI. ${base}`,
    groqmini: `Kamu adalah Groq Mini yang efisien. ${base}`,
    llama4: `Kamu adalah Llama-4 Scout dari Meta. ${base}`,
    llama33: `Kamu adalah Llama-3.3 70B dari Meta. ${base}`,
    venice: `Kamu adalah Venice AI. ${base}`,
  };
  return map[model] ?? `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas. ${base}`;
}

function cleanResponse(text: string): string {
  let c = text.trim();
  if (c.includes("</think>")) c = c.split("</think>").pop()?.trim() ?? c;
  c = c.replace(/\\boxed\{([\s\S]*?)\}/g, "$1");
  c = c.replace(/\\[|\\]|\\(|\\)/g, "");
  c = c.replace(/\*\*/g, "");
  c = c.replace(/^(okay|sure|baik|tentu)[,.]?\s*/i, "");
  return c.trim();
}

async function ensureUserExists(userId: string, email?: string) {
  const [existing] = await db.select().from(users).where(eq(users.id, userId));
  if (!existing) {
    await db.insert(users).values({ id: userId, email: email ?? `${userId}@clerk.local`, name: null });
  }
  return existing ?? (await db.select().from(users).where(eq(users.id, userId)))[0];
}

async function checkAndIncrementUsage(userId: string): Promise<{ allowed: boolean; used: number; limit: number; isPremium: boolean }> {
  const user = await ensureUserExists(userId);
  const isPremium = user.isPremium && (user.premiumUntil == null || user.premiumUntil > new Date());
  if (isPremium) return { allowed: true, used: 0, limit: 999999, isPremium: true };

  const today = new Date().toISOString().split("T")[0];
  const [usage] = await db.select().from(messageUsage)
    .where(and(eq(messageUsage.userId, userId), eq(messageUsage.usageDate, today)));

  if (usage && usage.count >= FREE_DAILY_LIMIT) {
    return { allowed: false, used: usage.count, limit: FREE_DAILY_LIMIT, isPremium: false };
  }

  if (usage) {
    await db.update(messageUsage).set({ count: usage.count + 1 }).where(eq(messageUsage.id, usage.id));
  } else {
    await db.insert(messageUsage).values({ userId, usageDate: today, count: 1 });
  }
  return { allowed: true, used: (usage?.count ?? 0) + 1, limit: FREE_DAILY_LIMIT, isPremium: false };
}

router.get("/openai/conversations", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await ensureUserExists(userId);
  const rows = await db.select().from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(asc(conversations.createdAt));
  res.json(rows);
});

router.post("/openai/conversations", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await ensureUserExists(userId);

  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [conv] = await db.insert(conversations).values({ title: parsed.data.title, userId }).returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = GetOpenaiConversationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [conv] = await db.select().from(conversations)
    .where(and(eq(conversations.id, params.data.id), eq(conversations.userId, userId)));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, params.data.id)).orderBy(asc(messages.createdAt));
  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = DeleteOpenaiConversationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [conv] = await db.delete(conversations)
    .where(and(eq(conversations.id, params.data.id), eq(conversations.userId, userId))).returning();
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.get("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = ListOpenaiMessagesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, params.data.id)).orderBy(asc(messages.createdAt));
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = SendOpenaiMessageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const body = SendOpenaiMessageBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [conv] = await db.select().from(conversations)
    .where(and(eq(conversations.id, params.data.id), eq(conversations.userId, userId)));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }

  const usageCheck = await checkAndIncrementUsage(userId);
  if (!usageCheck.allowed) {
    res.status(429).json({
      error: "Batas pesan harian tercapai",
      used: usageCheck.used,
      limit: usageCheck.limit,
      upgradeRequired: true,
    });
    return;
  }

  await db.insert(messages).values({ conversationId: params.data.id, role: "user", content: body.data.content });

  const history = await db.select().from(messages)
    .where(eq(messages.conversationId, params.data.id)).orderBy(asc(messages.createdAt));

  const selectedModel = body.data.model ?? "deepseekv3";
  const chatMessages = [
    { role: "system" as const, content: getSystemPrompt(selectedModel) },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const { client, model: aiModel, stream: canStream } = getOrCreateOpenAI();

  if (canStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    let raw = "";
    try {
      const stream = await client.chat.completions.create({
        model: aiModel, max_tokens: 1024, messages: chatMessages, stream: true,
      });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) { raw += content; res.write(`data: ${JSON.stringify({ content })}\n\n`); }
      }
      await db.insert(messages).values({ conversationId: params.data.id, role: "assistant", content: cleanResponse(raw) });
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch { res.write(`data: ${JSON.stringify({ error: "AI error", done: true })}\n\n`); }
    finally { res.end(); }
    return;
  }

  res.status(200).json({ history });
});

router.post("/openai/conversations/:id/messages/assistant", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = SendOpenaiMessageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const { content } = req.body as { content?: string };
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  const [conv] = await db.select().from(conversations)
    .where(and(eq(conversations.id, params.data.id), eq(conversations.userId, userId)));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }

  const [msg] = await db.insert(messages).values({ conversationId: params.data.id, role: "assistant", content }).returning();
  res.status(201).json(msg);
});

export default router;
