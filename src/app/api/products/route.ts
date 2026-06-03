import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  baseUnit: z.enum(["GRAM", "MILLILITER", "UNIT"]),
  pricePerBaseUnit: z.number().int().positive(), // paise
  stockInBaseUnit: z.string(), // decimal string for precision
  isActive: z.boolean().optional().default(true),
});

// GET /api/products — list products
// - For ADMIN: all products
// - For SELLER: all active products (browse), or own products if ?owned=true (management)
// - For BUYER: all active products (browse)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const owned = searchParams.get("owned") === "true";
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  const products = await prisma.product.findMany({
    where: {
      ...(role === "ADMIN" ? {} : { isActive: true }),
      ...(role === "SELLER" && owned ? { sellerId: userId } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
    },
    include: role === "ADMIN" ? { seller: true } : undefined,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

// POST /api/products — create product (admin or seller)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session.user as any).role;
  
  if (!session || !["ADMIN", "SELLER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.create({ 
    data: {
      ...parsed.data as any,
      sellerId: role === "SELLER" ? (session.user as any).id : body.sellerId || null,
    }
  });
  return NextResponse.json(product, { status: 201 });
}
