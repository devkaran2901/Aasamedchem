import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/units";

async function getStats() {
  const [productCount, activeOrders, totalOrderValue, categories] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
    prisma.order.aggregate({ _sum: { totalPaise: true } }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  return {
    productCount,
    activeOrders,
    totalOrderValue: totalOrderValue._sum.totalPaise ?? 0,
    categoryCount: categories.filter((c) => c.category).length,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { label: "Active Products", value: stats.productCount, icon: "📦", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Pending Orders", value: stats.activeOrders, icon: "📋", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Total Revenue", value: formatINR(stats.totalOrderValue), icon: "💰", color: "bg-green-50 text-green-700 border-green-200" },
    { label: "Categories", value: stats.categoryCount, icon: "🗂️", color: "bg-purple-50 text-purple-700 border-purple-200" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-5 ${card.color}`}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm mt-1 opacity-80">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <a href="/admin/products" className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
              <span>➕</span> Add New Product
            </a>
            <a href="/admin/orders" className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
              <span>📋</span> View All Orders
            </a>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-3">System Info</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Price storage</dt>
              <dd className="text-gray-800 font-medium">Paise (integer)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Weight base unit</dt>
              <dd className="text-gray-800 font-medium">Grams (g)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Volume base unit</dt>
              <dd className="text-gray-800 font-medium">Milliliters (mL)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Quantity precision</dt>
              <dd className="text-gray-800 font-medium">DECIMAL(20,6)</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
