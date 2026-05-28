import { useState } from "react";
import { Plus, Loader2, UserCog, Mail, Phone, Shield } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useResource } from "../hooks/useResource";
import { getRoleLabel, getCreatableRoles } from "../lib/permissions";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import Modal from "../components/Modal";
import Field, { inputClass } from "../components/Field";

const EMPTY = {
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "subject_teacher",
  password: "",
  school_id: ""
};

const ROLE_BADGE_COLOR = {
  super_admin: "bg-purple-100 text-purple-800",
  school_director: "bg-indigo-100 text-indigo-800",
  head_teacher: "bg-emerald-100 text-emerald-800",
  academic_master: "bg-emerald-50 text-emerald-700",
  accountant: "bg-amber-100 text-amber-800",
  subject_teacher: "bg-blue-100 text-blue-800",
  class_teacher: "bg-blue-50 text-blue-700",
  librarian: "bg-orange-100 text-orange-800",
  hostel_manager: "bg-pink-100 text-pink-800",
  transport_manager: "bg-yellow-100 text-yellow-800",
  secretary: "bg-stone-100 text-stone-700",
  receptionist: "bg-stone-100 text-stone-700",
  nurse: "bg-red-100 text-red-800",
  store_keeper: "bg-gray-100 text-gray-800",
  security_supervisor: "bg-slate-100 text-slate-800",
  hr_officer: "bg-teal-100 text-teal-800"
};

export default function Staff() {
  const { t, lang } = useLang();
  const { profile, isSuperAdmin } = useAuth();
  const { rows: schools } = useResource("schools", { orderBy: "name", ascending: true });
  const {
    rows: staff,
    loading,
    reload,
    remove
  } = useResource("profiles", { orderBy: "created_at" });

  // Filter staff by school (for non-super-admins)
  const scopedStaff = isSuperAdmin
    ? staff
    : staff.filter((s) => s.school_id === profile?.school_id);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  // Roles current user can create
  const creatableRoles = getCreatableRoles(profile?.role);

  const open = () => {
    setForm({
      ...EMPTY,
      role: creatableRoles[0] || "subject_teacher",
      school_id: isSuperAdmin ? schools[0]?.id || "" : profile?.school_id || ""
    });
    setErr("");
    setSuccess("");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setSuccess("");

    try {
      const fullName = [form.first_name, form.middle_name, form.last_name]
        .filter(Boolean)
        .join(" ");

      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.first_name,
            middle_name: form.middle_name,
            last_name: form.last_name,
            full_name: fullName,
            phone: form.phone,
            role: form.role,
            school_id: form.school_id || null
          }
        }
      });

      if (error) {
        setErr(error.message);
      } else {
        setSuccess(
          lang === "sw"
            ? `✅ Akaunti ya ${fullName} imeundwa. Atapata email ya uthibitishaji.`
            : `✅ Account for ${fullName} created. They will receive a confirmation email.`
        );
        setForm({ ...EMPTY, role: form.role, school_id: form.school_id });
        setTimeout(() => {
          reload();
        }, 1000);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (s) => {
    if (s.id === profile?.id) {
      alert(lang === "sw" ? "Huwezi kufuta akaunti yako mwenyewe" : "Cannot delete your own account");
      return;
    }
    if (!confirm(t.deleteConfirm)) return;
    await remove(s.id);
  };

  const filtered = scopedStaff.filter((s) =>
    [s.full_name, s.email, s.role, s.phone]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Group by role for nice display
  const byRole = filtered.reduce((acc, s) => {
    const r = s.role || "school_admin";
    if (!acc[r]) acc[r] = [];
    acc[r].push(s);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title={lang === "sw" ? "Wafanyakazi" : "Staff"}
        subtitle={`${scopedStaff.length} ${lang === "sw" ? "watumiaji" : "users"}`}
        actions={
          creatableRoles.length > 0 ? (
            <button
              onClick={open}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: "var(--green-950)" }}
            >
              <Plus className="h-4 w-4" />{" "}
              {lang === "sw" ? "Sajili Mfanyakazi" : "Register Staff"}
            </button>
          ) : null
        }
      />
      <Toolbar onSearch={setSearch} />

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-stone-400">{t.noData}</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byRole).map(([role, members]) => (
            <div key={role}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-emerald-700" />
                <h3 className="display text-xl" style={{ color: "var(--green-950)" }}>
                  {getRoleLabel(role, lang)}
                </h3>
                <span className="text-xs text-stone-500">({members.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4 hover:border-emerald-700 transition group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ background: "var(--green-700)" }}
                      >
                        {(s.full_name || s.email || "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-stone-900 truncate text-sm">
                          {s.full_name || s.email}
                        </h4>
                        <span
                          className={`inline-block mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
                            ROLE_BADGE_COLOR[s.role] || "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {getRoleLabel(s.role, lang)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-stone-600">
                      {s.email && (
                        <p className="flex items-center gap-2 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />{" "}
                          <span className="truncate">{s.email}</span>
                        </p>
                      )}
                      {s.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-3 w-3 flex-shrink-0" /> {s.phone}
                        </p>
                      )}
                    </div>
                    {s.id !== profile?.id && (
                      <button
                        onClick={() => onDelete(s)}
                        className="opacity-0 group-hover:opacity-100 transition mt-3 text-xs text-red-600 hover:underline"
                      >
                        {t.delete}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={lang === "sw" ? "Sajili Mfanyakazi Mpya" : "Register New Staff"}
        size="lg"
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label={lang === "sw" ? "Jina la kwanza" : "First name"}>
              <input
                required
                className={inputClass}
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </Field>
            <Field label={lang === "sw" ? "Jina la kati" : "Middle name"}>
              <input
                className={inputClass}
                value={form.middle_name}
                onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
              />
            </Field>
            <Field label={lang === "sw" ? "Jina la mwisho" : "Last name"}>
              <input
                required
                className={inputClass}
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={lang === "sw" ? "Barua pepe" : "Email"}>
              <input
                required
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label={lang === "sw" ? "Namba ya simu" : "Phone number"}>
              <input
                required
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+255 7XX XXX XXX"
              />
            </Field>
          </div>

          <Field label={lang === "sw" ? "Cheo / Wadhifa" : "Role / Position"}>
            <select
              required
              className={inputClass}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {creatableRoles.map((r) => (
                <option key={r} value={r}>
                  {getRoleLabel(r, lang)}
                </option>
              ))}
            </select>
          </Field>

          {isSuperAdmin && (
            <Field label={t.schoolName}>
              <select
                required
                className={inputClass}
                value={form.school_id}
                onChange={(e) => setForm({ ...form, school_id: e.target.value })}
              >
                <option value="">—</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field
            label={lang === "sw" ? "Nenosiri la kuanzia" : "Initial password"}
            hint={lang === "sw" ? "Angalau herufi 6 — mfanyakazi anaweza kubadilisha baadaye" : "At least 6 characters — staff can change later"}
          >
            <input
              required
              minLength={6}
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>

          {err && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--green-950)" }}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserCog className="h-4 w-4" />
                  {lang === "sw" ? "Sajili" : "Register"}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
