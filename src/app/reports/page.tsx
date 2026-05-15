"use client";
import { useEffect, useState } from "react";
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, getMonthName, EXPENSE_CATEGORIES } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#3b82f6","#f97316","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#84cc16","#ec4899"];

interface Property { id: string; name: string; }
interface MonthSummary { month: number; income: number; expenses: number; }
interface PropertySummary { propertyId: string; name: string; income: number; expenses: number; net: number; }
interface CategorySummary { category: string; total: number; }

export default function ReportsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [filterProp, setFilterProp] = useState("all");
  const [monthly, setMonthly] = useState<MonthSummary[]>([]);
  const [byProperty, setByProperty] = useState<PropertySummary[]>([]);
  const [byCategory, setByCategory] = useState<CategorySummary[]>([]);
  const [totals, setTotals] = useState({ income: 0, expenses: 0, net: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/properties").then(r => r.json()).then(setProperties); }, []);

  useEffect(() => {
    setLoading(true);
    const start = new Date(year, 0, 1).toISOString();
    const end = new Date(year, 11, 31, 23, 59).toISOString();

    Promise.all([
      fetch(`/api/payments?${filterProp !== "all" ? `propertyId=${filterProp}` : ""}`).then(r => r.json()),
      fetch(`/api/expenses?${filterProp !== "all" ? `propertyId=${filterProp}` : ""}`).then(r => r.json()),
    ]).then(([payments, expenses]) => {
      const filtPay = payments.filter((p: any) => new Date(p.date) >= new Date(start) && new Date(p.date) <= new Date(end));
      const filtExp = expenses.filter((e: any) => new Date(e.date) >= new Date(start) && new Date(e.date) <= new Date(end));

      // Monthly
      const monthData: MonthSummary[] = Array.from({ length: 12 }, (_, i) => ({
        month: i,
        income: filtPay.filter((p: any) => new Date(p.date).getMonth() === i).reduce((s: number, p: any) => s + p.amount, 0),
        expenses: filtExp.filter((e: any) => new Date(e.date).getMonth() === i).reduce((s: number, e: any) => s + e.amount, 0),
      }));
      setMonthly(monthData);

      // By property
      const propMap: Record<string, PropertySummary> = {};
      payments.forEach((p: any) => {
        const id = p.tenant.property.id;
        const name = p.tenant.property.name;
        if (!propMap[id]) propMap[id] = { propertyId: id, name, income: 0, expenses: 0, net: 0 };
        propMap[id].income += p.amount;
      });
      expenses.forEach((e: any) => {
        const id = e.property.id;
        const name = e.property.name;
        if (!propMap[id]) propMap[id] = { propertyId: id, name, income: 0, expenses: 0, net: 0 };
        propMap[id].expenses += e.amount;
      });
      Object.values(propMap).forEach(p => { p.net = p.income - p.expenses; });
      setByProperty(Object.values(propMap));

      // By category
      const catData: CategorySummary[] = EXPENSE_CATEGORIES.map(cat => ({
        category: cat,
        total: filtExp.filter((e: any) => e.category === cat).reduce((s: number, e: any) => s + e.amount, 0),
      })).filter(c => c.total > 0);
      setByCategory(catData);

      const totalIncome = filtPay.reduce((s: number, p: any) => s + p.amount, 0);
      const totalExp = filtExp.reduce((s: number, e: any) => s + e.amount, 0);
      setTotals({ income: totalIncome, expenses: totalExp, net: totalIncome - totalExp });
      setLoading(false);
    });
  }, [year, filterProp]);

  const exportCSV = () => {
    const rows = [
      ["Month", "Income", "Expenses", "Net Profit"],
      ...monthly.map(m => [getMonthName(m.month), m.income.toFixed(2), m.expenses.toFixed(2), (m.income - m.expenses).toFixed(2)]),
      [],
      ["Property", "Income", "Expenses", "Net Profit"],
      ...byProperty.map(p => [p.name, p.income.toFixed(2), p.expenses.toFixed(2), p.net.toFixed(2)]),
      [],
      ["Expense Category", "Total"],
      ...byCategory.map(c => [c.category, c.total.toFixed(2)]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report-${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = monthly
    .map(m => ({ name: getMonthName(m.month), Income: m.income, Expenses: m.expenses, Profit: m.income - m.expenses }))
    .filter(m => m.Income > 0 || m.Expenses > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Financial summary for your portfolio</p>
        </div>
        <div className="flex gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <select value={filterProp} onChange={e => setFilterProp(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Properties</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Income", value: totals.income, icon: TrendingUp, color: "bg-green-500" },
          { label: "Total Expenses", value: totals.expenses, icon: TrendingDown, color: "bg-orange-500" },
          { label: "Net Profit", value: totals.net, icon: DollarSign, color: totals.net >= 0 ? "bg-emerald-500" : "bg-red-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`p-3 rounded-xl ${color}`}><Icon className="h-6 w-6 text-white" /></div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Bar Chart */}
      <Card>
        <CardHeader><CardTitle>Monthly Breakdown — {year}</CardTitle></CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <BarChart3 className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">No data for {year}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Income" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar dataKey="Expenses" fill="#f97316" radius={[4,4,0,0]} />
                <Bar dataKey="Profit" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* By Property */}
        <Card>
          <CardHeader><CardTitle>Performance by Property</CardTitle></CardHeader>
          <CardContent className="p-0">
            {byProperty.length === 0 ? (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">No data yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Property", "Income", "Expenses", "Net Profit"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {byProperty.map(p => (
                      <tr key={p.propertyId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(p.income)}</td>
                        <td className="px-4 py-3 text-orange-600 font-medium">{formatCurrency(p.expenses)}</td>
                        <td className={`px-4 py-3 font-semibold ${p.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(p.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Expense Category Pie */}
        <Card>
          <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <p className="text-sm">No expense data yet</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {byCategory.map((c, i) => (
                    <div key={c.category} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      {c.category}: {formatCurrency(c.total)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
