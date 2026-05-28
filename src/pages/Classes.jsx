import { useState } from "react";
import { Plus, Loader2, Edit3, Trash2, Layers } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = { school_id: null, name: "", level: "", stream: "", capacity: 40, academic_year: "2025-2026" };

export default function Classes() {
  const { t } = useLang();
  const { rows, loading, create, update, remove } = useResource("classes", { orderBy: "name", ascending: true });
  const { rows: schools } = useResource("schools", { orderBy: "name", ascending: true });
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const open = (r = null) => {
    setEditing(r);
    setForm(r ? { ...EMPTY, ...r } : { ...EMPTY, school_id: schools[0]?.id });
    setErr("");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, capacity: Number(form.capacity) || 0 };
    const res = editing ? await update(editing.id, payload) : await create(payload);
    if (res.error) setErr(res.error.message);
    else setModalOpen(false);
    setBusy(false);
  };

  const filtered = rows.filter((r) => (r.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={t.classes} subtitle={`${rows.length} ${t.classes.toLowerCase()}`}
        actions={<button onClick={() => open()} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}><Plus className="h-4 w-4" /> {t.addNew}</button>} />
      <Toolbar onSearch={setSearch} />

      <div className="rounded-2xl border border-stone-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
            <tr><th className="px-4 py-3 font-medium">{t.name}</th><th className="px-4 py-3 font-medium">Level</th><th className="px-4 py-3 font-medium">Stream</th><th className="px-4 py-3 font-medium">Capacity</th><th className="px-4 py-3 font-medium">{t.academicYear}</th><th className="px-4 py-3 font-medium text-right">{t.actions}</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></td></tr> :
             filtered.length === 0 ? <tr><td colSpan={6} className="py-16 text-center text-stone-400">{t.noData}</td></tr> :
             filtered.map((r) => (
               <tr key={r.id} className="hover:bg-stone-50/50">
                 <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--green-100)", color: "var(--green-800)" }}><Layers className="h-4 w-4" /></div><span className="font-medium text-stone-900">{r.name}</span></div></td>
                 <td className="px-4 py-3 text-stone-700">{r.level || "—"}</td>
                 <td className="px-4 py-3 text-stone-700">{r.stream || "—"}</td>
                 <td className="px-4 py-3 text-stone-700">{r.capacity}</td>
                 <td className="px-4 py-3 text-stone-700">{r.academic_year}</td>
                 <td className="px-4 py-3 text-right">
                   <button onClick={() => open(r)} className="p-1.5 rounded text-stone-500 hover:bg-stone-100 hover:text-emerald-700"><Edit3 className="h-4 w-4" /></button>
                   <button onClick={() => confirm(t.deleteConfirm) && remove(r.id)} className="p-1.5 rounded text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : `${t.addNew} ${t.classes}`}>
        <form onSubmit={save} className="space-y-4">
          <Field label={t.schoolName}><select required className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })}><option value="">—</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label={t.name}><input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Level"><input className={inputClass} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></Field>
            <Field label="Stream"><input className={inputClass} value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })} /></Field>
            <Field label="Capacity"><input type="number" className={inputClass} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
            <Field label={t.academicYear}><input className={inputClass} value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} /></Field>
          </div>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">{t.cancel}</button><button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}</button></div>
        </form>
      </Modal>
    </div>
  );
}
