import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    const tenants = await prisma.tenant.findMany({
      where: propertyId ? { propertyId } : undefined,
      include: { property: { select: { id: true, name: true } }, payments: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tenants);
  } catch {
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leaseStart, leaseEnd, ...rest } = body;
    const tenant = await prisma.tenant.create({
      data: {
        ...rest,
        leaseStart: new Date(leaseStart),
        leaseEnd: leaseEnd ? new Date(leaseEnd) : null,
      },
      include: { property: { select: { id: true, name: true } } },
    });
    return NextResponse.json(tenant, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
  }
}
