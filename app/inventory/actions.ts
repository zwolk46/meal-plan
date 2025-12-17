"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addItem(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) redirect("/login?message=Please sign in.");

  const name = String(formData.get("name") ?? "").trim();
  const qty = Number(formData.get("qty") ?? 1);
  const unit = String(formData.get("unit") ?? "count").trim() || "count";

  const { error } = await supabase.from("inventory_items").insert({
    user_id: user.id,
    name,
    qty,
    unit,
    location: "pantry",
  });

  if (error) redirect(`/inventory?message=${encodeURIComponent(error.message)}`);

  revalidatePath("/inventory");
}
