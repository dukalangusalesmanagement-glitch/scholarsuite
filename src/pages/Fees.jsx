import { useState } from "react";
import { Plus, Loader2, Edit3, Trash2, Receipt } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import { formatTZS, formatDate } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = {
  school_id: null,
  student_id: null,
  invoice_no: "",
  fee_type: "tuition",
  amount: 0,
  amount_paid: 0,
  due_date: "",
  status: "pending",
  term: "Term 1",
  academic_year: "2025-2026"
};

export default function Fees() {
  const { t } = useLang();
  const { rows: fees, loading, create, update, remove } = useResource("fees", { orderBy: "created_at" });
  const { rows: schools } = useResource("schools", { orderBy: "name", ascending: true });
  const { rows: students } = useResource("students", { orderBy: "full_name", ascending: true, limit: 500 });
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
    const payload = {
      ...form,
      amount: Number(form.amount) || 0,
      amount_paid: Number(form.amount_paid) || 0,
      due_date: form.due_date || null
    };
    const res = editing ? await update(editing.id, payload) : await create(payload);
    if (res.error) setErr(res.error.message);
    else setModalOpen(false);
    setBusy(false);
  };

  const totalAmount = fees.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + Number(f.amount_paid || 0), 0);
  const totalDue = totalAmount - totalPaid;
  const overdue = fees.filter((f) => f.status === "overdue").length;

  const studentName = (id) => students.find((s) => s.id === id)?.full_name || "—";
  const filtered = fees.filter((r) => (r.invoice_no || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title={t.fees}
        subtitle={`${fees.length} ${t.invoice.toLowerCase()}`}
        actions={
          <button onClick={() => open()} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>
            <Plus className="h-4 w-4" /> {t.generateInvoice}
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: t.total, value: formatTZS(totalAmount), tint: "from-emerald-700 to-emerald-900" },
          { label: t.paid, value: formatTZS(totalPaid), tint: "from-green-600 to-green-800" },
          { label: t.pending, value: formatTZS(totalDue), tint: "from-amber-600 to-amber-800" },
          { label: t.overdue, value: overdue, tint: "from-red-600 to-red-800" }
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 relative overflow-hidden">
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${k.tint} opacity-10`} />
            <p className="text-xs uppercase tracking-wider text-stone-500">{k.label}</p>
            <p className="display text-2xl mt-1" style={{ color: "var(--green-950)" }}>{k.value}</p>
          </div>
        ))}
      </div>

      <Toolbar onSearch={setSearch} />

      <div className="rounded-2xl border border-stone-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t.invoice}</th>
              <th className="px-4 py-3 font-medium">{t.students}</th>
              <th className="px-4 py-3 font-medium">{t.amount}</th>
              <th className="px-4 py-3 font-medium">{t.paid}</th>
              <th className="px-4 py-3 font-medium">{t.date}</th>
              <th className="px-4 py-3 font-medium">{t.status}</th>
              <th className="px-4 py-3 font-medium text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></td></tr> :
             filtered.length === 0 ? <tr><td colSpan={7} className="py-16 text-center text-stone-400">{t.noData}</td></tr> :
             filtered.map((r) => (
               <tr key={r.id} className="hover:bg-stone-50/50">
                 <td className="px-4 py-3 font-mono text-xs">{r.invoice_no || r.id.slice(0, 8)}</td>
                 <td className="px-4 py-3 text-stone-900">{studentName(r.student_id)}</td>
                 <td className="px-4 py-3 font-medium">{formatTZS(r.amount)}</td>
                 <td className="px-4 py-3 text-emerald-700">{formatTZS(r.amount_paid)}</td>
                 <td className="px-4 py-3 text-stone-600">{formatDate(r.due_date)}</td>
                 <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                 <td className="px-4 py-3 text-right">
                   <button onClick={() => open(r)} className="p-1.5 rounded text-stone-500 hover:bg-stone-100 hover:text-emerald-700"><Edit3 className="h-4 w-4" /></button>
                   <button onClick={() => confirm(t.deleteConfirm) && remove(r.id)} className="p-1.5 rounded text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : t.generateInvoice} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t.schoolName}>
              <select className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })} required>
                <option value="">—</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label={t.students}>
              <select className={inputClass} value={form.student_id || ""} onChange={(e) => setForm({ ...form, student_id: e.target.value })} required>
                <option value="">—</option>
                {students.filter((s) => !form.school_id || s.school_id === form.school_id).map((s) => (
                  <option key={s.id} value={s.id}>{s.admission_no} — {s.full_name}</option>
                ))}
              </select>
            </Field>
            <Field label={t.invoice}>
              <input className={inputClass} value={form.invoice_no} onChange={(e) => setForm({ ...form, invoice_no: e.target.value })} />
            </Field>
            <Field label={t.category}>
              <select className={inputClass} value={form.fee_type} onChange={(e) => setForm({ ...form, fee_type: e.target.value })}>
                <option value="tuition">Tuition</option>
                <option value="boarding">Boarding</option>
                <option value="transport">Transport</option>
                <option value="exam">Exam</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label={`${t.amount} (TZS)`}>
              <input required type="number" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label={`${t.paid} (TZS)`}>
              <input type="number" className={inputClass} value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} />
            </Field>
            <Field label={t.date}>
              <input type="date" className={inputClass} value={form.due_date || ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </Field>
            <Field label={t.status}>
              <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="pending">{t.pending}</option>
                <option value="paid">{t.paid}</option>
                <option value="partial">Partial</option>
                <option value="overdue">{t.overdue}</option>
              </select>
            </Field>
            <Field label={t.term}>
              <input className={inputClass} value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} />
            </Field>
            <Field label={t.academicYear}>
              <input className={inputClass} value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} />
            </Field>
          </div>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">{t.cancel}</button>
            <button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
