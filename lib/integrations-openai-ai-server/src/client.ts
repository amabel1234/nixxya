import OpenAI from "openai";

  function createClient(): { client: OpenAI; model: string; useStreaming: boolean } {
    // Prioritas 1: Replit AI Integrations
    if (
      process.env.AI_INTEGRATIONS_OPENAI_BASE_URL &&
      process.env.AI_INTEGRATIONS_OPENAI_API_KEY
    ) {
      return {
        client: new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        }),
        model: "gpt-4o-mini",
        useStreaming: true,
      };
    }

    // Prioritas 2: OpenAI key langsung
    if (process.env.OPENAI_API_KEY) {
      return {
        client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
        model: "gpt-4o-mini",
        useStreaming: true,
      };
    }

    // Prioritas 3: GitHub Models (cepat, gratis, butuh GITHUB_TOKEN di Vercel env)
    if (process.env.GITHUB_TOKEN) {
      return {
        client: new OpenAI({
          apiKey: process.env.GITHUB_TOKEN,
          baseURL: "https://models.inference.ai.azure.com",
        }),
        model: "gpt-4o-mini",
        useStreaming: true,
      };
    }

    // Fallback: Pollinations.ai (gratis, tanpa key, tapi lambat)
    return {
      client: new OpenAI({
        apiKey: "dummy",
        baseURL: "https://text.pollinations.ai/openai",
      }),
      model: "gpt-oss-20b",
      useStreaming: false,
    };
  }

  const { client, model, useStreaming } = createClient();
  export const openai = client;
  export const AI_MODEL = model;
  export const STREAMING_ENABLED = useStreaming;
  