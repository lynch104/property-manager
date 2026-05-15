"use client";
import { useEffect, useState } from "react";
import { Plus, Users, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate, TENANT_STATUSES } from "@/lib/utils";

interface Tenant {
  id: string; name: string; email?: string; phone?: string;
  rentAmount: number; rentDueDay: number; leaseStart: string; leaseEnd?: string;
  status: string; propertyId: string;
  property: { id: string; name: string };
  payments: { amount: number; status: string }[];
}
interface Property { id: string; name: string; }

const empty = { name: "", email: "", phone: "", rentAmount: "", rentDueDay: "1", leaseStart: "", leaseEnd: "", status: "Active", propertyId: "" };

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProp, setFilterProp] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([
      fetch("/api/tenants").then(r => r.json()),
      fetch("/api/properties").then(r => r.json()),
    ]).then(([t, p]) => { setTenants(t); setProperties(p); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ ...empty, propertyId: properties[0]?.id ?? "" }); setModalOpen(true); };
  const openEdit = (t: Tenant) => {
    setEditing(t);
    setForm({
      name: t.name, email: t.email ?? "", phone: t.phone ?? "",
      rentAmount: String(t.rentAmount), rentDueDay: String(t.rentDueDay),
      leaseStart: t.leaseStart.split("T")[0], leaseEnd: t.leaseEnd?.split("T")[0] ?? "",
      status: t.status, propertyId: t.propertyId,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, rentAmount: Number(form.rentAmount), rentDueDay: Number(form.rentDueDay) };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/tenants/${editing.id}` : "/api/tenants";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false); setModalOpen(false); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tenant and all their payment records?")) return;
    await fetch(`/api/tenants/${id}`, { method: "DELETE" }); load();
  };

  const filtered = tenants.filter(t =>
    (filterProp === "all" || t.propertyId === filterProp) &&
    (filterStatus === "all" || t.status === filterStatus) &&
    (search === "" || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} tenant{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Tenant</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants…"
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
          {TENANT_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16 text-gray-400">
          <Users className="h-14 w-14 mb-3 opacity-30" />
          <p className="font-medium">No tenants found</p>
        </CardContent></Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Name", "Property", "Rent/Month", "Due Day", "Lease Start", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      {t.email && <p className="text-xs text-gray-400">{t.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.property.name}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(t.rentAmount)}</td>
                    <td className="px-4 py-3 text-gray-600">Day {t.rentDueDay}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(t.leaseStart)}</td>
                    <td className="px-4 py-3"><Badge label={t.status} variant={statusVariant(t.status)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Tenant" : "Add Tenant"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+1 555 000 0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent *</label>
              <input required type="number" min="0" step="0.01" value={form.rentAmount} onChange={e => setForm({ ...form, rentAmount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="1200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent Due Day</label>
              <input type="number" min="1" max="28" value={form.rentDueDay} onChange={e => setForm({ ...form, rentDueDay: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start *</label>
              <input required type="date" value={form.leaseStart} onChange={e => setForm({ ...form, leaseStart: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease End</label>
              <input type="date" value={form.leaseEnd} onChange={e => setForm({ ...form, leaseEnd: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
              <select required value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select property…</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TENANT_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Tenant"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
