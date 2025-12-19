import { GoogleGenAI } from "@google/genai";

// Initialize the client
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- 1. RESTORED FUNCTIONS (Fixes the build error) ---

export async function geminiText(model: string, prompt: string) {
  try {
    const result = await ai.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    // FIX: Access .text directly (it's a getter property now, not a function)
    return result.text || "No response generated."; 
  } catch (e) {
    console.error("Gemini Text Error:", e);
    return "Error generating text.";
  }
}

export async function geminiVision(model: string, prompt: string, imageBase64: string, mimeType: string) {
  try {
    const result = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType, data: imageBase64 } }
          ]
        }
      ]
    });
    // FIX: Access .text directly
    return result.text || "No response generated.";
  } catch (e) {
    console.error("Gemini Vision Error:", e);
    return "Error analyzing image.";
  }
}

// --- 2. NEW FUNCTION (For your Inventory Page) ---

export async function analyzeReceipt(imageBase64: string) {
  const prompt = `
    Analyze this grocery receipt. Extract all food items.
    For each item, estimate:
    - quantity_grams: Convert to grams (e.g. 1lb = 454g). If unknown, estimate typical weight.
    - category: 'Protein', 'Produce', 'Staple', or 'High-Drift'.
    - location: 'Fridge', 'Freezer', 'Pantry'.
    - expiry_date: Estimate based on typical shelf life (YYYY-MM-DD).
    
    Return ONLY a JSON array.
  `;

  // We define the schema using simple strings to avoid import errors
  const schema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        item_name: { type: "STRING" },
        quantity_grams: { type: "NUMBER" },
        category: { type: "STRING", enum: ["Protein", "Produce", "Staple", "High-Drift"] },
        location: { type: "STRING", enum: ["Fridge", "Freezer", "Pantry", "Counter"] },
        expiry_date: { type: "STRING" },
      },
      required: ["item_name", "quantity_grams", "category", "location", "expiry_date"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    // FIX: Access .text directly
    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini Vision Error:", e);
    return [];
  }
}
