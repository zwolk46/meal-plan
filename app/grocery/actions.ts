"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addGroceryItem(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) redirect("/login?message=Please sign in.");

  const name = String(formData.get("name") ?? "").trim();
  const qty = Number(formData.get("qty") ?? 1);
  const unit = String(formData.get("unit") ?? "count").trim() || "count";
  const category = String(formData.get("category") ?? "other").trim() || "other";

  if (!name) redirect("/grocery?message=Missing item name.");

  const { error } = await supabase.from("grocery_list_items").insert({
    user_id: user.id,
    name,
    qty,
    unit,
    category,
    checked: false,
  });

  if (error) redirect(`/grocery?message=${encodeURIComponent(error.message)}`);

  revalidatePath("/grocery");
}

export async function toggleChecked(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) redirect("/login?message=Please sign in.");

  const id = String(formData.get("id") ?? "").trim();
  const checked = String(formData.get("checked") ?? "") === "true";

  if (!id) redirect("/grocery?message=Missing item id.");

  const { error } = await supabase
    .from("grocery_list_items")
    .update({ checked })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) redirect(`/grocery?message=${encodeURIComponent(error.message)}`);

  revalidatePath("/grocery");
}
