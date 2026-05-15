import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    const expenses = await prisma.expense.findMany({
      where: propertyId ? { propertyId } : undefined,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, ...rest } = body;
    const expense = await prisma.expense.create({
      data: { ...rest, date: new Date(date) },
      include: { property: { select: { id: true, name: true } } },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
