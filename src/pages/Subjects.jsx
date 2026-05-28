import { useState } from "react";
import { Plus, Loader2, Edit3, Trash2, BookOpen } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = { school_id: null, name: "", code: "", category: "core" };

export default function Subjects() {
  const { t } = useLang();
  const { rows, loading, create, update, remove } = useResource("subjects", { orderBy: "name", ascending: true });
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
    const res = editing ? await update(editing.id, form) : await create(form);
    if (res.error) setErr(res.error.message);
    else setModalOpen(false);
    setBusy(false);
  };

  const filtered = rows.filter((r) => (r.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={t.subjects} subtitle={`${rows.length} ${t.subjects.toLowerCase()}`}
        actions={<button onClick={() => open()} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}><Plus className="h-4 w-4" /> {t.addNew}</button>} />
      <Toolbar onSearch={setSearch} />

      {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></div> :
       filtered.length === 0 ? <div className="py-16 text-center text-stone-400">{t.noData}</div> :
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
         {filtered.map((r) => (
           <div key={r.id} className="bg-white rounded-xl border border-stone-200 p-4 group">
             <div className="flex items-start justify-between mb-3">
               <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "var(--green-100)", color: "var(--green-800)" }}><BookOpen className="h-4 w-4" /></div>
               <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                 <button onClick={() => open(r)} className="p-1 rounded text-stone-500 hover:bg-stone-100"><Edit3 className="h-3.5 w-3.5" /></button>
                 <button onClick={() => confirm(t.deleteConfirm) && remove(r.id)} className="p-1 rounded text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
               </div>
             </div>
             <h3 className="font-medium text-stone-900 truncate">{r.name}</h3>
             <p className="text-xs text-stone-500 mt-0.5">{r.code} · {r.category}</p>
           </div>
         ))}
       </div>}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : `${t.addNew} ${t.subjects}`}>
        <form onSubmit={save} className="space-y-4">
          <Field label={t.schoolName}><select required className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })}><option value="">—</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label={t.name}><input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code"><input className={inputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
            <Field label={t.category}><select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="core">Core</option><option value="optional">Optional</option><option value="extra">Extra</option></select></Field>
          </div>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">{t.cancel}</button><button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}</button></div>
        </form>
      </Modal>
    </div>
  );
}
