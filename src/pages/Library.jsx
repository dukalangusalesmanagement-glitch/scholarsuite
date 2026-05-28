import { useState } from "react";
import { Plus, Loader2, Edit3, Trash2, Library as LibIcon } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = { school_id: null, title: "", author: "", isbn: "", category: "", total_copies: 1, available_copies: 1, shelf_location: "" };

export default function Library() {
  const { t } = useLang();
  const { rows, loading, create, update, remove } = useResource("library_books", { orderBy: "title", ascending: true });
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
    const payload = { ...form, total_copies: Number(form.total_copies) || 1, available_copies: Number(form.available_copies) || 1 };
    const res = editing ? await update(editing.id, payload) : await create(payload);
    if (res.error) setErr(res.error.message);
    else setModalOpen(false);
    setBusy(false);
  };

  const filtered = rows.filter((r) => [r.title, r.author, r.isbn].join(" ").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={t.library} subtitle={`${rows.length} ${t.book.toLowerCase()}s`}
        actions={<button onClick={() => open()} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}><Plus className="h-4 w-4" /> {t.addNew}</button>} />
      <Toolbar onSearch={setSearch} />

      <div className="rounded-2xl border border-stone-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
            <tr><th className="px-4 py-3 font-medium">{t.book}</th><th className="px-4 py-3 font-medium">{t.author}</th><th className="px-4 py-3 font-medium">{t.isbn}</th><th className="px-4 py-3 font-medium">{t.category}</th><th className="px-4 py-3 font-medium">{t.available}</th><th className="px-4 py-3 font-medium text-right">{t.actions}</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></td></tr> :
             filtered.length === 0 ? <tr><td colSpan={6} className="py-16 text-center text-stone-400">{t.noData}</td></tr> :
             filtered.map((r) => (
               <tr key={r.id} className="hover:bg-stone-50/50">
                 <td className="px-4 py-3 flex items-center gap-3"><LibIcon className="h-4 w-4 text-emerald-700" /><span className="font-medium text-stone-900">{r.title}</span></td>
                 <td className="px-4 py-3 text-stone-700">{r.author || "—"}</td>
                 <td className="px-4 py-3 font-mono text-xs">{r.isbn || "—"}</td>
                 <td className="px-4 py-3 text-stone-700">{r.category || "—"}</td>
                 <td className="px-4 py-3"><span className="text-emerald-700 font-medium">{r.available_copies}</span><span className="text-stone-400"> / {r.total_copies}</span></td>
                 <td className="px-4 py-3 text-right"><button onClick={() => open(r)} className="p-1.5 rounded text-stone-500 hover:bg-stone-100 hover:text-emerald-700"><Edit3 className="h-4 w-4" /></button><button onClick={() => confirm(t.deleteConfirm) && remove(r.id)} className="p-1.5 rounded text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : `${t.addNew} ${t.book}`}>
        <form onSubmit={save} className="space-y-4">
          <Field label={t.schoolName}><select required className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })}><option value="">—</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label={t.title}><input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.author}><input className={inputClass} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></Field>
            <Field label={t.isbn}><input className={inputClass} value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} /></Field>
            <Field label={t.category}><input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
            <Field label="Shelf"><input className={inputClass} value={form.shelf_location} onChange={(e) => setForm({ ...form, shelf_location: e.target.value })} /></Field>
            <Field label="Total copies"><input type="number" className={inputClass} value={form.total_copies} onChange={(e) => setForm({ ...form, total_copies: e.target.value })} /></Field>
            <Field label={t.available}><input type="number" className={inputClass} value={form.available_copies} onChange={(e) => setForm({ ...form, available_copies: e.target.value })} /></Field>
          </div>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">{t.cancel}</button><button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}</button></div>
        </form>
      </Modal>
    </div>
  );
}
