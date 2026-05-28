import { useState } from "react";
import { Plus, Loader2, Edit3, Trash2, Award, MapPin, Calendar } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import { formatDate } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = { school_id: null, title: "", description: "", category: "academic", start_date: "", end_date: "", location: "" };

export default function Events() {
  const { t } = useLang();
  const { rows, loading, create, update, remove } = useResource("events", { orderBy: "start_date" });
  const { rows: schools } = useResource("schools", { orderBy: "name", ascending: true });
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const open = (r = null) => { setEditing(r); setForm(r ? { ...EMPTY, ...r } : { ...EMPTY, school_id: schools[0]?.id }); setErr(""); setModalOpen(true); };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, start_date: form.start_date || null, end_date: form.end_date || null };
    const res = editing ? await update(editing.id, payload) : await create(payload);
    if (res.error) setErr(res.error.message); else setModalOpen(false);
    setBusy(false);
  };
  const filtered = rows.filter((r) => [r.title, r.category, r.location].join(" ").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={t.events} subtitle={`${rows.length} ${t.events.toLowerCase()}`}
        actions={<button onClick={() => open()} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}><Plus className="h-4 w-4" /> {t.addNew}</button>} />
      <Toolbar onSearch={setSearch} />

      {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></div> :
       filtered.length === 0 ? <div className="py-16 text-center text-stone-400">{t.noData}</div> :
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {filtered.map((r) => (
           <div key={r.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden group">
             <div className="h-24 relative" style={{ background: "linear-gradient(135deg, var(--green-700), var(--green-950))" }}>
               <div className="absolute inset-0 flex items-center justify-center"><Award className="h-10 w-10 text-white/40" /></div>
               <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider bg-white/20 text-white px-2 py-1 rounded-full backdrop-blur">{r.category}</span>
             </div>
             <div className="p-4">
               <h3 className="display text-xl mb-1" style={{ color: "var(--green-950)" }}>{r.title}</h3>
               {r.description && <p className="text-sm text-stone-600 line-clamp-2 mb-3">{r.description}</p>}
               <div className="space-y-1 text-xs text-stone-500">
                 <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(r.start_date)}{r.end_date && ` → ${formatDate(r.end_date)}`}</p>
                 {r.location && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {r.location}</p>}
               </div>
               <div className="mt-3 pt-3 border-t border-stone-100 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                 <button onClick={() => open(r)} className="flex-1 py-1.5 rounded text-xs text-stone-600 hover:bg-stone-50">{t.edit}</button>
                 <button onClick={() => confirm(t.deleteConfirm) && remove(r.id)} className="flex-1 py-1.5 rounded text-xs text-red-600 hover:bg-red-50">{t.delete}</button>
               </div>
             </div>
           </div>
         ))}
       </div>}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : `${t.addNew} ${t.events}`}>
        <form onSubmit={save} className="space-y-4">
          <Field label={t.schoolName}><select required className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })}><option value="">—</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label={t.title}><input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label={t.description}><textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.category}><select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="academic">Academic</option><option value="sports">Sports</option><option value="cultural">Cultural</option><option value="other">Other</option></select></Field>
            <Field label="Location"><input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
            <Field label="Start"><input type="datetime-local" className={inputClass} value={form.start_date ? form.start_date.slice(0, 16) : ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="End"><input type="datetime-local" className={inputClass} value={form.end_date ? form.end_date.slice(0, 16) : ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
          </div>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">{t.cancel}</button><button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}</button></div>
        </form>
      </Modal>
    </div>
  );
}
