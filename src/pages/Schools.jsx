import { useEffect, useState } from "react";
import { Plus, Building2, Edit3, Trash2, Loader2, MoreVertical } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { supabase } from "../lib/supabase";
import { formatTZS, formatDate } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = {
  name: "",
  slug: "",
  director_name: "",
  email: "",
  phone: "",
  address: "",
  region: "",
  plan: "basic",
  status: "trial",
  monthly_fee: 0,
  student_count: 0
};

export default function Schools() {
  const { t } = useLang();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErr("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ ...EMPTY, ...row });
    setErr("");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    const payload = {
      ...form,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      monthly_fee: Number(form.monthly_fee) || 0,
      student_count: Number(form.student_count) || 0
    };
    let res;
    if (editing) {
      res = await supabase.from("schools").update(payload).eq("id", editing.id).select().single();
    } else {
      res = await supabase.from("schools").insert(payload).select().single();
    }
    if (res.error) {
      setErr(res.error.message);
    } else {
      setModalOpen(false);
      load();
    }
    setSaving(false);
  };

  const remove = async (row) => {
    if (!confirm(t.deleteConfirm)) return;
    const { error } = await supabase.from("schools").delete().eq("id", row.id);
    if (!error) load();
  };

  const filtered = rows.filter((r) =>
    [r.name, r.director_name, r.email, r.region].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title={t.schools}
        subtitle={`${rows.length} ${t.schools.toLowerCase()}`}
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            style={{ background: "var(--green-950)" }}
          >
            <Plus className="h-4 w-4" /> {t.registerSchool}
          </button>
        }
      />

      <Toolbar onSearch={setSearch} />

      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">{t.schoolName}</th>
                <th className="px-4 py-3 font-medium">{t.director}</th>
                <th className="px-4 py-3 font-medium">{t.phone}</th>
                <th className="px-4 py-3 font-medium">{t.plan}</th>
                <th className="px-4 py-3 font-medium">{t.students}</th>
                <th className="px-4 py-3 font-medium">{t.status}</th>
                <th className="px-4 py-3 font-medium text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-400">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-400">
                    {t.noData}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                          style={{ background: "var(--green-700)" }}
                        >
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{r.name}</p>
                          <p className="text-xs text-stone-500">{r.region}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-700">{r.director_name || "—"}</td>
                    <td className="px-4 py-3 text-stone-700">{r.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-stone-700">{t[r.plan] || r.plan}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-700">
                      {(r.student_count || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => openEdit(r)}
                          className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-emerald-700"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(r)}
                          className="rounded p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-600"
                        >
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
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t.edit : t.registerSchool}
        size="lg"
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t.schoolName}>
              <input
                required
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label={t.directorName}>
              <input
                className={inputClass}
                value={form.director_name}
                onChange={(e) => setForm({ ...form, director_name: e.target.value })}
              />
            </Field>
            <Field label={t.email}>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label={t.phone}>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label={t.address}>
              <input
                className={inputClass}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
            <Field label="Region">
              <input
                className={inputClass}
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />
            </Field>
            <Field label={t.subscriptionPlan}>
              <select
                className={inputClass}
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
              >
                <option value="basic">{t.basic}</option>
                <option value="standard">{t.standard}</option>
                <option value="premium">{t.premium}</option>
                <option value="enterprise">{t.enterprise}</option>
              </select>
            </Field>
            <Field label={t.status}>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="trial">{t.trial}</option>
                <option value="active">{t.active}</option>
                <option value="inactive">{t.inactive}</option>
                <option value="expired">{t.expired}</option>
              </select>
            </Field>
            <Field label={`${t.monthlyRevenue} (TZS)`}>
              <input
                type="number"
                className={inputClass}
                value={form.monthly_fee}
                onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })}
              />
            </Field>
            <Field label={t.activeStudents}>
              <input
                type="number"
                className={inputClass}
                value={form.student_count}
                onChange={(e) => setForm({ ...form, student_count: e.target.value })}
              />
            </Field>
          </div>

          {err && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--green-950)" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
