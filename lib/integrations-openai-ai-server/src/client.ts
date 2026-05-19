import OpenAI from "openai";

function createClient(): OpenAI {
  const hasReplitIntegration =
    !!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL &&
    !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  if (hasReplitIntegration) {
    return new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }

  if (hasOpenAIKey) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // Fallback: return client that will throw on use
  return new OpenAI({ apiKey: "placeholder-set-OPENAI_API_KEY-on-vercel" });
}

export const openai = createClient();
