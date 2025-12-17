import { NextResponse } from "next/server";
import { runAgent } from "@/lib/ai/router";

export const runtime = "nodejs";

export async function GET() {
  const out = await runAgent("instructions", "Reply with exactly: OK_OPENAI");
  return NextResponse.json({ ok: true, out });
}
