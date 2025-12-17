"use client";

import { useState } from "react";

export default function ReplanPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/replan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Request failed");
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Replan (Agent)</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder='e.g., "Plan chicken fried rice tomorrow dinner and add broccoli to groceries"'
        style={{ width: "100%", height: 110, marginTop: 14, padding: 10, borderRadius: 8 }}
      />
      <button
        onClick={run}
        disabled={loading || !prompt.trim()}
        style={{ marginTop: 10, padding: 10, borderRadius: 8 }}
      >
        {loading ? "Running..." : "Run replan"}
      </button>

      {error ? <p style={{ color: "crimson", marginTop: 12 }}>Error: {error}</p> : null}

      {result ? (
        <pre style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}
