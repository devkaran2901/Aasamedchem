"use client";
import { useEffect, useState } from "react";
import { formatINR, VALID_UNITS_FOR_BASE, baseUnitLabel } from "@/lib/units";
import type { BaseUnit } from "@/lib/units";

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  baseUnit: BaseUnit;
  pricePerBaseUnit: number;
  stockInBaseUnit: string;
  isActive: boolean;
}

const emptyForm = {
  name: "",
  sku: "",
  description: "",
  category: "",
  baseUnit: "GRAM" as BaseUnit,
  pricePerBaseUnit: "",
  stockInBaseUnit: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  async function loadProducts() {
    const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, [search]);

  function openCreate() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      sku: p.sku,
      description: p.description || "",
      category: p.category || "",
      baseUnit: p.baseUnit,
      pricePerBaseUnit: p.pricePerBaseUnit.toString(),
      stockInBaseUnit: p.stockInBaseUnit,
    });
    setEditId(p.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      pricePerBaseUnit: parseInt(form.pricePerBaseUnit),
    };

    const url = editId ? `/api/products/${editId}` : "/api/products";
    const method = editId ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    setShowForm(false);
    loadProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadProducts();
  }

  // Price display: paise per base unit → INR per base unit label
  function priceLabel(p: Product) {
    const inr = p.pricePerBaseUnit / 100;
    return `₹${inr.toFixed(2)}/${baseUnitLabel(p.baseUnit)}`;
  }

  function stockLabel(p: Product) {
    return `${parseFloat(p.stockInBaseUnit).toLocaleString("en-IN")} ${baseUnitLabel(p.baseUnit)}`;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Add Product
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Product table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Name", "SKU", "Category", "Base Unit", "Price", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No products found</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{p.category || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      {p.baseUnit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{priceLabel(p)}</td>
                  <td className="px-4 py-3 text-gray-700">{stockLabel(p)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">{editId ? "Edit Product" : "New Product"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU *</label>
                    <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Base Unit *</label>
                    <select value={form.baseUnit} onChange={(e) => setForm({ ...form, baseUnit: e.target.value as BaseUnit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="GRAM">GRAM (weight)</option>
                      <option value="MILLILITER">MILLILITER (volume)</option>
                      <option value="UNIT">UNIT (count)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Price per {baseUnitLabel(form.baseUnit)} (paise) *
                    </label>
                    <input required type="number" min="1" value={form.pricePerBaseUnit}
                      onChange={(e) => setForm({ ...form, pricePerBaseUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. 200 = ₹2.00" />
                    {form.pricePerBaseUnit && (
                      <p className="text-xs text-gray-500 mt-1">= {formatINR(parseInt(form.pricePerBaseUnit) || 0)}/{baseUnitLabel(form.baseUnit)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Stock in {baseUnitLabel(form.baseUnit)} *
                    </label>
                    <input required type="number" step="0.000001" min="0" value={form.stockInBaseUnit}
                      onChange={(e) => setForm({ ...form, stockInBaseUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg">
                    {saving ? "Saving..." : editId ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
