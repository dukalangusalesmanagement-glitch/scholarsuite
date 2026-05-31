import { useEffect, useState } from "react";
import {
  Plus, Building2, Edit3, Trash2, Loader2, Crown, CheckCircle2,
  UserPlus, Sparkles, Phone, Mail, MapPin, Layers, Users,
  CreditCard, Award, Star, Lock, AlertCircle, User,
  ArrowRight, ArrowLeft, Check
} from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { supabase } from "../lib/supabase";
import { formatTZS } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Toolbar from "../components/Toolbar";
import StatusPill from "../components/StatusPill";
import Modal from "../components/Modal";

const EMPTY_SCHOOL = {
  name: "", slug: "", director_name: "", email: "", phone: "",
  address: "", region: "", plan: "basic", status: "trial",
  monthly_fee: 500000, student_count: 0
};

const EMPTY_ADMIN = {
  first_name: "", middle_name: "", last_name: "",
  email: "", phone: "", password: ""
};

const PLAN_DETAILS = {
  basic:      { fee: 500000,  icon: Layers, grad: "from-slate-400 to-slate-600",   swText: "Msingi",   enText: "Basic" },
  standard:   { fee: 1200000, icon: Award,  grad: "from-teal-400 to-teal-600",     swText: "Wastani",  enText: "Standard" },
  premium:    { fee: 2500000, icon: Star,   grad: "from-emerald-500 to-emerald-700", swText: "Bora",   enText: "Premium" },
  enterprise: { fee: 4800000, icon: Crown,  grad: "from-emerald-800 to-emerald-950", swText: "Biashara", enText: "Enterprise" }
};

const STATUS_OPTIONS = {
  trial:    { dot: "bg-amber-500",   swText: "Jaribio",  enText: "Trial" },
  active:   { dot: "bg-emerald-500", swText: "Hai",      enText: "Active" },
  inactive: { dot: "bg-stone-400",   swText: "Imezimwa", enText: "Inactive" },
  expired:  { dot: "bg-red-500",     swText: "Imeisha",  enText: "Expired" }
};

const INPUT_BASE = "w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";
const INPUT_WITH_ICON = "w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

