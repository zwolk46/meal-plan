import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addGroceryItem, toggleChecked } from "./actions";
import { signOut } from "../login/actions";

export default async function GroceryPage({
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

  const { data: items, error } = await supabase
    .from("grocery_list_items")
    .select("*")
    .eq("user_id", user.id)
    .order("checked", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Grocery List</h1>
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
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Add item</h2>
        <form
          action={addGroceryItem}
          style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 160px", gap: 10, marginTop: 10 }}
        >
          <input
            name="name"
            placeholder="e.g., broccoli florets"
            required
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <input
            name="qty"
            type="number"
            step="0.01"
            defaultValue="1"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <input
            name="unit"
            defaultValue="count"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <input
            name="category"
            defaultValue="other"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <button type="submit" style={{ padding: 10, borderRadius: 8, gridColumn: "1 / -1" }}>
            Add to list
          </button>
        </form>
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Items</h2>

        {error ? (
          <p style={{ color: "crimson", marginTop: 10 }}>DB error: {error.message}</p>
        ) : null}

        <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Done</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Item</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Qty</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Category</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((it: any) => (
              <tr key={it.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <form action={toggleChecked}>
                    <input type="hidden" name="id" value={it.id} />
                    <input type="hidden" name="checked" value={String(!it.checked)} />
                    <button type="submit" style={{ padding: 6, borderRadius: 8 }}>
                      {it.checked ? "✓" : "○"}
                    </button>
                  </form>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <span style={{ textDecoration: it.checked ? "line-through" : "none" }}>
                    {it.name}
                  </span>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  {it.qty} {it.unit}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{it.category}</td>
              </tr>
            ))}
            {(items ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 10, color: "#666" }}>
                  No grocery items yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
