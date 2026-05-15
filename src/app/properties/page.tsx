"use client";
import { useEffect, useState } from "react";
import { Plus, Building2, Users, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatCurrency, PROPERTY_TYPES } from "@/lib/utils";

interface Property {
  id: string; name: string; address: string; type: string; units: number;
  tenants: { id: string }[];
  expenses: { amount: number }[];
}

const empty = { name: "", address: "", type: "Residential", units: 1 };

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/properties").then(r => r.json()).then(d => { setProperties(d); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (p: Property) => {
    setEditing(p);
    setForm({ name: p.name, address: p.address, type: p.type, units: p.units });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/properties/${editing.id}` : "/api/properties";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setModalOpen(false); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this property? This will also remove all linked tenants and records.")) return;
    await fetch(`/api/properties/${id}`, { method: "DELETE" }); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">{properties.length} propert{properties.length !== 1 ? "ies" : "y"} managed</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Property</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-gray-400">
            <Building2 className="h-14 w-14 mb-3 opacity-30" />
            <p className="font-medium">No properties yet</p>
            <p className="text-sm mt-1">Click "Add Property" to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.address}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge label={p.type} variant="blue" />
                  <span className="text-xs text-gray-400">{p.units} unit{p.units !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">Active Tenants</p>
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {p.tenants.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Expenses</p>
                    <p className="text-sm font-semibold text-orange-600">
                      {formatCurrency(p.expenses.reduce((s, e) => s + e.amount, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Property" : "Add Property"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Name *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Maple Street House" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Main St, City, State" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
              <input type="number" min={1} value={form.units} onChange={e => setForm({ ...form, units: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Property"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
