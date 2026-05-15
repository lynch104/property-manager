"use client";
import { useEffect, useState } from "react";
import { Plus, CreditCard, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate, PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/utils";

interface Payment {
  id: string; amount: number; date: string; method: string; status: string; note?: string;
  tenantId: string;
  tenant: { id: string; name: string; property: { id: string; name: string } };
}
interface Tenant { id: string; name: string; propertyId: string; }
interface Property { id: string; name: string; }

const today = new Date().toISOString().split("T")[0];
const empty = { amount: "", date: today, method: "Cash", status: "Paid", note: "", tenantId: "" };

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProp, setFilterProp] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([
      fetch("/api/payments").then(r => r.json()),
      fetch("/api/tenants").then(r => r.json()),
      fetch("/api/properties").then(r => r.json()),
    ]).then(([pay, ten, prop]) => { setPayments(pay); setTenants(ten); setProperties(prop); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ ...empty, tenantId: tenants[0]?.id ?? "" }); setModalOpen(true); };
  const openEdit = (p: Payment) => {
    setEditing(p);
    setForm({ amount: String(p.amount), date: p.date.split("T")[0], method: p.method, status: p.status, note: p.note ?? "", tenantId: p.tenantId });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, amount: Number(form.amount) };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/payments/${editing.id}` : "/api/payments";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false); setModalOpen(false); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this payment record?")) return;
    await fetch(`/api/payments/${id}`, { method: "DELETE" }); load();
  };

  const filtered = payments.filter(p =>
    (filterProp === "all" || p.tenant.property.id === filterProp) &&
    (filterStatus === "all" || p.status === filterStatus) &&
    (search === "" || p.tenant.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalShown = filtered.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} records · Total: <span className="font-medium text-green-600">{formatCurrency(totalShown)}</span></p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Record Payment</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by tenant…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterProp} onChange={e => setFilterProp(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Properties</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Statuses</option>
          {PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16 text-gray-400">
          <CreditCard className="h-14 w-14 mb-3 opacity-30" />
          <p className="font-medium">No payments found</p>
        </CardContent></Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Tenant", "Property", "Amount", "Date", "Method", "Status", "Note", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.tenant.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.tenant.property.name}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(p.date)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.method}</td>
                    <td className="px-4 py-3"><Badge label={p.status} variant={statusVariant(p.status)} /></td>
                    <td className="px-4 py-3 text-gray-400 max-w-[150px] truncate">{p.note || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Payment" : "Record Payment"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
            <select required value={form.tenantId} onChange={e => setForm({ ...form, tenantId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select tenant…</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input required type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional note…" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Record Payment"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
