import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runAgent } from "@/lib/ai/router";

export const runtime = "nodejs";

const ActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("plan_meal"),
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    meal_slot: z.enum(["breakfast", "lunch", "dinner"]),
    recipe_name: z.string().min(1),
    notes: z.string().optional(),
  }),
  z.object({
    type: z.literal("add_grocery"),
    name: z.string().min(1),
    qty: z.number().optional(),
    unit: z.string().optional(),
    category: z.string().optional(),
  }),
]);

const AgentOutSchema = z.object({
  assistant_message: z.string(),
  actions: z.array(ActionSchema),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const prompt = body?.prompt;
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  // Load context
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: inventory } = await supabase
    .from("inventory_items")
    .select("name,qty,unit,location")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: plan } = await supabase
    .from("meal_plan_days")
    .select("day,meal_slot,recipe_name,notes")
    .eq("user_id", user.id)
    .order("day", { ascending: true })
    .limit(100);

  const { data: groceries } = await supabase
    .from("grocery_list_items")
    .select("name,qty,unit,category,checked")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const today = new Date().toISOString().slice(0, 10);

  const systemPrompt = `
Return ONLY valid JSON:
{
  "assistant_message": string,
  "actions": [
    {"type":"plan_meal","day":"YYYY-MM-DD","meal_slot":"breakfast"|"lunch"|"dinner","recipe_name":string,"notes"?:string}
    | {"type":"add_grocery","name":string,"qty"?:number,"unit"?:string,"category"?:string}
  ]
}

Rules:
- If user says "tomorrow", infer from Today.
- Use Preferences to avoid dislikes.
- Keep actions minimal and practical.
- If unclear, return zero actions and ask a clarifying question in assistant_message.
`;

  const fullPrompt = `
Today: ${today}

User prompt:
${prompt}

Preferences:
${JSON.stringify(prefs ?? {}, null, 2)}

Inventory (up to 100):
${JSON.stringify(inventory ?? [], null, 2)}

Existing meal plan (up to 100):
${JSON.stringify(plan ?? [], null, 2)}

Existing grocery list (up to 100):
${JSON.stringify(groceries ?? [], null, 2)}
`;

  let modelText = "";
  let parsed: z.infer<typeof AgentOutSchema> | null = null;

  try {
    modelText = await runAgent("replan", `${systemPrompt}\n\n${fullPrompt}`);
    parsed = AgentOutSchema.parse(JSON.parse(modelText));
  } catch (e: any) {
    // Log failure
    await supabase.from("agent_runs").insert({
      user_id: user.id,
      route: "replan",
      prompt,
      status: "error",
      error_text: e?.message ?? String(e),
      response_json: { raw: modelText },
    });

    return NextResponse.json(
      { error: "Agent failed or returned invalid JSON", detail: e?.message ?? String(e), raw: modelText },
      { status: 500 }
    );
  }

  // Apply actions
  for (const action of parsed.actions) {
    if (action.type === "plan_meal") {
      const { error } = await supabase.from("meal_plan_days").upsert(
        {
          user_id: user.id,
          day: action.day,
          meal_slot: action.meal_slot,
          recipe_name: action.recipe_name,
          notes: action.notes ?? null,
        },
        { onConflict: "user_id,day,meal_slot" }
      );
      if (error) return NextResponse.json({ error: error.message, failed_action: action }, { status: 500 });
    }

    if (action.type === "add_grocery") {
      const { error } = await supabase.from("grocery_list_items").insert({
        user_id: user.id,
        name: action.name,
        qty: typeof action.qty === "number" ? action.qty : 1,
        unit: action.unit ?? "count",
        category: action.category ?? "other",
        checked: false,
      });
      if (error) return NextResponse.json({ error: error.message, failed_action: action }, { status: 500 });
    }
  }

  // Log success
  await supabase.from("agent_runs").insert({
    user_id: user.id,
    route: "replan",
    prompt,
    status: "ok",
    response_json: parsed,
  });

  return NextResponse.json({ ok: true, ...parsed });
}
