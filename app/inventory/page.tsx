"use client"; // We need this to handle the file upload interaction

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // Use client-side supabase for this interactive component
import { addItem } from "./actions"; // We still use the server action for manual adds

// Define the shape of our inventory items
type InventoryItem = {
  id: string;
  item_name: string;
  quantity_grams: number;
  category: string;
  location: string;
  expiry_date: string | null;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[]>([]);

  const supabase = createClient();

  // Load initial data
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("inventory_master")
      .select("*")
      .eq("user_id", user.id)
      .order("expiry_date", { ascending: true, nullsFirst: false });
    
    if (data) setItems(data);
    setLoading(false);
  };

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    
    // Convert to Base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      // Send to our new API
      const res = await fetch("/api/ai/analyze-receipt", {
        method: "POST",
        body: JSON.stringify({ image: base64String }),
      });
      
      const data = await res.json();
      setScannedItems(data.items || []);
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  // Save a scanned item to the DB
  const saveScannedItem = async (index: number) => {
    const item = scannedItems[index];
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase.from("inventory_master").insert({
      user_id: user.id,
      item_name: item.item_name,
      quantity_grams: item.quantity_grams,
      original_qty: item.quantity_grams,
      category: item.category,
      location: item.location,
      expiry_date: item.expiry_date
    });

    // Remove from the preview list and refresh main list
    const newScanned = [...scannedItems];
    newScanned.splice(index, 1);
    setScannedItems(newScanned);
    fetchInventory();
  };

  return (
    <main className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Kitchen Inventory</h1>
      </div>

      {/* --- AI VISION SECTION --- */}
      <section className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm mb-8">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          📸 Smart Ingestion
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Upload a receipt or photo of your fridge. Gemini will extract items.
        </p>
        
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileUpload}
          disabled={analyzing}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-600 file:text-white
            hover:file:bg-blue-700"
        />

        {analyzing && <p className="mt-4 text-blue-600 animate-pulse">Analyzing image with Gemini...</p>}

        {/* PREVIEW SCANNED ITEMS */}
        {scannedItems.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg border">
            <h3 className="font-bold text-sm mb-3">Found {scannedItems.length} items:</h3>
            <div className="space-y-2">
              {scannedItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <span>{item.item_name} ({item.quantity_grams}g)</span>
                  <button 
                    onClick={() => saveScannedItem(idx)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                  >
                    Confirm & Save
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* --- MANUAL LIST --- */}
      <section>
        <h2 className="font-semibold mb-4">Current Stock</h2>
        {loading ? <p>Loading...</p> : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                <div>
                  <div className="font-medium">{item.item_name}</div>
                  <div className="text-xs text-gray-500">
                    {item.category} • {item.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">{item.quantity_grams}g</div>
                  <div className="text-xs text-gray-500">
                    {item.expiry_date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
