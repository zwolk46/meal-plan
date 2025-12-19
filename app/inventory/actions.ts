"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function addItem(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login?message=You must be logged in");
  }

  const item_name = formData.get("item_name") as string;
  const category = formData.get("category") as string;
  const location = formData.get("location") as string;
  const quantity_grams = parseFloat(formData.get("quantity_grams") as string);
  const expiry_date = formData.get("expiry_date") as string || null;

  const { error } = await supabase.from("inventory_master").insert({
    user_id: user.id,
    item_name,
    category,
    location,
    quantity_grams,
    original_qty: quantity_grams, // Set initial weight as original
    expiry_date,
  });

  if (error) {
    console.error(error);
    return redirect("/inventory?message=Failed to add item");
  }

  return redirect("/inventory?message=Item added successfully");
}
