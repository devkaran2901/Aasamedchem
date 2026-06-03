"use client";
import { useEffect, useState, useCallback } from "react";
import {
  formatINR,
  VALID_UNITS_FOR_BASE,
  pricePerDisplayUnit,
  calculateLineTotalPaise,
  fromBaseUnits,
} from "@/lib/units";
import type { DisplayUnit, BaseUnit } from "@/lib/units";

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  baseUnit: BaseUnit;
  pricePerBaseUnit: number;
  stockInBaseUnit: string;
}

interface CartItem {
  product: Product;
  unit: DisplayUnit;
  qty: number;
}

export default function BrowsePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  async function loadProducts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data);
    const cats = Array.from(new Set(data.map((p: Product) => p.category).filter(Boolean))) as string[];
    setCategories(cats);
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, [search, category]);

  function defaultUnit(p: Product): DisplayUnit {
    return VALID_UNITS_FOR_BASE[p.baseUnit][0];
  }

  function addToCart(product: Product) {
    const existing = cart.find((c) => c.product.id === product.id);
    if (existing) return;
    setCart([...cart, { product, unit: defaultUnit(product), qty: 1 }]);
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((c) => c.product.id !== productId));
  }

  function updateCartItem(productId: string, field: "unit" | "qty", value: any) {
    setCart(cart.map((c) => c.product.id === productId ? { ...c, [field]: value } : c));
  }

  const cartTotal = cart.reduce((sum, item) => {
    return sum + calculateLineTotalPaise(item.qty, item.unit, item.product.pricePerBaseUnit);
  }, 0);

  async function placeOrder() {
    if (cart.length === 0) return;
    setPlacing(true);
    const items = cart.map((c) => ({
      productId: c.product.id,
      orderedUnit: c.unit,
      orderedQty: c.qty,
    }));
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, notes }),
    });
    if (res.ok) {
      setCart([]);
      setNotes("");
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 4000);
    }
    setPlacing(false);
  }

  function stockDisplay(p: Product) {
    const stock = parseFloat(p.stockInBaseUnit);
    const units = VALID_UNITS_FOR_BASE[p.baseUnit];
    // Show in largest unit
    const largestUnit = units[units.length - 1];
    const displayStock = fromBaseUnits(stock, largestUnit);
    return `${displayStock.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${largestUnit}`;
  }

  return (
    <div className="flex gap-6">
      {/* Products section */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Browse Products</h1>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No products found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const inCart = cart.some((c) => c.product.id === p.id);
              const validUnits = VALID_UNITS_FOR_BASE[p.baseUnit];
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">{p.name}</h3>
                      <span className="text-xs text-gray-400 font-mono shrink-0">{p.sku}</span>
                    </div>
                    {p.category && (
                      <span className="inline-block mt-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{p.category}</span>
                    )}
                    {p.description && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{p.description}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2.5 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Available units:</span>
                      <span className="text-gray-700 font-medium">{validUnits.join(", ")}</span>
                    </div>
                    {validUnits.map((unit) => (
                      <div key={unit} className="flex justify-between">
                        <span className="text-gray-500">Price per {unit}:</span>
                        <span className="text-gray-800 font-semibold">{formatINR(pricePerDisplayUnit(unit, p.pricePerBaseUnit))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                      <span className="text-gray-500">Stock:</span>
                      <span className="text-gray-700">{stockDisplay(p)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(p)}
                    disabled={inCart}
                    className={`w-full py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      inCart
                        ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {inCart ? "✓ In Cart" : "Add to Cart"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart sidebar */}
      <div className="w-80 shrink-0">
        <div className="sticky top-20">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
              <span>Cart</span>
              <span className="text-xs text-gray-400">{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
            </h2>

            {orderSuccess && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs text-center">
                ✅ Order placed successfully!
              </div>
            )}

            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {cart.map((item) => {
                    const validUnits = VALID_UNITS_FOR_BASE[item.product.baseUnit];
                    const lineTotal = calculateLineTotalPaise(item.qty, item.unit, item.product.pricePerBaseUnit);
                    return (
                      <div key={item.product.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-medium text-gray-800 leading-tight pr-2">{item.product.name}</span>
                          <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            min="0.000001"
                            step="0.001"
                            value={item.qty}
                            onChange={(e) => updateCartItem(item.product.id, "qty", parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                          <select
                            value={item.unit}
                            onChange={(e) => updateCartItem(item.product.id, "unit", e.target.value as DisplayUnit)}
                            className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          >
                            {validUnits.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div className="mt-1.5 text-right">
                          <span className="text-xs text-gray-500">{formatINR(pricePerDisplayUnit(item.unit, item.product.pricePerBaseUnit))}/{item.unit} → </span>
                          <span className="text-xs font-semibold text-gray-800">{formatINR(lineTotal)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-gray-200 pt-3 mb-3">
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total</span>
                    <span className="text-indigo-700">{formatINR(cartTotal)}</span>
                  </div>
                </div>

                <textarea
                  placeholder="Order notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 mb-3 resize-none"
                />

                <button
                  onClick={placeOrder}
                  disabled={placing || cartTotal === 0}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {placing ? "Placing..." : "Place Order"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
