import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getStats() {
  const [buyers, sellers, products, orders, totalRevenue] = await Promise.all([
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalPaise: true } }),
  ]);

  // Get top sellers by product count
  const topSellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    select: {
      id: true,
      name: true,
      email: true,
      products: {
        where: { isActive: true },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
    take: 5,
  });

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, role: true } },
    },
  });

  return {
    buyers,
    sellers,
    products,
    orders,
    totalRevenue: totalRevenue._sum.totalPaise ?? 0,
    topSellers,
    recentOrders,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { label: "Total Buyers", value: stats.buyers, icon: "👥", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Total Sellers", value: stats.sellers, icon: "🏪", color: "bg-green-50 text-green-700 border-green-200" },
    { label: "Active Products", value: stats.products, icon: "📦", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { label: "Total Orders", value: stats.orders, icon: "📋", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Revenue", value: `₹${(stats.totalRevenue / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: "💰", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of the entire platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl border-2 p-6 ${card.color}`}>
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm mt-2 opacity-70">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Sellers Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-b">
            <h2 className="text-xl font-bold text-gray-900">Top Sellers</h2>
            <p className="text-sm text-gray-600">Merchants with most products</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Products</th>
                </tr>
              </thead>
              <tbody divide-y>
                {stats.topSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{seller.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{seller.email}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{seller.products.length}</td>
                  </tr>
                ))}
                {stats.topSellers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No sellers yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100 border-b">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <p className="text-sm text-gray-600">Latest activity on the platform</p>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">{order.user.name} ({order.user.role})</p>
                  </div>
                  <span className="text-sm font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700">{order.status}</span>
                </div>
                <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                <p className="text-lg font-bold text-indigo-600 mt-1">₹{(order.totalPaise / 100).toFixed(2)}</p>
              </div>
            ))}
            {stats.recentOrders.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">No orders yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Management Links */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Management</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/users" className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg hover:border-indigo-400 transition-colors text-center">
            <div className="text-2xl mb-2">👥</div>
            <p className="font-semibold text-indigo-700">Users</p>
            <p className="text-sm text-indigo-600">{stats.buyers + stats.sellers}</p>
          </Link>
          <Link href="/admin/products" className="p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:border-green-400 transition-colors text-center">
            <div className="text-2xl mb-2">📦</div>
            <p className="font-semibold text-green-700">Products</p>
            <p className="text-sm text-green-600">{stats.products}</p>
          </Link>
          <Link href="/admin/orders" className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg hover:border-amber-400 transition-colors text-center">
            <div className="text-2xl mb-2">📋</div>
            <p className="font-semibold text-amber-700">Orders</p>
            <p className="text-sm text-amber-600">{stats.orders}</p>
          </Link>
          <Link href="/admin" className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:border-purple-400 transition-colors text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="font-semibold text-purple-700">Reports</p>
            <p className="text-sm text-purple-600">Analytics</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
