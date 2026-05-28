import { useState } from "react";
import { Plus, User, Edit3, Trash2, Loader2 } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import { formatDate } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = {
  school_id: null,
  admission_no: "",
  full_name: "",
  gender: "male",
  date_of_birth: "",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
  address: "",
  status: "active"
};

export default function Students() {
  const { t } = useLang();
  const { rows, loading, create, update, remove } = useResource("students", {
    orderBy: "created_at"
  });
  const { rows: schools } = useResource("schools", { orderBy: "name", ascending: true });
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const open = (row = null) => {
    setEditing(row);
    setForm(row ? { ...EMPTY, ...row } : { ...EMPTY, school_id: schools[0]?.id });
    setErr("");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const payload = {
      ...form,
      date_of_birth: form.date_of_birth || null
    };
    const res = editing ? await update(editing.id, payload) : await create(payload);
    if (res.error) setErr(res.error.message);
    else setModalOpen(false);
    setBusy(false);
  };

  const onDelete = async (row) => {
    if (!confirm(t.deleteConfirm)) return;
    await remove(row.id);
  };

  const filtered = rows.filter((r) =>
    [r.full_name, r.admission_no, r.parent_name].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title={t.students}
        subtitle={`${rows.length} ${t.students.toLowerCase()}`}
        actions={
          <button
            onClick={() => open()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--green-950)" }}
          >
            <Plus className="h-4 w-4" /> {t.addNew}
          </button>
        }
      />
      <Toolbar onSearch={setSearch} />

      <div className="rounded-2xl border border-stone-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t.admission}</th>
              <th className="px-4 py-3 font-medium">{t.name}</th>
              <th className="px-4 py-3 font-medium">{t.gender}</th>
              <th className="px-4 py-3 font-medium">{t.parent}</th>
              <th className="px-4 py-3 font-medium">{t.phone}</th>
              <th className="px-4 py-3 font-medium">{t.status}</th>
              <th className="px-4 py-3 font-medium text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-stone-400">{t.noData}</td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-stone-700">{r.admission_no}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        {(r.full_name || "?").slice(0, 1).toUpperCase()}
                      </div>
                      <span className="font-medium text-stone-900">{r.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-700 capitalize">{t[r.gender] || r.gender}</td>
                  <td className="px-4 py-3 text-stone-700">{r.parent_name || "—"}</td>
                  <td className="px-4 py-3 text-stone-700">{r.parent_phone || "—"}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => open(r)} className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-emerald-700">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDelete(r)} className="rounded p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : `${t.addNew} ${t.students}`} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t.schoolName}>
              <select className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })} required>
                <option value="">—</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label={t.admission}>
              <input required className={inputClass} value={form.admission_no} onChange={(e) => setForm({ ...form, admission_no: e.target.value })} />
            </Field>
            <Field label={t.fullName}>
              <input required className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </Field>
            <Field label={t.gender}>
              <select className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="male">{t.male}</option>
                <option value="female">{t.female}</option>
              </select>
            </Field>
            <Field label={t.dob}>
              <input type="date" className={inputClass} value={form.date_of_birth || ""} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </Field>
            <Field label={t.parent}>
              <input className={inputClass} value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
            </Field>
            <Field label={t.phone}>
              <input className={inputClass} value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} />
            </Field>
            <Field label={t.email}>
              <input type="email" className={inputClass} value={form.parent_email} onChange={(e) => setForm({ ...form, parent_email: e.target.value })} />
            </Field>
            <div className="md:col-span-2">
              <Field label={t.address}>
                <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
            </div>
          </div>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-sm">{t.cancel}</button>
            <button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60" style={{ background: "var(--green-950)" }}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
