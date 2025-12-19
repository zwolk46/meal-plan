import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addItem } from "./actions";
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

  // FETCH: Get items from the new "inventory_master" table
  const { data: items, error } = await supabase
    .from("inventory_master")
    .select("*")
    .eq("user_id", user.id)
    .order("expiry_date", { ascending: true, nullsFirst: false });

  // HELPER: Color code expiration dates
  const getExpiryColor = (dateStr: string | null) => {
    if (!dateStr) return "text-gray-500";
    const days = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    if (days < 0) return "text-red-600 font-bold"; // Expired
    if (days <= 3) return "text-orange-500 font-bold"; // Urgent
    return "text-green-600";
  };

  return (
    <main className="max-w-2xl mx-auto p-4 md:p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Kitchen Inventory</h1>
          <p className="text-sm text-gray-500">Managing: {user.email}</p>
        </div>
        <form action={signOut}>
          <button className="text-sm text-red-500 hover:underline">Sign out</button>
        </form>
      </div>

      {message && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-6 text-sm">
          {message}
        </div>
      )}

      {/* ADD ITEM FORM */}
      <section className="bg-white p-6 rounded-xl border shadow-sm mb-8">
        <h2 className="font-semibold mb-4">Add Item (Manual)</h2>
        <form action={addItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              name="item_name"
              placeholder="Item Name (e.g. Chicken)"
              required
              className="border p-2 rounded"
            />
            <select name="category" className="border p-2 rounded">
              <option value="Protein">Protein</option>
              <option value="Produce">Produce</option>
              <option value="Staple">Staple</option>
              <option value="High-Drift">High-Drift (Snack)</option>
            </select>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <input
              name="quantity_grams"
              type="number"
              step="0.1"
              placeholder="Weight (g)"
              required
              className="border p-2 rounded"
            />
            <select name="location" className="border p-2 rounded">
              <option value="Fridge">Fridge</option>
              <option value="Freezer">Freezer</option>
              <option value="Pantry">Pantry</option>
              <option value="Counter">Counter</option>
            </select>
            <input
              name="expiry_date"
              type="date"
              className="border p-2 rounded text-gray-500"
            />
          </div>
          <button type="submit" className="w-full bg-black text-white p-2 rounded hover:bg-gray-800">
            Add to Inventory
          </button>
        </form>
      </section>

      {/* INVENTORY LIST */}
      <section>
        <h2 className="font-semibold mb-4">Current Stock</h2>
        {error && <p className="text-red-500">Error loading inventory.</p>}
        
        <div className="space-y-2">
          {items?.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
              <div>
                <div className="font-medium">{item.item_name}</div>
                <div className="text-xs text-gray-500">
                  {item.category} • {item.location}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold">{item.quantity_grams}g</div>
                <div className={`text-xs ${getExpiryColor(item.expiry_date)}`}>
                  {item.expiry_date ? `Exp: ${item.expiry_date}` : "No Date"}
                </div>
              </div>
            </div>
          ))}
          {items?.length === 0 && (
            <p className="text-gray-400 text-center py-8">Your kitchen is empty.</p>
          )}
        </div>
      </section>
    </main>
  );
}
