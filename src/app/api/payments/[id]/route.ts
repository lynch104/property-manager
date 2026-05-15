import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, ...rest } = body;
    const payment = await prisma.payment.update({
      where: { id },
      data: { ...rest, date: new Date(date) },
    });
    return NextResponse.json(payment);
  } catch {
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.payment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
