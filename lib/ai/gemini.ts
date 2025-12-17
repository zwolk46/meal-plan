import "server-only";
import { GoogleGenAI } from "@google/genai";

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY in .env.local");
  }
  return new GoogleGenAI({ apiKey: key });
}

export async function geminiText(model: string, prompt: string) {
  const ai = getGeminiClient();
  const resp = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  return resp.text ?? "";
}

export async function geminiVision(
  model: string,
  prompt: string,
  imageBase64: string,
  mimeType: string,
  config?: any
) {
  const ai = getGeminiClient();

  // This "inlineData" pattern is the standard way to send base64 images. :contentReference[oaicite:1]{index=1}
  const contents = [
    { inlineData: { mimeType, data: imageBase64 } },
    { text: prompt },
  ];

  const resp = await ai.models.generateContent({
    model,
    contents,
    config,
  });

  return resp.text ?? "";
}
