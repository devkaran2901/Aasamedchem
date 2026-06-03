import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";

const sellerLinks = [
  { href: "/seller/browse", label: "Browse Products" },
  { href: "/seller/orders", label: "My Orders" },
];

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={sellerLinks} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
