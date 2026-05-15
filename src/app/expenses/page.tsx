"use client";
import { useEffect, useState } from "react";
import { Plus, Receipt, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from "@/lib/utils";

interface Expense {
  id: string; description: string; amount: number; category: string;
  date: string; note?: string; propertyId: string;
  property: { id: string; name: string };
}
interface Property { id: string; name: string; }

const today = new Date().toISOString().split("T")[0];
const empty = { description: "", amount: "", category: "Maintenance", date: today, note: "", propertyId: "" };

const categoryColors: Record<string, "blue" | "red" | "yellow" | "green" | "purple" | "gray"> = {
  Maintenance: "blue", Repairs: "red", Utilities: "yellow",
  Insurance: "purple", Taxes: "gray", Cleaning: "green",
  Security: "gray", Management: "purple", Other: "gray",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProp, setFilterProp] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([
      fetch("/api/expenses").then(r => r.json()),
      fetch("/api/properties").then(r => r.json()),
    ]).then(([exp, prop]) => { setExpenses(exp); setProperties(prop); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ ...empty, propertyId: properties[0]?.id ?? "" }); setModalOpen(true); };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({ description: e.description, amount: String(e.amount), category: e.category, date: e.date.split("T")[0], note: e.note ?? "", propertyId: e.propertyId });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, amount: Number(form.amount) };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/expenses/${editing.id}` : "/api/expenses";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false); setModalOpen(false); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" }); load();
  };

  const filtered = expenses.filter(e =>
    (filterProp === "all" || e.propertyId === filterProp) &&
    (filterCat === "all" || e.category === filterCat) &&
    (search === "" || e.description.toLowerCase().includes(search.toLowerCase()))
  );

  const totalShown = filtered.reduce((s, e) => s + e.amount, 0);

  // Category breakdown for summary
  const byCategory = EXPENSE_CATEGORIES.map(cat => ({
    cat,
    total: filtered.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} records · Total: <span className="font-medium text-orange-600">{formatCurrency(totalShown)}</span></p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Expense</Button>
      </div>

      {/* Category summary pills */}
      {byCategory.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {byCategory.map(({ cat, total }) => (
            <button key={cat} onClick={() => setFilterCat(filterCat === cat ? "all" : cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterCat === cat ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}>
              {cat} · {formatCurrency(total)}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterProp} onChange={e => setFilterProp(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Properties</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Categories</option>
          {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16 text-gray-400">
          <Receipt className="h-14 w-14 mb-3 opacity-30" />
          <p className="font-medium">No expenses found</p>
          <p className="text-sm mt-1">Click "Add Expense" to log your first expense</p>
        </CardContent></Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Description", "Property", "Category", "Amount", "Date", "Note", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{e.description}</td>
                    <td className="px-4 py-3 text-gray-600">{e.property.name}</td>
                    <td className="px-4 py-3"><Badge label={e.category} variant={categoryColors[e.category] ?? "gray"} /></td>
                    <td className="px-4 py-3 font-semibold text-orange-600">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-[150px] truncate">{e.note || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Expense" : "Add Expense"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Fix leaking roof" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
              <select required value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select property…</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
            <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Expense"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
