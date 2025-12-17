import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addItem } from "./actions.ts";
import { signOut } from "../login/actions";

export default async function InventoryPage({
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
    .from("inventory_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Inventory</h1>
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
        <form action={addItem} style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            name="name"
            placeholder="e.g., chicken breast"
            required
            style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <input
            name="qty"
            type="number"
            step="0.01"
            placeholder="qty"
            defaultValue="1"
            style={{ width: 110, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <input
            name="unit"
            placeholder="unit"
            defaultValue="count"
            style={{ width: 110, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <button type="submit" style={{ padding: 10, borderRadius: 8 }}>
            Add
          </button>
        </form>
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Items</h2>

        {error ? (
          <p style={{ color: "crimson", marginTop: 10 }}>
            DB error: {error.message}
          </p>
        ) : null}

        <ul style={{ marginTop: 10, paddingLeft: 18 }}>
          {(items ?? []).map((it) => (
            <li key={it.id} style={{ marginBottom: 8 }}>
              <strong>{it.name}</strong> — {it.qty} {it.unit} ({it.location})
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
