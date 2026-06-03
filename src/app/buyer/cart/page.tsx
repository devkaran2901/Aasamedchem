"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CartItem {
  productId: string;
  productName: string;
  unit: string;
  qty: number;
  unitPrice: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  function removeItem(productId: string, unit: string) {
    setCart((prev) => prev.filter((item) => !(item.productId === productId && item.unit === unit)));
  }

  function updateQuantity(productId: string, unit: string, qty: number) {
    if (qty <= 0) {
      removeItem(productId, unit);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId && item.unit === unit ? { ...item, qty } : item
      )
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty) / 100, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  async function placeOrder() {
    if (cart.length === 0) return;

    setPlacing(true);
    const items = cart.map((c) => ({
      productId: c.productId,
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
      localStorage.removeItem("cart");
      setNotes("");
      setOrderSuccess(true);
      setTimeout(() => {
        router.push("/buyer/orders");
      }, 2000);
    }
    setPlacing(false);
  }

  if (orderSuccess) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-6">Your order has been submitted successfully.</p>
          <p className="text-sm text-gray-500">Redirecting to orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some products to get started</p>
          <Link
            href="/buyer/browse"
            className="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={`${item.productId}-${item.unit}`} className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.productName}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    ₹{(item.unitPrice / 100).toFixed(2)} per {item.unit}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.unit, item.qty - 0.1)}
                      className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={item.qty}
                      onChange={(e) => updateQuantity(item.productId, item.unit, parseFloat(e.target.value))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                    />
                    <button
                      onClick={() => updateQuantity(item.productId, item.unit, item.qty + 0.1)}
                      className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                    >
                      +
                    </button>
                    <span className="ml-4 text-sm text-gray-600">{item.unit}</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-indigo-600">
                    ₹{((item.unitPrice * item.qty) / 100).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId, item.unit)}
                    className="text-sm text-red-600 hover:text-red-700 mt-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax (10%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-indigo-600">₹{total.toFixed(2)}</span>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any special requests..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                />
              </div>

              <button
                onClick={placeOrder}
                disabled={placing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition-colors"
              >
                {placing ? "Placing Order..." : "Place Order"}
              </button>

              <Link
                href="/buyer/browse"
                className="block text-center text-indigo-600 hover:text-indigo-700 font-medium mt-4 py-2 border border-indigo-600 rounded-lg transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
