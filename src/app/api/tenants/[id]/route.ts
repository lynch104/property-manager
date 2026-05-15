import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { leaseStart, leaseEnd, ...rest } = body;
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...rest,
        leaseStart: new Date(leaseStart),
        leaseEnd: leaseEnd ? new Date(leaseEnd) : null,
      },
    });
    return NextResponse.json(tenant);
  } catch {
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 });
  }
}
