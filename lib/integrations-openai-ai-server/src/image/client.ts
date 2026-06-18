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

export async function generateImageBuffer(
  prompt: string,
  size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024"
): Promise<Buffer> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size,
    response_format: "b64_json",
  });
  const base64 = response.data?.[0]?.b64_json ?? "";
  if (!base64) throw new Error("Gambar tidak berhasil digenerate, coba lagi.");
  return Buffer.from(base64, "base64");
}

export async function editImages(
  _imageFiles: string[],
  _prompt: string,
): Promise<Buffer> {
  throw new Error("Edit gambar belum didukung.");
}
