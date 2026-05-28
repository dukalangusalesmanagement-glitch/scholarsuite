import { useState } from "react";
import { Plus, Loader2, Edit3, Trash2, AlertTriangle } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import { formatDate } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = { school_id: null, student_id: null, incident_date: new Date().toISOString().slice(0, 10), category: "minor", description: "", action_taken: "", severity: "low" };
const SEVERITY = { low: "bg-emerald-100 text-emerald-800", medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-red-800" };

export default function Discipline() {
  const { t } = useLang();
  const { rows, loading, create, update, remove } = useResource("discipline_records", { orderBy: "incident_date" });
  const { rows: schools } = useResource("schools", { orderBy: "name", ascending: true });
  const { rows: students } = useResource("students", { orderBy: "full_name", ascending: true, limit: 500 });
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const open = (r = null) => { setEditing(r); setForm(r ? { ...EMPTY, ...r } : { ...EMPTY, school_id: schools[0]?.id }); setErr(""); setModalOpen(true); };
  const save = async (e) => { e.preventDefault(); setBusy(true); const res = editing ? await update(editing.id, form) : await create(form); if (res.error) setErr(res.error.message); else setModalOpen(false); setBusy(false); };
  const studentName = (id) => students.find((s) => s.id === id)?.full_name || "—";
  const filtered = rows.filter((r) => studentName(r.student_id).toLowerCase().includes(search.toLowerCase()) || (r.category || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={t.discipline} subtitle={`${rows.length} records`}
        actions={<button onClick={() => open()} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}><Plus className="h-4 w-4" /> {t.addNew}</button>} />
      <Toolbar onSearch={setSearch} />

      <div className="space-y-3">
        {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></div> :
         filtered.length === 0 ? <div className="py-16 text-center text-stone-400">{t.noData}</div> :
         filtered.map((r) => (
           <div key={r.id} className="bg-white rounded-xl border border-stone-200 p-4 flex items-start gap-4">
             <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--green-100)", color: "var(--green-800)" }}><AlertTriangle className="h-5 w-5" /></div>
             <div className="flex-1 min-w-0">
               <div className="flex items-center gap-3 mb-1">
                 <h3 className="font-medium text-stone-900">{studentName(r.student_id)}</h3>
                 <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${SEVERITY[r.severity] || SEVERITY.low}`}>{r.severity}</span>
               </div>
               <p className="text-xs text-stone-500 mb-2">{r.category} · {formatDate(r.incident_date)}</p>
               <p className="text-sm text-stone-700 mb-1">{r.description}</p>
               {r.action_taken && <p className="text-xs text-stone-600"><strong>{t.actions}:</strong> {r.action_taken}</p>}
             </div>
             <div className="flex gap-1 flex-shrink-0">
               <button onClick={() => open(r)} className="p-1.5 rounded text-stone-500 hover:bg-stone-100"><Edit3 className="h-4 w-4" /></button>
               <button onClick={() => confirm(t.deleteConfirm) && remove(r.id)} className="p-1.5 rounded text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
             </div>
           </div>
         ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : `${t.addNew} ${t.discipline}`}>
        <form onSubmit={save} className="space-y-4">
          <Field label={t.schoolName}><select required className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })}><option value="">—</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label={t.students}><select required className={inputClass} value={form.student_id || ""} onChange={(e) => setForm({ ...form, student_id: e.target.value })}><option value="">—</option>{students.filter((s) => !form.school_id || s.school_id === form.school_id).map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.date}><input type="date" className={inputClass} value={form.incident_date} onChange={(e) => setForm({ ...form, incident_date: e.target.value })} /></Field>
            <Field label={t.category}><input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          </div>
          <Field label={t.description}><textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Action taken"><textarea rows={2} className={inputClass} value={form.action_taken} onChange={(e) => setForm({ ...form, action_taken: e.target.value })} /></Field>
          <Field label="Severity"><select className={inputClass} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">{t.cancel}</button><button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}</button></div>
        </form>
      </Modal>
    </div>
  );
}