function SectionCard({ icon: Icon, title, subtitle, accent, children }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-stone-100" style={{ background: accent || "linear-gradient(to bottom right, #fafaf9, #ffffff)" }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--green-100)", color: "var(--green-800)" }}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="display text-base" style={{ color: "var(--green-950)" }}>{title}</h3>
            {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
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

function StepIndicator({ step, lang }) {
  const steps = [
    { num: 1, label: lang === "sw" ? "Maelezo ya Shule" : "School Details", icon: Building2 },
    { num: 2, label: lang === "sw" ? "Pro Admin" : "Pro Admin", icon: Crown }
  ];

  return (
    <div className="flex items-center mb-6 px-2">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = step > s.num;
        const active = step === s.num;
        return (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center transition ${
                  done ? "bg-emerald-700 text-white" :
                  active ? "ring-4 ring-emerald-100" :
                  "bg-stone-100 text-stone-400"
                }`}
                style={active ? { background: "var(--green-700)", color: "white" } : {}}
              >
                {done ? <Check className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <p className={`text-[11px] uppercase tracking-wider mt-1.5 ${active || done ? "font-semibold" : "text-stone-400"}`} style={(active || done) ? { color: "var(--green-950)" } : {}}>
                {s.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 -mt-5 transition" style={{ background: step > s.num ? "var(--green-700)" : "#e7e5e4" }} />
            )}
          </div>
        );
      })}
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

  // Wizard state
  const [step, setStep] = useState(1);
  const [schoolForm, setSchoolForm] = useState(EMPTY_SCHOOL);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN);
  const [includeAdmin, setIncludeAdmin] = useState(true);
  const [createdSchool, setCreatedSchool] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("schools").select("*").order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Auto-slug
  useEffect(() => {
    if (!editing && schoolForm.name) {
      const slug = schoolForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setSchoolForm((f) => ({ ...f, slug }));
    }
  }, [schoolForm.name, editing]);

  const openCreate = () => {
    setEditing(null);
    setStep(1);
    setSchoolForm(EMPTY_SCHOOL);
    setAdminForm(EMPTY_ADMIN);
    setIncludeAdmin(true);
    setCreatedSchool(null);
    setErr(""); setSuccess("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setStep(1);
    setSchoolForm({ ...EMPTY_SCHOOL, ...row });
    setIncludeAdmin(false);
    setErr(""); setSuccess("");
    setModalOpen(true);
  };

  const selectPlan = (plan) => {
    setSchoolForm({ ...schoolForm, plan, monthly_fee: PLAN_DETAILS[plan]?.fee || schoolForm.monthly_fee });
  };

  // STEP 1 → STEP 2: Save school first, then go to admin step
  const goToStep2 = async () => {
    if (!schoolForm.name.trim()) {
      setErr(lang === "sw" ? "Tafadhali jaza jina la shule" : "Please enter school name");
      return;
    }
    setErr(""); setSuccess("");
    setSaving(true);

    try {
      const slug = schoolForm.slug || schoolForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const payload = {
        ...schoolForm,
        slug,
        monthly_fee: Number(schoolForm.monthly_fee) || 0,
        student_count: Number(schoolForm.student_count) || 0
      };

      if (editing) {
        const { data, error } = await supabase.from("schools").update(payload).eq("id", editing.id).select().single();
        if (error) { setErr(error.message); setSaving(false); return; }
        setCreatedSchool(data);
        setSuccess(lang === "sw" ? "Shule imehifadhiwa." : "School saved.");
        setTimeout(() => { setModalOpen(false); load(); }, 1500);
      } else {
        const { data, error } = await supabase.from("schools").insert(payload).select().single();
        if (error) { setErr(error.message); setSaving(false); return; }
        setCreatedSchool(data);
        setStep(2);
        load();
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  // STEP 2: Save Pro Admin (or skip)
  const saveProAdmin = async () => {
    if (!includeAdmin) {
      setSuccess(lang === "sw" ? `Shule "${createdSchool.name}" imesajiliwa.` : `School "${createdSchool.name}" registered.`);
      setTimeout(() => setModalOpen(false), 1500);
      return;
    }

    if (!adminForm.first_name || !adminForm.last_name || !adminForm.email || !adminForm.password) {
      setErr(lang === "sw" ? "Tafadhali jaza taarifa zote za Pro Admin" : "Please fill all Pro Admin fields");
      return;
    }

    setErr(""); setSaving(true);

    try {
      const fullName = [adminForm.first_name, adminForm.middle_name, adminForm.last_name].filter(Boolean).join(" ");
      const { error } = await supabase.auth.signUp({
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
            school_id: createdSchool.id
          }
        }
      });

      if (error) {
        setErr((lang === "sw" ? "Pro Admin imeshindwa: " : "Pro Admin failed: ") + error.message);
        setSaving(false);
        return;
      }

      setSuccess(
        lang === "sw"
          ? `Shule "${createdSchool.name}" + Pro Admin (${fullName}) imekamilika!`
          : `School "${createdSchool.name}" + Pro Admin (${fullName}) completed!`
      );
      setTimeout(() => { setModalOpen(false); load(); }, 1800);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!confirm(t.deleteConfirm)) return;
    await supabase.from("schools").delete().eq("id", row.id);
    load();
  };

  const filtered = rows.filter((r) =>
    [r.name, r.director_name, r.email, r.region].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title={t.schools}
        subtitle={`${rows.length} ${t.schools.toLowerCase()}`}
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90" style={{ background: "var(--green-950)" }}>
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
                <tr><td colSpan={8} className="py-16 text-center text-stone-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-stone-400">{t.noData}</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: "var(--green-700)" }}><Building2 className="h-4 w-4" /></div>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t.edit : (lang === "sw" ? "Sajili Shule Mpya" : "Register New School")} size="xl">

        {/* Step indicator (hide if editing) */}
        {!editing && <StepIndicator step={step} lang={lang} />}

        {/* ───── STEP 1: SCHOOL DETAILS ───── */}
        {step === 1 && (
          <div className="space-y-4">
            <SectionCard
              icon={Building2}
              title={lang === "sw" ? "Maelezo ya Msingi" : "Basic Information"}
              subtitle={lang === "sw" ? "Jina la shule na mkurugenzi" : "School name and director"}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <FieldLabel hint={schoolForm.slug ? `slug: ${schoolForm.slug}` : null}>{t.schoolName} *</FieldLabel>
                  <IconInput icon={Building2} value={schoolForm.name} onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })} placeholder="Mwenge Secondary School" />
                </div>
                <div>
                  <FieldLabel>{t.directorName}</FieldLabel>
                  <IconInput icon={User} value={schoolForm.director_name} onChange={(e) => setSchoolForm({ ...schoolForm, director_name: e.target.value })} placeholder="Dr. Joseph Mwakasege" />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Phone}
              title={lang === "sw" ? "Mawasiliano" : "Contact"}
              subtitle={lang === "sw" ? "Barua pepe, simu, anwani" : "Email, phone, address"}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>{t.email}</FieldLabel>
                  <IconInput icon={Mail} type="email" value={schoolForm.email} onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })} placeholder="info@school.ac.tz" />
                </div>
                <div>
                  <FieldLabel>{t.phone}</FieldLabel>
                  <IconInput icon={Phone} value={schoolForm.phone} onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })} placeholder="+255 7XX XXX XXX" />
                </div>
                <div>
                  <FieldLabel>{t.address}</FieldLabel>
                  <IconInput icon={MapPin} value={schoolForm.address} onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })} placeholder="Mwenge Road, Kinondoni" />
                </div>
                <div>
                  <FieldLabel>{lang === "sw" ? "Mkoa" : "Region"}</FieldLabel>
                  <IconInput icon={MapPin} value={schoolForm.region} onChange={(e) => setSchoolForm({ ...schoolForm, region: e.target.value })} placeholder="Dar es Salaam" />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={CreditCard}
              title={lang === "sw" ? "Mpango wa Usajili" : "Subscription Plan"}
              subtitle={lang === "sw" ? "Chagua mpango unaofaa" : "Choose the right plan"}
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
                      className={`relative rounded-xl border-2 p-3 text-left transition ${selected ? "border-emerald-700 shadow-sm" : "border-stone-200 hover:border-stone-300"}`}
                      style={selected ? { background: "linear-gradient(135deg, #ecfdf5, #ffffff)" } : {}}
                    >
                      {selected && <CheckCircle2 className="absolute top-1.5 right-1.5 h-4 w-4" style={{ color: "var(--green-700)" }} />}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 bg-gradient-to-br ${plan.grad}`}><PlanIcon className="h-3.5 w-3.5 text-white" /></div>
                      <p className="text-[10px] uppercase tracking-wider text-stone-500">{lang === "sw" ? plan.swText : plan.enText}</p>
                      <p className="font-medium text-sm mt-0.5" style={{ color: "var(--green-950)" }}>{(plan.fee / 1000).toLocaleString()}K</p>
                      <p className="text-[10px] text-stone-500">TZS / mo</p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <FieldLabel>{lang === "sw" ? "Hali" : "Status"}</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(STATUS_OPTIONS).map(([key, st]) => {
                      const selected = schoolForm.status === key;
                      return (
                        <button key={key} type="button" onClick={() => setSchoolForm({ ...schoolForm, status: key })}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${selected ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-stone-200 text-stone-600"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {lang === "sw" ? st.swText : st.enText}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <FieldLabel>{lang === "sw" ? "Ada / Mwezi (TZS)" : "Monthly Fee (TZS)"}</FieldLabel>
                  <input type="number" className={INPUT_BASE} value={schoolForm.monthly_fee} onChange={(e) => setSchoolForm({ ...schoolForm, monthly_fee: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>{lang === "sw" ? "Wanafunzi" : "Students"}</FieldLabel>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input type="number" className={INPUT_WITH_ICON} value={schoolForm.student_count} onChange={(e) => setSchoolForm({ ...schoolForm, student_count: e.target.value })} />
                  </div>
                </div>
              </div>
            </SectionCard>

            {err && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2 border border-red-100">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>{err}</span>
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-2 border border-emerald-100">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>{success}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 px-5 py-2.5 text-sm text-stone-700 hover:bg-stone-50">{t.cancel}</button>
              <button type="button" onClick={goToStep2} disabled={saving} className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60" style={{ background: "var(--green-950)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    {editing ? t.save : (
                      <>
                        {lang === "sw" ? "Endelea" : "Continue"} <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ───── STEP 2: PRO ADMIN ───── */}
        {step === 2 && !editing && (
          <div className="space-y-4">
            {createdSchool && (
              <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)" }}>
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: "var(--green-700)" }} />
                <div className="text-sm">
                  <p className="font-medium" style={{ color: "var(--green-950)" }}>
                    {lang === "sw" ? `Shule "${createdSchool.name}" imehifadhiwa` : `School "${createdSchool.name}" saved`}
                  </p>
                  <p className="text-xs text-stone-600">
                    {lang === "sw" ? "Sasa unaweza kutengeneza Pro Admin (au ruka kabisa)" : "Now create Pro Admin (or skip)"}
                  </p>
                </div>
              </div>
            )}

            <SectionCard
              icon={Crown}
              title={lang === "sw" ? "Pro Admin wa Shule" : "School Pro Admin"}
              subtitle={lang === "sw" ? "Mwalimu Mkuu — atasimamia shule" : "Head Teacher — will manage the school"}
              accent="linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
            >
              <label className="flex items-start gap-3 p-3 mb-4 rounded-lg bg-stone-50 cursor-pointer hover:bg-stone-100">
                <input type="checkbox" checked={includeAdmin} onChange={(e) => setIncludeAdmin(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600" />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--green-950)" }}>
                    {lang === "sw" ? "Tengeneza akaunti ya Pro Admin sasa" : "Create Pro Admin account now"}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {lang === "sw" ? "Atapata email ya uthibitishaji baada ya kusajiliwa." : "Will receive a confirmation email after registration."}
                  </p>
                </div>
              </label>

              {includeAdmin && (
                <div className="space-y-3">
                  <div>
                    <FieldLabel hint={lang === "sw" ? "Majina yote matatu" : "All three names"}>
                      {lang === "sw" ? "Jina kamili" : "Full Name"} *
                    </FieldLabel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input className={INPUT_BASE} placeholder={lang === "sw" ? "Jina la kwanza" : "First name"} value={adminForm.first_name} onChange={(e) => setAdminForm({ ...adminForm, first_name: e.target.value })} />
                      <input className={INPUT_BASE} placeholder={lang === "sw" ? "Jina la kati" : "Middle name"} value={adminForm.middle_name} onChange={(e) => setAdminForm({ ...adminForm, middle_name: e.target.value })} />
                      <input className={INPUT_BASE} placeholder={lang === "sw" ? "Jina la mwisho" : "Last name"} value={adminForm.last_name} onChange={(e) => setAdminForm({ ...adminForm, last_name: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <FieldLabel hint={lang === "sw" ? "Atatumia kuingia" : "Used to sign in"}>{lang === "sw" ? "Barua pepe" : "Email"} *</FieldLabel>
                      <IconInput icon={Mail} type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="admin@school.ac.tz" />
                    </div>
                    <div>
                      <FieldLabel>{lang === "sw" ? "Namba ya simu" : "Phone"} *</FieldLabel>
                      <IconInput icon={Phone} value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} placeholder="+255 7XX XXX XXX" />
                    </div>
                  </div>

                  <div>
                    <FieldLabel hint={lang === "sw" ? "Angalau herufi 6" : "At least 6 characters"}>{lang === "sw" ? "Nenosiri" : "Password"} *</FieldLabel>
                    <IconInput icon={Lock} type="password" minLength={6} value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
                  </div>
                </div>
              )}
            </SectionCard>

            {err && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2 border border-red-100">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>{err}</span>
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-2 border border-emerald-100">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>{success}</span>
              </div>
            )}

            <div className="flex justify-between gap-2 pt-3 border-t border-stone-100">
              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 rounded-lg border border-stone-200 px-5 py-2.5 text-sm text-stone-700 hover:bg-stone-50">
                <ArrowLeft className="h-4 w-4" /> {lang === "sw" ? "Rudi" : "Back"}
              </button>
              <button type="button" onClick={saveProAdmin} disabled={saving}
                className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60" style={{ background: "var(--green-950)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  includeAdmin
                    ? (<><UserPlus className="h-4 w-4" /> {lang === "sw" ? "Sajili Pro Admin" : "Register Pro Admin"}</>)
                    : (<><Check className="h-4 w-4" /> {lang === "sw" ? "Maliza Bila Admin" : "Finish Without Admin"}</>)
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
