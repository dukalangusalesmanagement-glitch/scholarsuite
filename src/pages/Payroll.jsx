import { useState } from "react";
import { Plus, Loader2, Edit3, Trash2, Briefcase, Check } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import { formatTZS } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const NOW = new Date();
const EMPTY = { school_id: null, teacher_id: null, month: NOW.getMonth() + 1, year: NOW.getFullYear(), basic_salary: 0, allowances: 0, deductions: 0, net_salary: 0, paid: false };

export default function Payroll() {
  const { t } = useLang();
  const { rows, loading, create, update, remove } = useResource("payroll", { orderBy: "year", ascending: false });
  const { rows: schools } = useResource("schools", { orderBy: "name", ascending: true });
  const { rows: teachers } = useResource("teachers", { orderBy: "full_name", ascending: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const open = (r = null) => { setEditing(r); setForm(r ? { ...EMPTY, ...r } : { ...EMPTY, school_id: schools[0]?.id }); setErr(""); setModalOpen(true); };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const net = (Number(form.basic_salary) || 0) + (Number(form.allowances) || 0) - (Number(form.deductions) || 0);
    const payload = { ...form, month: Number(form.month), year: Number(form.year), basic_salary: Number(form.basic_salary), allowances: Number(form.allowances), deductions: Number(form.deductions), net_salary: net };
    const res = editing ? await update(editing.id, payload) : await create(payload);
    if (res.error) setErr(res.error.message);
    else setModalOpen(false);
    setBusy(false);
  };
  const togglePaid = async (r) => { await update(r.id, { paid: !r.paid, paid_at: !r.paid ? new Date().toISOString() : null }); };
  const teacherName = (id) => teachers.find((tt) => tt.id === id)?.full_name || "—";
  const filtered = rows.filter((r) => teacherName(r.teacher_id).toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title={t.payroll} subtitle={`${rows.length} records`}
        actions={<button onClick={() => open()} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}><Plus className="h-4 w-4" /> {t.addNew}</button>} />
      <Toolbar onSearch={setSearch} />

      <div className="rounded-2xl border border-stone-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
            <tr><th className="px-4 py-3 font-medium">{t.employees}</th><th className="px-4 py-3 font-medium">Month/Year</th><th className="px-4 py-3 font-medium">Basic</th><th className="px-4 py-3 font-medium">Allowances</th><th className="px-4 py-3 font-medium">Deductions</th><th className="px-4 py-3 font-medium">Net</th><th className="px-4 py-3 font-medium">{t.status}</th><th className="px-4 py-3 font-medium text-right">{t.actions}</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? <tr><td colSpan={8} className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></td></tr> :
             filtered.length === 0 ? <tr><td colSpan={8} className="py-16 text-center text-stone-400">{t.noData}</td></tr> :
             filtered.map((r) => (
               <tr key={r.id} className="hover:bg-stone-50/50">
                 <td className="px-4 py-3 font-medium text-stone-900">{teacherName(r.teacher_id)}</td>
                 <td className="px-4 py-3 text-stone-600">{r.month}/{r.year}</td>
                 <td className="px-4 py-3">{formatTZS(r.basic_salary)}</td>
                 <td className="px-4 py-3 text-emerald-700">+{formatTZS(r.allowances)}</td>
                 <td className="px-4 py-3 text-red-600">-{formatTZS(r.deductions)}</td>
                 <td className="px-4 py-3 font-medium">{formatTZS(r.net_salary)}</td>
                 <td className="px-4 py-3"><button onClick={() => togglePaid(r)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${r.paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{r.paid && <Check className="h-3 w-3" />}{r.paid ? t.paid : t.pending}</button></td>
                 <td className="px-4 py-3 text-right"><button onClick={() => open(r)} className="p-1.5 rounded text-stone-500 hover:bg-stone-100 hover:text-emerald-700"><Edit3 className="h-4 w-4" /></button><button onClick={() => confirm(t.deleteConfirm) && remove(r.id)} className="p-1.5 rounded text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : `${t.addNew} ${t.payroll}`}>
        <form onSubmit={save} className="space-y-4">
          <Field label={t.schoolName}><select required className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })}><option value="">—</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label={t.employees}><select required className={inputClass} value={form.teacher_id || ""} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}><option value="">—</option>{teachers.filter((tt) => !form.school_id || tt.school_id === form.school_id).map((tt) => <option key={tt.id} value={tt.id}>{tt.full_name}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Month"><input type="number" min="1" max="12" className={inputClass} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></Field>
            <Field label="Year"><input type="number" className={inputClass} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></Field>
            <Field label="Basic salary (TZS)"><input type="number" className={inputClass} value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} /></Field>
            <Field label="Allowances (TZS)"><input type="number" className={inputClass} value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} /></Field>
            <Field label="Deductions (TZS)"><input type="number" className={inputClass} value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} /></Field>
          </div>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">{t.cancel}</button><button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}</button></div>
        </form>
      </Modal>
    </div>
  );
}
