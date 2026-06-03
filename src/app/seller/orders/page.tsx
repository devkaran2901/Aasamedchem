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
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  FULFILLED: "bg-green-50 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => { setOrders(d); setLoading(false); });
  }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-2">No orders yet.</p>
          <a href="/seller/browse" className="text-indigo-600 hover:underline text-sm">Browse products →</a>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-gray-400">#{order.id.slice(-8).toUpperCase()}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="text-xs text-gray-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">{formatINR(order.totalPaise)}</span>
                  <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === order.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expanded === order.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <table className="w-full text-xs mb-3">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100">
                        <th className="pb-2 text-left">Product</th>
                        <th className="pb-2 text-right">Qty</th>
                        <th className="pb-2 text-right">Unit Price</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2">
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-gray-400 font-mono">{item.product.sku}</p>
                          </td>
                          <td className="py-2 text-right">{parseFloat(item.orderedQty)} {item.orderedUnit}</td>
                          <td className="py-2 text-right">{formatINR(item.unitPricePaise)}/{item.orderedUnit}</td>
                          <td className="py-2 text-right font-semibold">{formatINR(item.lineTotalPaise)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200">
                        <td colSpan={3} className="pt-2 text-right font-semibold text-gray-700">Total</td>
                        <td className="pt-2 text-right font-bold text-gray-900">{formatINR(order.totalPaise)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  {order.notes && <p className="text-xs text-gray-500">Notes: {order.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
