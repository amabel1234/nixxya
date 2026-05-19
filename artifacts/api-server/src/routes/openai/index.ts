import { Router, type IRouter } from "express";
  import { eq, asc } from "drizzle-orm";
  import { openai } from "@workspace/integrations-openai-ai-server";

  const router: IRouter = Router();

  function getSystemPrompt(model: string): string {
    const base =
      "Gunakan bahasa Indonesia yang santai dan natural. Jangan gunakan LaTeX. Jawab langsung ke inti tanpa meta-talk. Jangan gunakan format markdown berlebihan. Jangan mulai jawaban dengan 'Okay', 'Sure', 'Baik', atau 'Tentu'.";

    const personas: Record<string, string> = {
      deepseekv3: `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas dan helpful. ${base}`,
      christyai: `Kamu adalah Christy AI, asisten AI dengan karakter idol JKT48 yang ceria, ramah, dan energik. ${base} Sesekali gunakan sapaan khas idol seperti "kak" atau kata-kata ceria khas idol.`,
      copilot: `Kamu adalah Copilot AI, asisten produktivitas bergaya Microsoft Copilot. ${base} Fokus membantu tugas produktif, pekerjaan, dan analisis.`,
      muslim: `Kamu adalah Muslim AI, asisten AI berbasis nilai-nilai Islam. ${base} Gunakan sapaan Islami jika relevan.`,
      gpt4o: `Kamu adalah asisten AI canggih berbasis GPT-4o. ${base} Berikan jawaban yang detail dan komprehensif.`,
      gpt3: `Kamu adalah asisten AI berbasis GPT-3. ${base}`,
      perplexed: `Kamu adalah Perplexed AI, asisten yang memberikan penjelasan mendalam. ${base}`,
      perplexity: `Kamu adalah Perplexity AI, asisten berbasis pencarian web. ${base}`,
      turboseek: `Kamu adalah Turboseek AI, asisten super cepat dan ringkas. ${base} Jawab singkat dan padat.`,
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
      grok4fast: `Kamu adalah Grok 4 Fast dari xAI. ${base} Berikan jawaban cepat, cerdas, dan sedikit witty.`,
      grok3mini: `Kamu adalah Grok 3 Mini dari xAI. ${base} Ringkas dan cerdas.`,
      grok3jail1: `Kamu adalah Grok AI. ${base}`,
      grok3jail2: `Kamu adalah Grok AI. ${base}`,
      venice: `Kamu adalah Venice AI, asisten AI terbaru. ${base}`,
      ripple: `Kamu adalah Ripple AI, asisten AI terbaru. ${base}`,
      christyai: `Kamu adalah Christy AI, asisten dengan karakter idol JKT48 yang ceria. ${base}`,
    };

    return personas[model] ?? `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas. ${base}`;
  }

  function cleanResponse(text: string): string {
    let clean = text.trim();
    if (clean.includes("</think>")) clean = clean.split("</think>").pop()?.trim() ?? clean;
    clean = clean.replace(/\\boxed\{([\s\S]*?)\}/g, "$1");
    clean = clean.replace(/\\text\{([\s\S]*?)\}/g, "$1");
    clean = clean.replace(/\\\[|\\\]|\\\(|\\\)/g, "");
    clean = clean.replace(/\*\*/g, "");
    clean = clean.replace(/^(okay|sure|baik|tentu)[,.]?\s*/i, "");
    return clean.trim();
  }

  // ── NEW: Stateless chat endpoint (no DB needed) ──────────────────────────────
  router.post("/openai/chat", async (req, res): Promise<void> => {
    const { messages, model: modelId } = req.body as {
      messages: { role: string; content: string }[];
      model?: string;
    };

    if (!messages?.length) {
      res.status(400).json({ error: "messages required" });
      return;
    }

    const model = modelId ?? "deepseekv3";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    try {
      const chatMessages = [
        { role: "system" as const, content: getSystemPrompt(model) },
        ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];

      const stream = await openai.chat.completions.create({
        model: "gpt-5.4",
        max_completion_tokens: 8192,
        messages: chatMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    } catch {
      const errMsg = "Server AI sedang sibuk. Coba lagi ya!";
      res.write(`data: ${JSON.stringify({ content: errMsg })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  });

  // ── Legacy DB-backed routes (kept for compatibility) ─────────────────────────
  // These may fail if DATABASE_URL is unavailable; use /openai/chat instead.
  try {
    const { db, conversations, messages } = await import("@workspace/db");

    router.get("/openai/conversations", async (_req, res): Promise<void> => {
      try {
        const rows = await db.select().from(conversations).orderBy(asc(conversations.createdAt));
        res.json(rows);
      } catch { res.json([]); }
    });

    router.post("/openai/conversations", async (req, res): Promise<void> => {
      try {
        const { title } = req.body as { title?: string };
        if (!title) { res.status(400).json({ error: "title required" }); return; }
        const [conv] = await db.insert(conversations).values({ title }).returning();
        res.status(201).json(conv);
      } catch (e) {
        res.status(500).json({ error: "Database unavailable. Use /api/openai/chat instead." });
      }
    });

    router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
      try {
        const id = Number(req.params["id"]);
        if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
        await db.delete(conversations).where(eq(conversations.id, id));
        res.sendStatus(204);
      } catch { res.sendStatus(204); }
    });

    router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
      try {
        const id = Number(req.params["id"]);
        if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
        const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
        if (!conv) { res.status(404).json({ error: "Not found" }); return; }
        const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
        res.json({ ...conv, messages: msgs });
      } catch { res.status(500).json({ messages: [] }); }
    });

    router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
      try {
        const id = Number(req.params["id"]);
        if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
        const { content, model: selectedModel } = req.body as { content?: string; model?: string };
        if (!content) { res.status(400).json({ error: "content required" }); return; }

        await db.insert(messages).values({ conversationId: id, role: "user", content });
        const history = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
        const modelId = selectedModel ?? "deepseekv3";
        const chatMessages = [
          { role: "system" as const, content: getSystemPrompt(modelId) },
          ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        let rawResponse = "";
        try {
          const stream = await openai.chat.completions.create({ model: "gpt-5.4", max_completion_tokens: 8192, messages: chatMessages, stream: true });
          for await (const chunk of stream) {
            const chunkContent = chunk.choices[0]?.delta?.content;
            if (chunkContent) { rawResponse += chunkContent; res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`); }
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
      } catch {
        res.write(`data: ${JSON.stringify({ content: "Database tidak tersedia." })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    });
  } catch {
    // DB not available — only /openai/chat works
    router.get("/openai/conversations", (_req, res) => res.json([]));
    router.post("/openai/conversations", (_req, res) => res.status(503).json({ error: "DB unavailable" }));
    router.delete("/openai/conversations/:id", (_req, res) => res.sendStatus(204));
    router.get("/openai/conversations/:id", (_req, res) => res.status(503).json({ messages: [] }));
    router.post("/openai/conversations/:id/messages", (_req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.write(`data: ${JSON.stringify({ content: "Database tidak tersedia. Gunakan mode baru." })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });
  }

  export default router;
  