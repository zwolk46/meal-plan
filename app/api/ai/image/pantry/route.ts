import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runAgentWithImage } from "@/lib/ai/router";
import { zodToJsonSchema } from "zod-to-json-schema";


export const runtime = "nodejs";

const PantryItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().optional(),
  unit: z.string().optional(),
  location: z.enum(["fridge", "freezer", "pantry"]).optional(),
  notes: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const PantryExtractSchema = z.object({
  assistant_message: z.string(),
  items: z.array(PantryItemSchema),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const imageBase64 = body?.imageBase64;
  const mimeType = body?.mimeType;

  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: "Missing imageBase64 or mimeType" }, { status: 400 });
  }

  // Store the raw image ingest first
  const { data: ingest, error: ingestErr } = await supabase
    .from("image_ingests")
    .insert({
      user_id: user.id,
      kind: "pantry",
      mime_type: mimeType,
      image_base64: imageBase64,
      status: "new",
    })
    .select("*")
    .single();

  if (ingestErr || !ingest) {
    return NextResponse.json({ error: ingestErr?.message ?? "Failed to create image ingest" }, { status: 500 });
  }

  const prompt = `
Return ONLY valid JSON with this shape:
{
  "assistant_message": string,
  "items": [
    { "name": string, "qty"?: number, "unit"?: string, "location"?: "fridge"|"freezer"|"pantry", "notes"?: string, "confidence"?: number }
  ]
}

Goal: Extract a pantry/inventory list from the photo.
- If unsure about an item, include it with low confidence.
- Prefer common names (e.g., "chicken breast", "broccoli florets", "penne pasta").
`.trim();

  let raw = "";
  let parsed: z.infer<typeof PantryExtractSchema>;

  try {
    raw = await runAgentWithImage("image/pantry", prompt, imageBase64, mimeType);
    parsed = PantryExtractSchema.parse(JSON.parse(raw));
  } catch (e: any) {
    await supabase.from("image_ingests").update({
      status: "error",
      extracted_json: { raw },
    }).eq("id", ingest.id);

    return NextResponse.json(
      { error: "Gemini returned invalid JSON", detail: e?.message ?? String(e), raw },
      { status: 500 }
    );
  }

  await supabase.from("image_ingests").update({
    status: "parsed",
    extracted_json: parsed,
  }).eq("id", ingest.id);

  return NextResponse.json({ ok: true, ingest_id: ingest.id, ...parsed });
}
