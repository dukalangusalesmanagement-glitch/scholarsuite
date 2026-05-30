import { useEffect, useState } from "react";
import {
  Plus, Building2, Edit3, Trash2, Loader2, Crown, CheckCircle2,
  UserPlus, Sparkles, Phone, Mail, MapPin, Layers, Users,
  CreditCard, Award, Star, Zap, Lock, AlertCircle, User
} from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { supabase } from "../lib/supabase";
import { formatTZS } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";

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
  monthly_fee: 500000,
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

const PLAN_DETAILS = {
  basic:      { fee: 500000,  icon: Layers, color: "#94a3b8", grad: "from-slate-400 to-slate-600", swText: "Msingi", enText: "Basic" },
  standard:   { fee: 1200000, icon: Award,  color: "#5eead4", grad: "from-teal-400 to-teal-600",   swText: "Wastani", enText: "Standard" },
  premium:    { fee: 2500000, icon: Star,   color: "#16a34a", grad: "from-emerald-500 to-emerald-700", swText: "Bora",  enText: "Premium" },
  enterprise: { fee: 4800000, icon: Crown,  color: "#064e3b", grad: "from-emerald-800 to-emerald-950", swText: "Biashara", enText: "Enterprise" }
};

const STATUS_OPTIONS = {
  trial:    { color: "bg-amber-100 text-amber-800 ring-amber-200",     dot: "bg-amber-500",   swText: "Jaribio",  enText: "Trial" },
  active:   { color: "bg-emerald-100 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500", swText: "Hai",     enText: "Active" },
  inactive: { color: "bg-stone-100 text-stone-700 ring-stone-200",      dot: "bg-stone-400",   swText: "Imezimwa", enText: "Inactive" },
  expired:  { color: "bg-red-100 text-red-800 ring-red-200",           dot: "bg-red-500",     swText: "Imeisha",  enText: "Expired" }
};

const INPUT_BASE =
  "w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";
const INPUT_WITH_ICON =
  "w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

