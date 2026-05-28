import { useState } from "react";
import { Plus, Loader2, Edit3, Trash2, FileText } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import { formatDate } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = { school_id: null, name: "", term: "Term 1", academic_year: "2025-2026", start_date: "", end_date: "", status: "scheduled" };

export default function Exams() {
  const { t } = useLang();
  const { rows, loading, create, update, remove } = useResource("exams", { orderBy: "created_at" });
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
    const payload = { ...form, start_date: form.start_date || null, end_date: form.end_date || null };
    const res = editing ? await update(editing.id, payload) : await create(payload);
    if (res.error) setErr(res.error.message);
    else setModalOpen(false);
    setBusy(false);
  };

  const filtered = rows.filter((r) => (r.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={t.examinations} subtitle={`${rows.length} ${t.examinations.toLowerCase()}`}
        actions={<button onClick={() => open()} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}><Plus className="h-4 w-4" /> {t.addNew}</button>} />
      <Toolbar onSearch={setSearch} />

      {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></div> :
       filtered.length === 0 ? <div className="py-16 text-center text-stone-400">{t.noData}</div> :
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {filtered.map((r) => (
           <div key={r.id} className="bg-white rounded-2xl border border-stone-200 p-5">
             <div className="flex items-start justify-between mb-3">
               <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "var(--green-100)", color: "var(--green-800)" }}>
                 <FileText className="h-5 w-5" />
               </div>
               <StatusPill status={r.status} />
             </div>
             <h3 className="display text-2xl mb-1" style={{ color: "var(--green-950)" }}>{r.name}</h3>
             <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">{r.term} · {r.academic_year}</p>
             <div className="text-sm text-stone-600 space-y-1">
               <p>{t.date}: {formatDate(r.start_date)} → {formatDate(r.end_date)}</p>
             </div>
             <div className="mt-4 pt-3 border-t border-stone-100 flex gap-1">
               <button onClick={() => open(r)} className="flex-1 py-1.5 rounded text-xs text-stone-600 hover:bg-stone-50">{t.edit}</button>
               <button onClick={() => confirm(t.deleteConfirm) && remove(r.id)} className="flex-1 py-1.5 rounded text-xs text-red-600 hover:bg-red-50">{t.delete}</button>
             </div>
           </div>
         ))}
       </div>}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : `${t.addNew} ${t.examinations}`}>
        <form onSubmit={save} className="space-y-4">
          <Field label={t.schoolName}>
            <select className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })} required>
              <option value="">—</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label={t.title}><input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.term}><input className={inputClass} value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} /></Field>
            <Field label={t.academicYear}><input className={inputClass} value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} /></Field>
            <Field label="Start"><input type="date" className={inputClass} value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="End"><input type="date" className={inputClass} value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
          </div>
          <Field label={t.status}>
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="scheduled">Scheduled</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option>
            </select>
          </Field>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">{t.cancel}</button>
            <button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
