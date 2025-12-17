import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const raw = sp.message;
  const message = Array.isArray(raw) ? raw[0] : raw;

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Meal Planner — Login</h1>

      {message ? (
        <p style={{ marginTop: 12, color: "crimson" }}>{message}</p>
      ) : null}

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Sign in</h2>
        <form action={signIn} style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <button type="submit" style={{ padding: 10, borderRadius: 8 }}>
            Sign in
          </button>
        </form>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Sign up</h2>
        <form action={signUp} style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min 6 chars)"
            required
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <button type="submit" style={{ padding: 10, borderRadius: 8 }}>
            Create account
          </button>
        </form>
      </section>
    </main>
  );
}
