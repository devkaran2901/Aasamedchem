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

// GET /api/products — list all active products (seller) or all (admin)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  const products = await prisma.product.findMany({
    where: {
      ...(session.user && (session.user as any).role !== "ADMIN" ? { isActive: true } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

// POST /api/products — create product (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.create({ data: parsed.data as any });
  return NextResponse.json(product, { status: 201 });
}
