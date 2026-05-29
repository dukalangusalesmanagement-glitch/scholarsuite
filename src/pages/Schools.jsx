import { useEffect, useState } from "react";
import {
  Plus, Building2, Edit3, Trash2, Loader2, Crown, CheckCircle2,
  UserPlus, Sparkles, ChevronRight, ChevronDown
} from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { supabase } from "../lib/supabase";
import { formatTZS } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY_SCHOOL = {
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

const EMPTY_ADMIN = {
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: ""
};

export default function Schools() {
  const { t, lang } = useLang();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [schoolForm, setSchoolForm] = useState(EMPTY_SCHOOL);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN);
  const [includeAdmin, setIncludeAdmin] = useState(true);
  const [adminSectionOpen, setAdminSectionOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

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
    setSchoolForm(EMPTY_SCHOOL);
    setAdminForm(EMPTY_ADMIN);
    setIncludeAdmin(true);
    setAdminSectionOpen(true);
    setErr("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setSchoolForm({ ...EMPTY_SCHOOL, ...row });
    setIncludeAdmin(false); // Don't create admin when editing
    setErr("");
    setSuccess("");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setSuccess("");

    try {
      // 1) Create or update the school
      const slug =
        schoolForm.slug || schoolForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const schoolPayload = {
        ...schoolForm,
        slug,
        monthly_fee: Number(schoolForm.monthly_fee) || 0,
        student_count: Number(schoolForm.student_count) || 0
      };

      let school;
      if (editing) {
        const { data, error } = await supabase
          .from("schools")
          .update(schoolPayload)
          .eq("id", editing.id)
          .select()
          .single();
        if (error) {
          setErr((lang === "sw" ? "Shule: " : "School: ") + error.message);
          setSaving(false);
          return;
        }
        school = data;
      } else {
        const { data, error } = await supabase
          .from("schools")
          .insert(schoolPayload)
          .select()
          .single();
        if (error) {
          setErr((lang === "sw" ? "Shule: " : "School: ") + error.message);
          setSaving(false);
          return;
        }
        school = data;
      }

      // 2) If new school and admin included, create the Pro Admin
      if (!editing && includeAdmin && adminForm.email && adminForm.password) {
        const fullName = [adminForm.first_name, adminForm.middle_name, adminForm.last_name]
          .filter(Boolean)
          .join(" ");
        const { error: signupErr } = await supabase.auth.signUp({
          email: adminForm.email,
          password: adminForm.password,
          options: {
            data: {
              first_name: adminForm.first_name,
              middle_name: adminForm.middle_name,
              last_name: adminForm.last_name,
              full_name: fullName,
              phone: adminForm.phone,
              role: "head_teacher",
              school_id: school.id
            }
          }
        });

        if (signupErr) {
          setErr(
            (lang === "sw"
              ? "Shule imeundwa lakini Pro Admin imeshindwa: "
              : "School created but Pro Admin failed: ") + signupErr.message
          );
          load();
          setSaving(false);
          return;
        }

        setSuccess(
          lang === "sw"
            ? `✅ Shule "${school.name}" imesajiliwa pamoja na Pro Admin (${fullName}). Email ya uthibitishaji imetumwa.`
            : `✅ School "${school.name}" registered with Pro Admin (${fullName}). Confirmation email sent.`
        );
      } else {
        setSuccess(
          lang === "sw"
            ? `✅ Shule "${school.name}" imehifadhiwa.`
            : `✅ School "${school.name}" saved.`
        );
      }

      setTimeout(() => {
        setModalOpen(false);
        load();
      }, 1800);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!confirm(t.deleteConfirm)) return;
    const { error } = await supabase.from("schools").delete().eq("id", row.id);
    if (!error) load();
  };

  const filtered = rows.filter((r) =>
    [r.name, r.director_name, r.email, r.region]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
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
                <th className="px-4 py-3 font-medium">{t.monthlyRevenue}</th>
                <th className="px-4 py-3 font-medium">{t.status}</th>
                <th className="px-4 py-3 font-medium text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-400">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-400">
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
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {formatTZS(r.monthly_fee)}
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
        size="xl"
      >
        <form onSubmit={save} className="space-y-5">
          {/* SCHOOL DETAILS SECTION */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--green-100)", color: "var(--green-800)" }}
              >
                <Building2 className="h-4 w-4" />
              </div>
              <h3 className="display text-xl" style={{ color: "var(--green-950)" }}>
                {lang === "sw" ? "Maelezo ya Shule" : "School Details"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t.schoolName}>
                <input
                  required
                  className={inputClass}
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                />
              </Field>
              <Field label={t.directorName}>
                <input
                  className={inputClass}
                  value={schoolForm.director_name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, director_name: e.target.value })}
                />
              </Field>
              <Field label={t.email}>
                <input
                  type="email"
                  className={inputClass}
                  value={schoolForm.email}
                  onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                />
              </Field>
              <Field label={t.phone}>
                <input
                  className={inputClass}
                  value={schoolForm.phone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                />
              </Field>
              <Field label={t.address}>
                <input
                  className={inputClass}
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                />
              </Field>
              <Field label="Region">
                <input
                  className={inputClass}
                  value={schoolForm.region}
                  onChange={(e) => setSchoolForm({ ...schoolForm, region: e.target.value })}
                />
              </Field>
              <Field label={t.subscriptionPlan}>
                <select
                  className={inputClass}
                  value={schoolForm.plan}
                  onChange={(e) => setSchoolForm({ ...schoolForm, plan: e.target.value })}
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
                  value={schoolForm.status}
                  onChange={(e) => setSchoolForm({ ...schoolForm, status: e.target.value })}
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
                  value={schoolForm.monthly_fee}
                  onChange={(e) => setSchoolForm({ ...schoolForm, monthly_fee: e.target.value })}
                />
              </Field>
              <Field label={t.activeStudents}>
                <input
                  type="number"
                  className={inputClass}
                  value={schoolForm.student_count}
                  onChange={(e) => setSchoolForm({ ...schoolForm, student_count: e.target.value })}
                />
              </Field>
            </div>
          </div>

          {/* PRO ADMIN SECTION (only when creating new) */}
          {!editing && (
            <div className="border-t border-stone-200 pt-5">
              <button
                type="button"
                onClick={() => setAdminSectionOpen(!adminSectionOpen)}
                className="w-full flex items-center justify-between mb-3 group"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
                  >
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="display text-xl" style={{ color: "var(--green-950)" }}>
                    {lang === "sw" ? "Pro Admin wa Shule" : "School Pro Admin"}
                  </h3>
                  <span
                    className="ml-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold"
                    style={{ background: "#fef3c7", color: "#92400e" }}
                  >
                    PRO
                  </span>
                </div>
                {adminSectionOpen ? (
                  <ChevronDown className="h-4 w-4 text-stone-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-stone-400" />
                )}
              </button>

              {adminSectionOpen && (
                <>
                  <div className="rounded-xl p-4 mb-4 flex items-start gap-3"
                    style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)" }}>
                    <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "var(--green-700)" }} />
                    <div className="text-xs">
                      <p className="font-medium mb-1" style={{ color: "var(--green-950)" }}>
                        {lang === "sw" ? "Pro Admin (Mwalimu Mkuu)" : "Pro Admin (Head Teacher)"}
                      </p>
                      <p className="text-stone-600 leading-relaxed">
                        {lang === "sw"
                          ? "Ana ruhusa kamili ya kusimamia shule yake — kusajili walimu, wanafunzi, kuweka mahudhurio, mitihani, ada, na vyote. Atapata email ya uthibitishaji baada ya kusajiliwa."
                          : "Has full permissions to manage their school — register teachers, students, mark attendance, exams, fees, and everything. Will receive a confirmation email after registration."}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAdmin}
                      onChange={(e) => setIncludeAdmin(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="text-sm text-stone-700">
                      {lang === "sw"
                        ? "Tengeneza akaunti ya Pro Admin sasa hivi"
                        : "Create Pro Admin account now"}
                    </span>
                  </label>

                  {includeAdmin && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Field label={lang === "sw" ? "Jina la kwanza" : "First name"}>
                          <input
                            required={includeAdmin}
                            className={inputClass}
                            value={adminForm.first_name}
                            onChange={(e) => setAdminForm({ ...adminForm, first_name: e.target.value })}
                          />
                        </Field>
                        <Field label={lang === "sw" ? "Jina la kati" : "Middle name"}>
                          <input
                            className={inputClass}
                            value={adminForm.middle_name}
                            onChange={(e) => setAdminForm({ ...adminForm, middle_name: e.target.value })}
                          />
                        </Field>
                        <Field label={lang === "sw" ? "Jina la mwisho" : "Last name"}>
                          <input
                            required={includeAdmin}
                            className={inputClass}
                            value={adminForm.last_name}
                            onChange={(e) => setAdminForm({ ...adminForm, last_name: e.target.value })}
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field label={lang === "sw" ? "Barua pepe ya Pro Admin" : "Pro Admin Email"}>
                          <input
                            required={includeAdmin}
                            type="email"
                            className={inputClass}
                            value={adminForm.email}
                            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                            placeholder="admin@school.ac.tz"
                          />
                        </Field>
                        <Field label={lang === "sw" ? "Namba ya simu" : "Phone number"}>
                          <input
                            required={includeAdmin}
                            className={inputClass}
                            value={adminForm.phone}
                            onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                            placeholder="+255 7XX XXX XXX"
                          />
                        </Field>
                      </div>
                      <Field
                        label={lang === "sw" ? "Nenosiri" : "Password"}
                        hint={
                          lang === "sw"
                            ? "Angalau herufi 6. Pro Admin anaweza kubadilisha baadaye."
                            : "At least 6 characters. Pro Admin can change later."
                        }
                      >
                        <input
                          required={includeAdmin}
                          minLength={6}
                          type="password"
                          className={inputClass}
                          value={adminForm.password}
                          onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        />
                      </Field>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {err && (
            <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{err}</div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
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
              className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--green-950)" }}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {!editing && includeAdmin ? <UserPlus className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                  {editing
                    ? t.save
                    : includeAdmin
                    ? lang === "sw"
                      ? "Sajili Shule + Pro Admin"
                      : "Register School + Pro Admin"
                    : lang === "sw"
                    ? "Sajili Shule"
                    : "Register School"}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
