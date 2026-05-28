import { useState } from "react";
import { Plus, Loader2, Edit3, Trash2, Package, AlertTriangle } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import { formatTZS } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = { school_id: null, item_name: "", category: "", quantity: 0, unit: "pcs", unit_price: 0, supplier: "", location: "", reorder_level: 10 };

export default function Inventory() {
  const { t } = useLang();
  const { rows, loading, create, update, remove } = useResource("inventory", { orderBy: "item_name", ascending: true });
  const { rows: schools } = useResource("schools", { orderBy: "name", ascending: true });
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const open = (r = null) => { setEditing(r); setForm(r ? { ...EMPTY, ...r } : { ...EMPTY, school_id: schools[0]?.id }); setErr(""); setModalOpen(true); };
  const save = async (e) => { e.preventDefault(); setBusy(true); const payload = { ...form, quantity: Number(form.quantity), unit_price: Number(form.unit_price), reorder_level: Number(form.reorder_level) }; const res = editing ? await update(editing.id, payload) : await create(payload); if (res.error) setErr(res.error.message); else setModalOpen(false); setBusy(false); };
  const filtered = rows.filter((r) => [r.item_name, r.category, r.supplier].join(" ").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={t.inventory} subtitle={`${rows.length} items`}
        actions={<button onClick={() => open()} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}><Plus className="h-4 w-4" /> {t.addNew}</button>} />
      <Toolbar onSearch={setSearch} />

      <div className="rounded-2xl border border-stone-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
            <tr><th className="px-4 py-3 font-medium">{t.asset}</th><th className="px-4 py-3 font-medium">{t.category}</th><th className="px-4 py-3 font-medium">{t.quantity}</th><th className="px-4 py-3 font-medium">Unit price</th><th className="px-4 py-3 font-medium">{t.supplier}</th><th className="px-4 py-3 font-medium text-right">{t.actions}</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></td></tr> :
             filtered.length === 0 ? <tr><td colSpan={6} className="py-16 text-center text-stone-400">{t.noData}</td></tr> :
             filtered.map((r) => {
               const low = r.quantity <= r.reorder_level;
               return (
                 <tr key={r.id} className={`hover:bg-stone-50/50 ${low ? "bg-red-50/40" : ""}`}>
                   <td className="px-4 py-3 flex items-center gap-3"><Package className="h-4 w-4 text-emerald-700" /><span className="font-medium text-stone-900">{r.item_name}</span>{low && <AlertTriangle className="h-3.5 w-3.5 text-red-500" title="Low stock" />}</td>
                   <td className="px-4 py-3 text-stone-700">{r.category || "—"}</td>
                   <td className="px-4 py-3"><span className={`font-medium ${low ? "text-red-600" : "text-stone-900"}`}>{r.quantity}</span> <span className="text-stone-500 text-xs">{r.unit}</span></td>
                   <td className="px-4 py-3">{formatTZS(r.unit_price)}</td>
                   <td className="px-4 py-3 text-stone-700">{r.supplier || "—"}</td>
                   <td className="px-4 py-3 text-right"><button onClick={() => open(r)} className="p-1.5 rounded text-stone-500 hover:bg-stone-100 hover:text-emerald-700"><Edit3 className="h-4 w-4" /></button><button onClick={() => confirm(t.deleteConfirm) && remove(r.id)} className="p-1.5 rounded text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
                 </tr>
               );
             })}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : `${t.addNew} ${t.asset}`}>
        <form onSubmit={save} className="space-y-4">
          <Field label={t.schoolName}><select required className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })}><option value="">—</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Item name"><input required className={inputClass} value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.category}><input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
            <Field label={t.supplier}><input className={inputClass} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Field>
            <Field label={t.quantity}><input type="number" className={inputClass} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
            <Field label="Unit"><input className={inputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
            <Field label="Unit price (TZS)"><input type="number" className={inputClass} value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></Field>
            <Field label="Reorder level"><input type="number" className={inputClass} value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></Field>
            <Field label="Location"><input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          </div>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">{t.cancel}</button><button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}</button></div>
        </form>
      </Modal>
    </div>
  );
}
