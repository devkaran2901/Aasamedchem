import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { toBaseUnits, calculateLineTotalPaise, CONVERSION_FACTORS } from "@/lib/units";
import type { DisplayUnit } from "@/lib/units";

const OrderItemSchema = z.object({
  productId: z.string(),
  orderedUnit: z.enum(["g", "kg", "mL", "L", "unit"]),
  orderedQty: z.number().positive(),
});

const OrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1),
  notes: z.string().optional(),
});

// GET /api/orders
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const isAdmin = user.role === "ADMIN";

  const orders = await prisma.order.findMany({
    where: isAdmin ? {} : { userId: user.id },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true, sku: true, baseUnit: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// POST /api/orders — place a new order
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const body = await req.json();
  const parsed = OrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items, notes } = parsed.data;

  // Fetch all products in one query
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate and calculate totals
  let orderTotalPaise = 0;
  const orderItems = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
    }

    const qtyInBaseUnit = toBaseUnits(item.orderedQty, item.orderedUnit as DisplayUnit);
    const lineTotalPaise = calculateLineTotalPaise(
      item.orderedQty,
      item.orderedUnit as DisplayUnit,
      product.pricePerBaseUnit
    );
    const unitPricePaise = Math.round(
      CONVERSION_FACTORS[item.orderedUnit as DisplayUnit] * product.pricePerBaseUnit
    );

    orderTotalPaise += lineTotalPaise;
    orderItems.push({
      productId: item.productId,
      orderedUnit: item.orderedUnit,
      orderedQty: item.orderedQty.toString(),
      qtyInBaseUnit: qtyInBaseUnit.toString(),
      unitPricePaise,
      lineTotalPaise,
    });
  }

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      totalPaise: orderTotalPaise,
      notes,
      items: { create: orderItems as any },
    },
    include: {
      items: {
        include: { product: { select: { name: true, sku: true } } },
      },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
