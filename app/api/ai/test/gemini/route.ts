import { NextResponse } from "next/server";
import { runAgent } from "@/lib/ai/router";

export const runtime = "nodejs";

export async function GET() {
  const out = await runAgent("image/pantry", "Reply with exactly: OK_GEMINI");
  return NextResponse.json({ ok: true, out });
}
