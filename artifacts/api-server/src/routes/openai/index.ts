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
import { openai, generateImageBuffer } from "@workspace/integrations-openai-ai-server";

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
    perplexed: `Kamu adalah Perplexed AI, asisten yang memberikan penjelasan mendalam. ${base} Berikan penjelasan menyeluruh dengan contoh jika perlu.`,
    perplexity: `Kamu adalah Perplexity AI, asisten berbasis pencarian web. ${base} Jawab seolah kamu memiliki akses ke informasi terkini.`,
    turboseek: `Kamu adalah Turboseek AI, asisten super cepat dan ringkas. ${base} Jawab singkat dan padat, maksimal 3-4 kalimat kecuali diminta lebih.`,
    felo: `Kamu adalah Felo AI, asisten AI terbaru. ${base}`,
    groqmini: `Kamu adalah Groq Mini, asisten AI yang efisien dan sangat cepat. ${base} Prioritaskan jawaban ringkas dan tepat sasaran.`,
    llama4: `Kamu adalah Llama-4 Scout, asisten AI open-source canggih dari Meta. ${base}`,
    llama33: `Kamu adalah Llama-3.3 70B, model bahasa besar dari Meta. ${base} Berikan jawaban yang mendalam dan terstruktur.`,
    gemma: `Kamu adalah Gemma 7B, asisten AI ringan dari Google. ${base}`,
    mistral: `Kamu adalah Mistral 7B, asisten AI open-source yang efisien. ${base}`,
    aoyo: `Kamu adalah Aoyo AI, asisten AI terbaru. ${base}`,
    gptoss120: `Kamu adalah GPT-OSS 120B, model open-source berukuran sangat besar. ${base} Berikan jawaban yang sangat detail dan komprehensif.`,
    gptoss20: `Kamu adalah GPT-OSS 20B, model open-source ukuran medium. ${base}`,
    gemini25v1: `Kamu adalah Gemini 2.5 Flash v1 dari Google. ${base}`,
    gemini25v2: `Kamu adalah Gemini 2.5 Flash v2 dari Google. ${base}`,
    grok4fast: `Kamu adalah Grok 4 Fast dari xAI. ${base} Berikan jawaban cepat, cerdas, dan sedikit witty seperti karakter Grok.`,
    grok3mini: `Kamu adalah Grok 3 Mini dari xAI. ${base} Ringkas dan cerdas.`,
    grok3jail1: `Kamu adalah Grok AI. ${base}`,
    grok3jail2: `Kamu adalah Grok AI. ${base}`,
    venice: `Kamu adalah Venice AI, asisten AI terbaru. ${base}`,
  };

  return (
    personas[model] ??
    `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas. ${base}`
  );
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

router.get("/openai/conversations", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(conversations)
    .orderBy(asc(conversations.createdAt));
  res.json(rows);
});

router.post("/openai/conversations", async (req, res): Promise<void> => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [conv] = await db
    .insert(conversations)
    .values({ title: parsed.data.title })
    .returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = GetOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(asc(messages.createdAt));
  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db
    .delete(conversations)
    .where(eq(conversations.id, params.data.id))
    .returning();
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.sendStatus(204);
});

router.get(
  "/openai/conversations/:id/messages",
  async (req, res): Promise<void> => {
    const params = ListOpenaiMessagesParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.data.id))
      .orderBy(asc(messages.createdAt));
    res.json(msgs);
  }
);

router.post("/openai/images/generate", async (req, res): Promise<void> => {
  const { prompt, conversationId } = req.body;
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Prompt dibutuhkan" });
    return;
  }

  const convId = conversationId ? parseInt(conversationId) : null;

  if (convId) {
    // Simpan pesan user
    await db.insert(messages).values({
      conversationId: convId,
      role: "user",
      content: `/gambar ${prompt}`,
    });
  }

  try {
    const buffer = await generateImageBuffer(prompt, "1024x1024");
    const b64 = buffer.toString("base64");
    const dataUrl = `data:image/png;base64,${b64}`;

    if (convId) {
      // Simpan gambar sebagai pesan AI
      await db.insert(messages).values({
        conversationId: convId,
        role: "assistant",
        content: dataUrl,
      });
    }

    res.json({ dataUrl, prompt });
  } catch (err: any) {
    const errMsg = `Gagal generate gambar: ${err?.message ?? "Error tidak diketahui"}`;
    if (convId) {
      await db.insert(messages).values({
        conversationId: convId,
        role: "assistant",
        content: errMsg,
      });
    }
    res.status(500).json({ error: errMsg });
  }
});

router.post(
  "/openai/conversations/:id/messages",
  async (req, res): Promise<void> => {
    const params = SendOpenaiMessageParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = SendOpenaiMessageBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, params.data.id));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(messages).values({
      conversationId: params.data.id,
      role: "user",
      content: body.data.content,
    });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.data.id))
      .orderBy(asc(messages.createdAt));

    const selectedModel = body.data.model ?? "deepseekv3";

    const chatMessages = history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    chatMessages.unshift({
      role: "system",
      content: getSystemPrompt(selectedModel),
    });

    const useStreaming = !process.env["VERCEL"];

    if (useStreaming) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let rawResponse = "";

      const stream = await openai.chat.completions.create({
        model: "gpt-5.4",
        max_completion_tokens: 8192,
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

      const cleanedResponse = cleanResponse(rawResponse);

      await db.insert(messages).values({
        conversationId: params.data.id,
        role: "assistant",
        content: cleanedResponse,
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } else {
      const completion = await openai.chat.completions.create({
        model: "gpt-5.4",
        max_completion_tokens: 8192,
        messages: chatMessages,
        stream: false,
      });

      const rawResponse = completion.choices[0]?.message?.content ?? "";
      const cleanedResponse = cleanResponse(rawResponse);

      await db.insert(messages).values({
        conversationId: params.data.id,
        role: "assistant",
        content: cleanedResponse,
      });

      res.json({ content: cleanedResponse, done: true });
    }
  }
);

export default router;
