import "server-only";
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Simple helper: text in, text out
export async function openaiText(model: string, input: OpenAI.Responses.ResponseCreateParams["input"]) {
  const resp = await openai.responses.create({
    model,
    input,
  });

  return resp.output_text ?? "";
}