function SectionCard({ icon: Icon, title, subtitle, badge, badgeColor, accent, children }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
      <div
        className="px-5 py-4 border-b border-stone-100"
        style={{
          background: accent || "linear-gradient(to bottom right, #fafaf9, #ffffff)"
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--green-100)", color: "var(--green-800)" }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="display text-lg" style={{ color: "var(--green-950)" }}>
                {title}
              </h3>
              {badge && (
                <span
                  className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold"
                  style={{
                    background: badgeColor?.bg || "#fef3c7",
                    color: badgeColor?.text || "#92400e"
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <div className="mb-1.5">
      <span className="block text-xs font-medium uppercase tracking-wider text-stone-600">{children}</span>
      {hint && <span className="block text-[10px] text-stone-400 mt-0.5">{hint}</span>}
    </div>
  );
}

function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 pointer-events-none" />
      <input {...props} className={INPUT_WITH_ICON} />
    </div>
  );
}

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

  // Auto-slug from name
  useEffect(() => {
    if (!editing && schoolForm.name) {
      const slug = schoolForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setSchoolForm((f) => ({ ...f, slug }));
    }
  }, [schoolForm.name, editing]);

  const openCreate = () => {
    setEditing(null);
    setSchoolForm(EMPTY_SCHOOL);
    setAdminForm(EMPTY_ADMIN);
    setIncludeAdmin(true);
    setErr("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setSchoolForm({ ...EMPTY_SCHOOL, ...row });
    setIncludeAdmin(false);
    setErr("");
    setSuccess("");
    setModalOpen(true);
  };

  const selectPlan = (plan) => {
    setSchoolForm({
      ...schoolForm,
      plan,
      monthly_fee: PLAN_DETAILS[plan]?.fee || schoolForm.monthly_fee
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setSuccess("");

    try {
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
            ? `Shule "${school.name}" imesajiliwa pamoja na Pro Admin ${fullName}. Email ya uthibitishaji imetumwa.`
            : `School "${school.name}" registered with Pro Admin ${fullName}. Confirmation email sent.`
        );
      } else {
        setSuccess(
          lang === "sw" ? `Shule "${school.name}" imehifadhiwa.` : `School "${school.name}" saved.`
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
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: "var(--green-700)" }}>
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
                    <td className="px-4 py-3"><span className="capitalize text-stone-700">{t[r.plan] || r.plan}</span></td>
                    <td className="px-4 py-3 text-stone-700">{(r.student_count || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-stone-900">{formatTZS(r.monthly_fee)}</td>
                    <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => openEdit(r)} className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-emerald-700"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => remove(r)} className="rounded p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== MODERN REGISTRATION MODAL ====== */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : t.registerSchool} size="xl">
        <form onSubmit={save} className="space-y-4">

          {/* Intro banner */}
          {!editing && (
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)" }}>
              <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "var(--green-700)" }} />
              <div className="text-xs">
                <p className="font-medium" style={{ color: "var(--green-950)" }}>
                  {lang === "sw" ? "Sajili shule + Pro Admin kwa hatua moja" : "Register school + Pro Admin in one step"}
                </p>
                <p className="text-stone-600 mt-0.5">
                  {lang === "sw"
                    ? "Jaza maelezo ya shule kisha unaweza pia kutengeneza akaunti ya Pro Admin (Mwalimu Mkuu)."
                    : "Fill school details then optionally create the Pro Admin (Head Teacher) account."}
                </p>
              </div>
            </div>
          )}

          {/* ── Section 1: Basic Info ── */}
          <SectionCard
            icon={Building2}
            title={lang === "sw" ? "Maelezo ya Msingi" : "Basic Information"}
            subtitle={lang === "sw" ? "Jina la shule na mkurugenzi" : "School name and director"}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <FieldLabel hint={schoolForm.slug ? `slug: ${schoolForm.slug}` : null}>
                  {t.schoolName} *
                </FieldLabel>
                <IconInput
                  icon={Building2}
                  required
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  placeholder={lang === "sw" ? "Mwenge Secondary School" : "Mwenge Secondary School"}
                />
              </div>
              <div>
                <FieldLabel>{t.directorName}</FieldLabel>
                <IconInput
                  icon={User}
                  value={schoolForm.director_name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, director_name: e.target.value })}
                  placeholder={lang === "sw" ? "Dr. Joseph Mwakasege" : "Dr. Joseph Mwakasege"}
                />
              </div>
            </div>
          </SectionCard>

          {/* ── Section 2: Contact ── */}
          <SectionCard
            icon={Phone}
            title={lang === "sw" ? "Mawasiliano" : "Contact Information"}
            subtitle={lang === "sw" ? "Barua pepe, simu, anwani" : "Email, phone, address"}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <FieldLabel>{t.email}</FieldLabel>
                <IconInput
                  icon={Mail}
                  type="email"
                  value={schoolForm.email}
                  onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                  placeholder="info@school.ac.tz"
                />
              </div>
              <div>
                <FieldLabel>{t.phone}</FieldLabel>
                <IconInput
                  icon={Phone}
                  value={schoolForm.phone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                  placeholder="+255 7XX XXX XXX"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>{t.address}</FieldLabel>
                <IconInput
                  icon={MapPin}
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                  placeholder={lang === "sw" ? "Mwenge Road, Kinondoni" : "Mwenge Road, Kinondoni"}
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>{lang === "sw" ? "Mkoa" : "Region"}</FieldLabel>
                <IconInput
                  icon={MapPin}
                  value={schoolForm.region}
                  onChange={(e) => setSchoolForm({ ...schoolForm, region: e.target.value })}
                  placeholder={lang === "sw" ? "Dar es Salaam" : "Dar es Salaam"}
                />
              </div>
            </div>
          </SectionCard>

          {/* ── Section 3: Plan (visual cards) ── */}
          <SectionCard
            icon={CreditCard}
            title={lang === "sw" ? "Mpango wa Usajili" : "Subscription Plan"}
            subtitle={lang === "sw" ? "Chagua mpango unaofaa shule" : "Choose the plan that fits the school"}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {Object.entries(PLAN_DETAILS).map(([key, plan]) => {
                const PlanIcon = plan.icon;
                const selected = schoolForm.plan === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectPlan(key)}
                    className={`relative rounded-xl border-2 p-3 text-left transition ${
                      selected
                        ? "border-emerald-700 shadow-sm"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                    style={selected ? { background: "linear-gradient(135deg, #ecfdf5, #ffffff)" } : {}}
                  >
                    {selected && (
                      <CheckCircle2 className="absolute top-1.5 right-1.5 h-4 w-4" style={{ color: "var(--green-700)" }} />
                    )}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 bg-gradient-to-br ${plan.grad}`}
                    >
                      <PlanIcon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-stone-500">
                      {lang === "sw" ? plan.swText : plan.enText}
                    </p>
                    <p className="font-medium text-sm mt-0.5" style={{ color: "var(--green-950)" }}>
                      {(plan.fee / 1000).toLocaleString()}K
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5">TZS / mo</p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <FieldLabel>{lang === "sw" ? "Hali ya Usajili" : "Subscription Status"}</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(STATUS_OPTIONS).map(([key, st]) => {
                    const selected = schoolForm.status === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSchoolForm({ ...schoolForm, status: key })}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                          selected
                            ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                            : "border-stone-200 text-stone-600 hover:border-stone-300"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {lang === "sw" ? st.swText : st.enText}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <FieldLabel hint={lang === "sw" ? "Ada ya kila mwezi" : "Per month"}>
                  {lang === "sw" ? "Ada ya Mwezi (TZS)" : "Monthly Fee (TZS)"}
                </FieldLabel>
                <input
                  type="number"
                  className={INPUT_BASE}
                  value={schoolForm.monthly_fee}
                  onChange={(e) => setSchoolForm({ ...schoolForm, monthly_fee: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel hint={lang === "sw" ? "Idadi ya wanafunzi sasa" : "Current student count"}>
                  {lang === "sw" ? "Wanafunzi" : "Students"}
                </FieldLabel>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <input
                    type="number"
                    className={INPUT_WITH_ICON}
                    value={schoolForm.student_count}
                    onChange={(e) => setSchoolForm({ ...schoolForm, student_count: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── Section 4: Pro Admin (only on create) ── */}
          {!editing && (
            <SectionCard
              icon={Crown}
              title={lang === "sw" ? "Pro Admin wa Shule" : "School Pro Admin"}
              subtitle={lang === "sw" ? "Mwalimu Mkuu — msimamizi mkuu wa shule" : "Head Teacher — main school administrator"}
              badge="PRO"
              badgeColor={{ bg: "#fef3c7", text: "#92400e" }}
              accent="linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #ffffff 100%)"
            >
              <label className="flex items-start gap-3 mb-4 p-3 rounded-lg bg-stone-50 cursor-pointer hover:bg-stone-100 transition">
                <input
                  type="checkbox"
                  checked={includeAdmin}
                  onChange={(e) => setIncludeAdmin(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
                />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--green-950)" }}>
                    {lang === "sw" ? "Tengeneza akaunti ya Pro Admin sasa" : "Create Pro Admin account now"}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {lang === "sw"
                      ? "Atapata permissions kamili kusimamia shule yake — wanafunzi, walimu, ada, mitihani, n.k."
                      : "Will have full permissions to manage the school — students, staff, fees, exams, etc."}
                  </p>
                </div>
              </label>

              {includeAdmin && (
                <div className="space-y-3 animate-in">
                  <div>
                    <FieldLabel hint={lang === "sw" ? "Majina yote matatu" : "All three names"}>
                      {lang === "sw" ? "Jina kamili" : "Full Name"} *
                    </FieldLabel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        required={includeAdmin}
                        className={INPUT_BASE}
                        placeholder={lang === "sw" ? "Jina la kwanza" : "First name"}
                        value={adminForm.first_name}
                        onChange={(e) => setAdminForm({ ...adminForm, first_name: e.target.value })}
                      />
                      <input
                        className={INPUT_BASE}
                        placeholder={lang === "sw" ? "Jina la kati" : "Middle name"}
                        value={adminForm.middle_name}
                        onChange={(e) => setAdminForm({ ...adminForm, middle_name: e.target.value })}
                      />
                      <input
                        required={includeAdmin}
                        className={INPUT_BASE}
                        placeholder={lang === "sw" ? "Jina la mwisho" : "Last name"}
                        value={adminForm.last_name}
                        onChange={(e) => setAdminForm({ ...adminForm, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <FieldLabel hint={lang === "sw" ? "Atatumia kuingia" : "Used to sign in"}>
                        {lang === "sw" ? "Barua pepe" : "Email"} *
                      </FieldLabel>
                      <IconInput
                        icon={Mail}
                        required={includeAdmin}
                        type="email"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        placeholder="admin@school.ac.tz"
                      />
                    </div>
                    <div>
                      <FieldLabel>{lang === "sw" ? "Namba ya simu" : "Phone number"} *</FieldLabel>
                      <IconInput
                        icon={Phone}
                        required={includeAdmin}
                        value={adminForm.phone}
                        onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                        placeholder="+255 7XX XXX XXX"
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel hint={lang === "sw" ? "Angalau herufi 6 — Pro Admin anaweza kubadilisha baadaye" : "At least 6 chars — can be changed later"}>
                      {lang === "sw" ? "Nenosiri" : "Password"} *
                    </FieldLabel>
                    <IconInput
                      icon={Lock}
                      required={includeAdmin}
                      minLength={6}
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* Feedback */}
          {err && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2 border border-red-100">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{err}</span>
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-2 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-stone-200 px-5 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:shadow disabled:opacity-60 transition"
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
