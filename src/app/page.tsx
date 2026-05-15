"use client";
import { useEffect, useState } from "react";
import { Building2, Users, TrendingUp, TrendingDown, AlertCircle, DollarSign, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, getMonthName } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from "recharts";

interface DashboardData {
  properties: number;
  tenants: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  overdueCount: number;
  monthlyData: { month: number; income: number; expenses: number }[];
  recentPayments: {
    id: string; amount: number; date: string; status: string;
    tenant: { name: string; property: { name: string } };
  }[];
}

function StatCard({ title, value, icon: Icon, color, sub }: {
  title: string; value: string; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const chartData = data?.monthlyData
    .filter((m) => m.income > 0 || m.expenses > 0)
    .map((m) => ({ name: getMonthName(m.month), Income: m.income, Expenses: m.expenses })) ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your property portfolio — {new Date().getFullYear()}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard title="Total Properties" value={String(data?.properties ?? 0)} icon={Building2} color="bg-blue-500" />
        <StatCard title="Active Tenants" value={String(data?.tenants ?? 0)} icon={Users} color="bg-indigo-500" />
        <StatCard title="Total Income (YTD)" value={formatCurrency(data?.totalIncome ?? 0)} icon={TrendingUp} color="bg-green-500" sub="This year" />
        <StatCard title="Total Expenses (YTD)" value={formatCurrency(data?.totalExpenses ?? 0)} icon={TrendingDown} color="bg-orange-500" sub="This year" />
        <StatCard title="Net Profit (YTD)" value={formatCurrency(data?.netProfit ?? 0)} icon={DollarSign} color={(data?.netProfit ?? 0) >= 0 ? "bg-emerald-500" : "bg-red-500"} />
        <StatCard title="Overdue Tenants" value={String(data?.overdueCount ?? 0)} icon={AlertCircle} color={(data?.overdueCount ?? 0) > 0 ? "bg-red-500" : "bg-gray-400"} sub="No payment this month" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <BarChart3 className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm text-center">No data yet — add payments and expenses to see your chart</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                  <Bar dataKey="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Profit Trend</CardTitle></CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <p className="text-sm">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.map((d) => ({ ...d, Profit: d.Income - d.Expenses }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Line type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!data?.recentPayments.length ? (
            <p className="px-6 py-8 text-center text-gray-400 text-sm">No payments recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Tenant", "Property", "Amount", "Date", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.tenant.name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.tenant.property.name}</td>
                      <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.status === "Paid" ? "bg-green-100 text-green-800" :
                          p.status === "Partial" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                        }`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
