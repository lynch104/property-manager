import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const propertyId = searchParams.get("propertyId");

    const payments = await prisma.payment.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(propertyId ? { tenant: { propertyId } } : {}),
      },
      include: {
        tenant: { select: { id: true, name: true, property: { select: { id: true, name: true } } } },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(payments);
  } catch {
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, ...rest } = body;
    const payment = await prisma.payment.create({
      data: { ...rest, date: new Date(date) },
      include: {
        tenant: { select: { id: true, name: true, property: { select: { id: true, name: true } } } },
      },
    });
    return NextResponse.json(payment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
