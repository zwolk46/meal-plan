"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parseList(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function savePreferences(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) redirect("/login?message=Please sign in.");

  const disliked = parseList(String(formData.get("disliked") ?? ""));
  const nuts = parseList(String(formData.get("avoid_nuts") ?? ""));
  const proteins = parseList(String(formData.get("preferred_proteins") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim();

  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    disliked_ingredients: disliked,
    avoid_nuts: nuts,
    preferred_proteins: proteins,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  });

  if (error) redirect(`/settings?message=${encodeURIComponent(error.message)}`);

  revalidatePath("/settings");
}
