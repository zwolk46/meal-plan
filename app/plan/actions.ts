"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addPlannedMeal(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) redirect("/login?message=Please sign in.");

  const day = String(formData.get("day") ?? "").trim(); // YYYY-MM-DD
  const meal_slot = String(formData.get("meal_slot") ?? "").trim(); // breakfast/lunch/dinner
  const recipe_name = String(formData.get("recipe_name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!day || !meal_slot || !recipe_name) {
    redirect("/plan?message=Missing day, meal slot, or recipe name.");
  }

  const { error } = await supabase.from("meal_plan_days").upsert(
    {
      user_id: user.id,
      day,
      meal_slot,
      recipe_name,
      notes: notes || null,
    },
    { onConflict: "user_id,day,meal_slot" }
  );

  if (error) redirect(`/plan?message=${encodeURIComponent(error.message)}`);

  revalidatePath("/plan");
}
