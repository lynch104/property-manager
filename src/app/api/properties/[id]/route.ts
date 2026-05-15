import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id },
      include: { tenants: true, expenses: true },
    });
    if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(property);
  } catch {
    return NextResponse.json({ error: "Failed to fetch property" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const property = await prisma.property.update({ where: { id }, data: body });
    return NextResponse.json(property);
  } catch {
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}
