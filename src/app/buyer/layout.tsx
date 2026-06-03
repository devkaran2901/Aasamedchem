import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";

const buyerLinks = [
  { href: "/buyer/browse", label: "Browse Products" },
  { href: "/buyer/orders", label: "My Orders" },
  { href: "/buyer/cart", label: "Shopping Cart" },
];

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "BUYER") redirect("/auth/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={buyerLinks} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
