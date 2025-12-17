import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? null;

  return NextResponse.json({
    supabaseUrl: url,
    publishableKeyPresent: Boolean(key),
    publishableKeyLength: key ? key.length : 0,
  });
}
