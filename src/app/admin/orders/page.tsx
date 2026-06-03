"use client";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/units";

interface OrderItem {
  id: string;
  orderedUnit: string;
  orderedQty: string;
  qtyInBaseUnit: string;
  unitPricePaise: number;
  lineTotalPaise: number;
  product: { name: string; sku: string; baseUnit: string };
}

interface Order {
  id: string;
  status: string;
  totalPaise: number;
  notes?: string;
  createdAt: string;
  user: { name: string; email: string };
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  FULFILLED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadOrders() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => { loadOrders(); }, []);

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    loadOrders();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders & Quotations</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No orders yet</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Order header */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-gray-400">#{order.id.slice(-8).toUpperCase()}</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{order.user.name}</p>
                    <p className="text-xs text-gray-500">{order.user.email}</p>
                  </div>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status] || ""}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">{formatINR(order.totalPaise)}</span>
                  <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === order.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === order.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-100">
                          <th className="pb-2 text-left">Product</th>
                          <th className="pb-2 text-left">SKU</th>
                          <th className="pb-2 text-right">Ordered</th>
                          <th className="pb-2 text-right">Base Qty</th>
                          <th className="pb-2 text-right">Unit Price</th>
                          <th className="pb-2 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {order.items.map((item) => (
                          <tr key={item.id} className="text-gray-700">
                            <td className="py-2 font-medium">{item.product.name}</td>
                            <td className="py-2 font-mono text-gray-400">{item.product.sku}</td>
                            <td className="py-2 text-right">
                              {parseFloat(item.orderedQty).toLocaleString("en-IN")} {item.orderedUnit}
                            </td>
                            <td className="py-2 text-right text-gray-500">
                              {parseFloat(item.qtyInBaseUnit).toLocaleString("en-IN")} {item.product.baseUnit === "GRAM" ? "g" : item.product.baseUnit === "MILLILITER" ? "mL" : "unit"}
                            </td>
                            <td className="py-2 text-right">{formatINR(item.unitPricePaise)}/{item.orderedUnit}</td>
                            <td className="py-2 text-right font-semibold">{formatINR(item.lineTotalPaise)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-200">
                          <td colSpan={5} className="pt-2 text-right font-semibold text-gray-700">Total</td>
                          <td className="pt-2 text-right font-bold text-gray-900">{formatINR(order.totalPaise)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {order.notes && (
                    <p className="text-xs text-gray-500 mb-4">Notes: {order.notes}</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 self-center">Update status:</span>
                    {["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"].map((s) => (
                      <button
                        key={s}
                        disabled={order.status === s || updating === order.id}
                        onClick={() => updateStatus(order.id, s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors disabled:opacity-40 ${order.status === s ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
