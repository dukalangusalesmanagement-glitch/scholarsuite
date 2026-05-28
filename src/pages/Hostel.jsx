import { useState } from "react";
import { Plus, Loader2, Edit3, Trash2, Bed } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = { school_id: null, room_no: "", block: "", capacity: 4, occupied: 0, gender: "male" };

export default function Hostel() {
  const { t } = useLang();
  const { rows, loading, create, update, remove } = useResource("hostel_rooms", { orderBy: "room_no", ascending: true });
  const { rows: schools } = useResource("schools", { orderBy: "name", ascending: true });
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const open = (r = null) => { setEditing(r); setForm(r ? { ...EMPTY, ...r } : { ...EMPTY, school_id: schools[0]?.id }); setErr(""); setModalOpen(true); };
  const save = async (e) => { e.preventDefault(); setBusy(true); const payload = { ...form, capacity: Number(form.capacity), occupied: Number(form.occupied) }; const res = editing ? await update(editing.id, payload) : await create(payload); if (res.error) setErr(res.error.message); else setModalOpen(false); setBusy(false); };
  const filtered = rows.filter((r) => (r.room_no || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={t.hostel} subtitle={`${rows.length} ${t.room.toLowerCase()}s`}
        actions={<button onClick={() => open()} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}><Plus className="h-4 w-4" /> {t.addNew}</button>} />
      <Toolbar onSearch={setSearch} />

      {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></div> :
       filtered.length === 0 ? <div className="py-16 text-center text-stone-400">{t.noData}</div> :
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
         {filtered.map((r) => {
           const pct = r.capacity ? Math.round((r.occupied / r.capacity) * 100) : 0;
           const full = r.occupied >= r.capacity;
           return (
             <div key={r.id} className="bg-white rounded-xl border border-stone-200 p-4 group">
               <div className="flex items-start justify-between mb-3">
                 <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: full ? "#fee2e2" : "var(--green-100)", color: full ? "#991b1b" : "var(--green-800)" }}><Bed className="h-5 w-5" /></div>
                 <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-stone-100 text-stone-600">{r.gender}</span>
               </div>
               <h3 className="display text-2xl" style={{ color: "var(--green-950)" }}>{r.room_no}</h3>
               <p className="text-xs text-stone-500 mb-2">Block {r.block || "—"}</p>
               <div className="flex items-baseline justify-between mt-2"><span className="text-xs text-stone-600">{r.occupied}/{r.capacity}</span><span className={`text-xs font-medium ${full ? "text-red-600" : "text-emerald-700"}`}>{pct}%</span></div>
               <div className="h-1.5 rounded-full bg-stone-100 mt-1 overflow-hidden"><div className={`h-full ${full ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} /></div>
               <div className="mt-3 pt-3 border-t border-stone-100 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                 <button onClick={() => open(r)} className="flex-1 py-1 rounded text-xs text-stone-600 hover:bg-stone-50">{t.edit}</button>
                 <button onClick={() => confirm(t.deleteConfirm) && remove(r.id)} className="flex-1 py-1 rounded text-xs text-red-600 hover:bg-red-50">{t.delete}</button>
               </div>
             </div>
           );
         })}
       </div>}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : `${t.addNew} ${t.room}`}>
        <form onSubmit={save} className="space-y-4">
          <Field label={t.schoolName}><select required className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })}><option value="">—</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Room No."><input required className={inputClass} value={form.room_no} onChange={(e) => setForm({ ...form, room_no: e.target.value })} /></Field>
            <Field label="Block"><input className={inputClass} value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} /></Field>
            <Field label="Capacity"><input type="number" className={inputClass} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
            <Field label="Occupied"><input type="number" className={inputClass} value={form.occupied} onChange={(e) => setForm({ ...form, occupied: e.target.value })} /></Field>
            <Field label={t.gender}><select className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="male">{t.male}</option><option value="female">{t.female}</option></select></Field>
          </div>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">{t.cancel}</button><button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}</button></div>
        </form>
      </Modal>
    </div>
  );
}
