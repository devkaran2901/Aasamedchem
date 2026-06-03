import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  baseUnit: z.enum(["GRAM", "MILLILITER", "UNIT"]).optional(),
  pricePerBaseUnit: z.number().int().positive().optional(),
  stockInBaseUnit: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/products/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

// PATCH /api/products/[id] — admin only
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: parsed.data as any,
  });
  return NextResponse.json(product);
}

// DELETE /api/products/[id] — admin only (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.product.update({
    where: { id: params.id },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true });
}
