import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addPlannedMeal } from "./actions";
import { signOut } from "../login/actions";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const raw = sp.message;
  const message = Array.isArray(raw) ? raw[0] : raw;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect("/login?message=Please sign in.");

  const user = userData.user;

  // show upcoming 14 days
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 14);

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const { data: rows, error } = await supabase
    .from("meal_plan_days")
    .select("*")
    .eq("user_id", user.id)
    .gte("day", startStr)
    .lt("day", endStr)
    .order("day", { ascending: true })
    .order("meal_slot", { ascending: true });

  const slotOrder: Record<string, number> = { breakfast: 1, lunch: 2, dinner: 3 };
  const sorted = (rows ?? []).slice().sort((a: any, b: any) => {
    if (a.day < b.day) return -1;
    if (a.day > b.day) return 1;
    return (slotOrder[a.meal_slot] ?? 9) - (slotOrder[b.meal_slot] ?? 9);
  });

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Meal Plan</h1>
          <p style={{ marginTop: 6, color: "#555" }}>Signed in as: {user.email}</p>
          {message ? (
            <p style={{ marginTop: 10, color: "crimson" }}>{message}</p>
          ) : null}
        </div>
        <form action={signOut}>
          <button type="submit" style={{ padding: 10, borderRadius: 8 }}>
            Sign out
          </button>
        </form>
      </div>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Add / Update a meal</h2>
        <form
          action={addPlannedMeal}
          style={{ display: "grid", gridTemplateColumns: "160px 160px 1fr", gap: 10, marginTop: 10 }}
        >
          <input
            name="day"
            type="date"
            required
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <select
            name="meal_slot"
            required
            defaultValue="dinner"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          >
            <option value="breakfast">breakfast</option>
            <option value="lunch">lunch</option>
            <option value="dinner">dinner</option>
          </select>
          <input
            name="recipe_name"
            placeholder="Recipe name (e.g., Honey-garlic chicken bowls)"
            required
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <input
            name="notes"
            placeholder="Notes (optional)"
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 8,
              gridColumn: "1 / -1",
            }}
          />
          <button type="submit" style={{ padding: 10, borderRadius: 8, gridColumn: "1 / -1" }}>
            Save meal
          </button>
        </form>
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Next 14 days</h2>

        {error ? (
          <p style={{ color: "crimson", marginTop: 10 }}>DB error: {error.message}</p>
        ) : null}

        <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Day</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Slot</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Recipe</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r: any) => (
              <tr key={r.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.day}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.meal_slot}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.recipe_name}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{r.notes ?? ""}</td>
              </tr>
            ))}
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 10, color: "#666" }}>
                  No planned meals yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
