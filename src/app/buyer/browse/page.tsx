"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  baseUnit: string;
  pricePerBaseUnit: number;
  stockInBaseUnit: string;
}

interface CartItem {
  productId: string;
  productName: string;
  unit: string;
  qty: number;
  unitPrice: number;
}

export default function BuyerBrowsePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [selectedUnits, setSelectedUnits] = useState<{ [key: string]: string }>({});
  const [cartSuccess, setCartSuccess] = useState(false);

  const unitOptions: { [key: string]: string[] } = {
    GRAM: ["g", "kg"],
    MILLILITER: ["mL", "L"],
    UNIT: ["unit", "dozen"],
  };

  async function loadProducts() {
    setLoading(true);
    const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`);
    const data = await res.json();
    setProducts(data);

    // Extract unique categories
    const categoriesList = data.map((p: Product) => p.category).filter(Boolean) as string[];
    const uniqueCategories = categoriesList.filter((val, idx, self) => self.indexOf(val) === idx);
    setCategories(uniqueCategories);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, [search, category]);

  function getUnitOptions(baseUnit: string): string[] {
    return unitOptions[baseUnit] || ["unit"];
  }

  function addToCart(product: Product) {
    const quantity = quantities[product.id] || 1;
    const unit = selectedUnits[product.id] || getUnitOptions(product.baseUnit)[0];

    if (quantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id && item.unit === unit);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && item.unit === unit
            ? { ...item, qty: item.qty + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unit,
          qty: quantity,
          unitPrice: product.pricePerBaseUnit,
        },
      ];
    });

    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
    setCartSuccess(true);
    setTimeout(() => setCartSuccess(false), 3000);
  }

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  useEffect(() => {
    saveCart();
  }, [cart]);

  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Products</h1>
            <p className="text-gray-600 mt-1">Discover chemicals from verified sellers</p>
          </div>
          <Link
            href="/buyer/cart"
            className="relative px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            View Cart
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Success Message */}
      {cartSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✓ Item added to cart successfully!
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 mt-2">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-600">No products found. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
              {/* Product Info */}
              <div className="p-6 flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{product.description}</p>

                {product.category && (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-4">
                    {product.category}
                  </span>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SKU:</span>
                    <span className="font-medium text-gray-900">{product.sku}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Unit:</span>
                    <span className="font-medium text-gray-900">{product.baseUnit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-bold text-indigo-600">₹{(product.pricePerBaseUnit / 100).toFixed(2)}/{product.baseUnit === "GRAM" ? "g" : product.baseUnit === "MILLILITER" ? "mL" : "unit"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className={`font-medium ${parseFloat(product.stockInBaseUnit) > 0 ? "text-green-600" : "text-red-600"}`}>
                      {parseFloat(product.stockInBaseUnit).toFixed(2)} {product.baseUnit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Add to Cart Section */}
              <div className="px-6 pb-6 border-t pt-4">
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="Qty"
                    value={quantities[product.id] || ""}
                    onChange={(e) => setQuantities((prev) => ({ ...prev, [product.id]: parseFloat(e.target.value) || 0 }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={selectedUnits[product.id] || getUnitOptions(product.baseUnit)[0]}
                    onChange={(e) => setSelectedUnits((prev) => ({ ...prev, [product.id]: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {getUnitOptions(product.baseUnit).map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  disabled={parseFloat(product.stockInBaseUnit) === 0}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {parseFloat(product.stockInBaseUnit) === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
