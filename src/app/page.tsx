import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPage from "@/app/landing";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) return <LandingPage />;

  const role = (session.user as any).role;
  if (role === "ADMIN") redirect("/admin");
  if (role === "BUYER") redirect("/buyer/browse");
  redirect("/seller/browse");
}
