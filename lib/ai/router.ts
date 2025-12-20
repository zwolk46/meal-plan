import "server-only";
import { openaiText } from "./openai";
import { geminiText, geminiVision } from "./gemini";

// 1. Define the Routes
export type AgentRoute =
  | "replan"        // Complex reasoning (Strategy)
  | "instructions"  // Data compilation (Sous Chef)
  | "routing"       // Fast classification (Nano)
  | "image/pantry"  // Vision
  | "image/order"   // Vision
  | "image/cookcheck";// Vision

// 2. The Model Picker (The Brain)
function pick(route: AgentRoute): { provider: "openai" | "gemini"; model: string } {
  switch (route) {
    // TIER: "GPT 5.2" - Deep Reasoning / Strategy
    case "replan":
      return { provider: "openai", model: "gpt-5.2" };

    // TIER: "GPT 5 mini" - Instructions / Data Compilation
    case "instructions":
      return { provider: "openai", model: "gpt-5-mini" };

    // TIER: "GPT 5 nano" - Routing / Simple Classification
    case "routing":
      return { provider: "openai", model: "gpt-5-nano" };

    // TIER: "Gemini 3 pro" - SOTA Vision
    case "image/pantry":
    case "image/order":
    case "image/cookcheck":
      return { provider: "gemini", model: "gemini-3-pro" };

    default: {
      const _exhaustive: never = route;
      return _exhaustive;
    }
  }
}

// 3. Execution Logic
export async function runAgent(route: AgentRoute, prompt: string) {
  const { provider, model } = pick(route);

  if (provider === "openai") {
    return await openaiText(model, [
      { role: "system", content: "You are a helpful kitchen assistant." },
      { role: "user", content: prompt },
    ]);
  }
  return await geminiText(model, prompt);
}

// 4. Vision Execution Logic
export async function runAgentWithImage(
  route: AgentRoute,
  prompt: string,
  imageBase64: string,
  mimeType: string,
  config?: any
) {
  const { provider, model } = pick(route);
  
  if (provider !== "gemini") {
    // If we ever assign OpenAI to vision, we'd handle it here
    throw new Error(`Route ${route} is not configured for Gemini vision.`);
  }

  // Passes the correct 'gemini-3-pro' model to the client
  return await geminiVision(model, prompt, imageBase64, mimeType, config);
}
