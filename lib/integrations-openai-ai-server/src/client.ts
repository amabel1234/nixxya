import OpenAI from "openai";

const hasReplitIntegration =
  !!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL &&
  !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

if (!hasReplitIntegration && !hasOpenAIKey) {
  throw new Error(
    "Butuh salah satu: AI_INTEGRATIONS_OPENAI_BASE_URL + AI_INTEGRATIONS_OPENAI_API_KEY (Replit), atau OPENAI_API_KEY (Vercel/lainnya).",
  );
}

export const openai = hasReplitIntegration
  ? new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    })
  : new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
