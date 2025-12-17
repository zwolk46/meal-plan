import "server-only";
import { openaiText } from "./openai";
import { geminiText, geminiVision } from "./gemini";


export type AgentRoute =
  | "replan"
  | "instructions"
  | "image/pantry"
  | "image/order"
  | "image/cookcheck";

function pick(route: AgentRoute): { provider: "openai" | "gemini"; model: string } {
  switch (route) {
    case "replan":
      return { provider: "openai", model: "gpt-5.2" };
    case "instructions":
      return { provider: "openai", model: "gpt-5-mini" };
    case "image/pantry":
    case "image/order":
    case "image/cookcheck":
      return { provider: "gemini", model: "gemini-3-pro-preview" };
    default: {
      const _exhaustive: never = route;
      return _exhaustive;
    }
  }
}

export async function runAgent(route: AgentRoute, prompt: string) {
  const { provider, model } = pick(route);

  if (provider === "openai") {
    // Responses API is the recommended direction for new builds. 
    return await openaiText(model, [
      { role: "system", content: "You are a helpful meal-planning assistant. Output only what the route expects." },
      { role: "user", content: prompt },
    ]);
  }

  // Gemini vision routes will evolve to accept images; for now we’re smoke-testing text.
  return await geminiText(model, prompt);
}

export async function runAgentWithImage(
  route: AgentRoute,
  prompt: string,
  imageBase64: string,
  mimeType: string,
  config?: any
) {
  const { provider, model } = pick(route);
  if (provider !== "gemini") {
    throw new Error(`Route ${route} is not configured for image input.`);
  }
  return await geminiVision(model, prompt, imageBase64, mimeType, config);
}



