import { useState } from "react";
import { Plus, Loader2, Edit3, Trash2, Bus } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import { formatTZS } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = { school_id: null, route_name: "", bus_number: "", driver_name: "", driver_phone: "", capacity: 30, monthly_fee: 0 };

export default function Transport() {
  const { t } = useLang();
  const { rows, loading, create, update, remove } = useResource("transport_routes", { orderBy: "route_name", ascending: true });
  const { rows: schools } = useResource("schools", { orderBy: "name", ascending: true });
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const open = (r = null) => { setEditing(r); setForm(r ? { ...EMPTY, ...r } : { ...EMPTY, school_id: schools[0]?.id }); setErr(""); setModalOpen(true); };
  const save = async (e) => { e.preventDefault(); setBusy(true); const payload = { ...form, capacity: Number(form.capacity), monthly_fee: Number(form.monthly_fee) }; const res = editing ? await update(editing.id, payload) : await create(payload); if (res.error) setErr(res.error.message); else setModalOpen(false); setBusy(false); };
  const filtered = rows.filter((r) => [r.route_name, r.bus_number, r.driver_name].join(" ").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={t.transport} subtitle={`${rows.length} ${t.route.toLowerCase()}s`}
        actions={<button onClick={() => open()} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}><Plus className="h-4 w-4" /> {t.addNew}</button>} />
      <Toolbar onSearch={setSearch} />

      <div className="rounded-2xl border border-stone-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
            <tr><th className="px-4 py-3 font-medium">{t.route}</th><th className="px-4 py-3 font-medium">{t.bus}</th><th className="px-4 py-3 font-medium">{t.driver}</th><th className="px-4 py-3 font-medium">{t.phone}</th><th className="px-4 py-3 font-medium">Capacity</th><th className="px-4 py-3 font-medium">Fee</th><th className="px-4 py-3 font-medium text-right">{t.actions}</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></td></tr> :
             filtered.length === 0 ? <tr><td colSpan={7} className="py-16 text-center text-stone-400">{t.noData}</td></tr> :
             filtered.map((r) => (
               <tr key={r.id} className="hover:bg-stone-50/50">
                 <td className="px-4 py-3 flex items-center gap-3"><Bus className="h-4 w-4 text-emerald-700" /><span className="font-medium text-stone-900">{r.route_name}</span></td>
                 <td className="px-4 py-3 font-mono text-xs">{r.bus_number || "—"}</td>
                 <td className="px-4 py-3 text-stone-700">{r.driver_name || "—"}</td>
                 <td className="px-4 py-3 text-stone-700">{r.driver_phone || "—"}</td>
                 <td className="px-4 py-3 text-stone-700">{r.capacity}</td>
                 <td className="px-4 py-3 font-medium">{formatTZS(r.monthly_fee)}</td>
                 <td className="px-4 py-3 text-right"><button onClick={() => open(r)} className="p-1.5 rounded text-stone-500 hover:bg-stone-100 hover:text-emerald-700"><Edit3 className="h-4 w-4" /></button><button onClick={() => confirm(t.deleteConfirm) && remove(r.id)} className="p-1.5 rounded text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : `${t.addNew} ${t.route}`}>
        <form onSubmit={save} className="space-y-4">
          <Field label={t.schoolName}><select required className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })}><option value="">—</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label={t.route}><input required className={inputClass} value={form.route_name} onChange={(e) => setForm({ ...form, route_name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.bus}><input className={inputClass} value={form.bus_number} onChange={(e) => setForm({ ...form, bus_number: e.target.value })} /></Field>
            <Field label="Capacity"><input type="number" className={inputClass} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
            <Field label={t.driver}><input className={inputClass} value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} /></Field>
            <Field label={t.phone}><input className={inputClass} value={form.driver_phone} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} /></Field>
            <Field label={`Fee/mo (TZS)`}><input type="number" className={inputClass} value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })} /></Field>
          </div>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">{t.cancel}</button><button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}</button></div>
        </form>
      </Modal>
    </div>
  );
}
