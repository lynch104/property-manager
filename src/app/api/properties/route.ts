import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      include: {
        tenants: { where: { status: "Active" } },
        expenses: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(properties);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const property = await prisma.property.create({ data: body });
    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
