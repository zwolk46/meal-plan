"use client";

import { useState } from "react";

type ExtractItem = {
  name: string;
  qty?: number;
  unit?: string;
  location?: "fridge" | "freezer" | "pantry";
  notes?: string;
  confidence?: number;
};

export default function PantryImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [items, setItems] = useState<ExtractItem[]>([]);
  const [ingestId, setIngestId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  async function fileToBase64(f: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        // result is like: data:image/png;base64,XXXX
        const comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(f);
    });
  }

  async function runParse() {
    if (!file) return;
    setLoading(true);
    setError("");
    setItems([]);
    setMessage("");
    setIngestId(null);

    try {
      const imageBase64 = await fileToBase64(file);
      const res = await fetch("/api/ai/image/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Parse failed");
      setMessage(data.assistant_message ?? "");
      setItems(data.items ?? []);
      setIngestId(data.ingest_id ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Pantry Photo → Inventory Draft</h1>

      <div style={{ marginTop: 14 }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          onClick={runParse}
          disabled={!file || loading}
          style={{ marginLeft: 10, padding: 10, borderRadius: 8 }}
        >
          {loading ? "Parsing..." : "Parse photo"}
        </button>
      </div>

      {error ? <p style={{ color: "crimson", marginTop: 12 }}>Error: {error}</p> : null}
      {ingestId ? <p style={{ marginTop: 12 }}>Ingest ID: {ingestId}</p> : null}
      {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}

      {items.length ? (
        <pre style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          {JSON.stringify(items, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}
