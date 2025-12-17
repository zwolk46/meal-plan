import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { savePreferences } from "./actions";

export default async function SettingsPage({
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

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const join = (arr: string[] | null | undefined) => (arr?.length ? arr.join(", ") : "");

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Settings</h1>
      {message ? <p style={{ marginTop: 10, color: "crimson" }}>{message}</p> : null}

      <form action={savePreferences} style={{ marginTop: 16, display: "grid", gap: 10 }}>
        <label>
          Disliked ingredients (comma-separated)
          <input
            name="disliked"
            defaultValue={join(prefs?.disliked_ingredients)}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label>
          Avoid nuts (comma-separated)
          <input
            name="avoid_nuts"
            defaultValue={join(prefs?.avoid_nuts)}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label>
          Preferred proteins (comma-separated)
          <input
            name="preferred_proteins"
            defaultValue={join(prefs?.preferred_proteins)}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label>
          Notes
          <textarea
            name="notes"
            defaultValue={prefs?.notes ?? ""}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, height: 100 }}
          />
        </label>

        <button type="submit" style={{ padding: 10, borderRadius: 8 }}>
          Save
        </button>
      </form>
    </main>
  );
}
