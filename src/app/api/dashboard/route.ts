import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [properties, tenants, payments, expenses] = await Promise.all([
      prisma.property.count(),
      prisma.tenant.count({ where: { status: "Active" } }),
      prisma.payment.findMany({ where: { date: { gte: startOfYear } } }),
      prisma.expense.findMany({ where: { date: { gte: startOfYear } } }),
    ]);

    const totalIncome = payments.reduce((s, p) => s + p.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    // Monthly breakdown
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthPayments = payments.filter((p) => new Date(p.date).getMonth() === i);
      const monthExpenses = expenses.filter((e) => new Date(e.date).getMonth() === i);
      return {
        month: i,
        income: monthPayments.reduce((s, p) => s + p.amount, 0),
        expenses: monthExpenses.reduce((s, e) => s + e.amount, 0),
      };
    });

    // Recent payments
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { tenant: { select: { name: true, property: { select: { name: true } } } } },
    });

    // Overdue tenants (payment missed this month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const paidThisMonth = await prisma.payment.findMany({
      where: { date: { gte: startOfMonth }, status: { in: ["Paid", "Partial"] } },
      select: { tenantId: true },
    });
    const paidIds = new Set(paidThisMonth.map((p) => p.tenantId));
    const activeTenants = await prisma.tenant.findMany({ where: { status: "Active" } });
    const overdueCount = activeTenants.filter((t) => !paidIds.has(t.id)).length;

    return NextResponse.json({
      properties,
      tenants,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      overdueCount,
      monthlyData,
      recentPayments,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
