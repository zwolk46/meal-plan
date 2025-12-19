import { GoogleGenAI, SchemaType } from "@google/genai";

// Initialize the client with your API key
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// A specialized function for analyzing receipts
export async function analyzeReceipt(imageBase64: string) {
  const prompt = `
    Analyze this grocery receipt. Extract all food items.
    For each item, estimate:
    - quantity_grams: Convert to grams (e.g. 1lb = 454g). If unknown, estimate typical weight (e.g. 1 onion = 150g).
    - category: 'Protein', 'Produce', 'Staple', or 'High-Drift'.
    - location: 'Fridge', 'Freezer', 'Pantry'.
    - expiry_date: Estimate based on typical shelf life (YYYY-MM-DD).
    
    Return ONLY a JSON array.
  `;

  // Define the strict structure we want back (no more parsing errors!)
  const schema = {
    type: SchemaType.ARRAY,
    items: {
      type: SchemaType.OBJECT,
      properties: {
        item_name: { type: SchemaType.STRING },
        quantity_grams: { type: SchemaType.NUMBER },
        category: { type: SchemaType.STRING, enum: ["Protein", "Produce", "Staple", "High-Drift"] },
        location: { type: SchemaType.STRING, enum: ["Fridge", "Freezer", "Pantry", "Counter"] },
        expiry_date: { type: SchemaType.STRING },
      },
      required: ["item_name", "quantity_grams", "category", "location", "expiry_date"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Fast and good at vision
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

    // Handle potential null response safely
    const text = response.text();
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini Vision Error:", e);
    return [];
  }
}
