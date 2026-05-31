import { useEffect, useState } from "react";
import {
  Plus, Building2, Edit3, Trash2, Loader2, Crown, CheckCircle2,
  UserPlus, Phone, Mail, MapPin, Layers, Users,
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
  basic:      { fee: 500000,  icon: Layers, grad: "from-slate-400 to-slate-600",     swText: "Msingi",   enText: "Basic" },
  standard:   { fee: 1200000, icon: Award,  grad: "from-teal-400 to-teal-600",       swText: "Wastani",  enText: "Standard" },
  premium:    { fee: 2500000, icon: Star,   grad: "from-emerald-500 to-emerald-700", swText: "Bora",     enText: "Premium" },
  enterprise: { fee: 4800000, icon: Crown,  grad: "from-emerald-800 to-emerald-950", swText: "Biashara", enText: "Enterprise" }
};

const STATUS_OPTIONS = {
  trial:    { dot: "bg-amber-500",   swText: "Jaribio",  enText: "Trial" },
  active:   { dot: "bg-emerald-500", swText: "Hai",      enText: "Active" },
  inactive: { dot: "bg-stone-400",   swText: "Imezimwa", enText: "Inactive" },
  expired:  { dot: "bg-red-500",     swText: "Imeisha",  enText: "Expired" }
};

const INPUT_BASE = "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30";
const INPUT_WITH_ICON = "w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30";

function MiniSection({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3.5">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--green-100)", color: "var(--green-800)" }}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="font-medium text-sm" style={{ color: "var(--green-950)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Label({ children, hint }) {
  return (
    <div className="mb-1">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-600">{children}</span>
      {hint && <span className="block text-[9px] text-stone-400">{hint}</span>}
    </div>
  );
}

function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400 pointer-events-none" />
      <input {...props} className={INPUT_WITH_ICON} />
    </div>
  );
}

function StepIndicator({ step, lang }) {
  const steps = [
    { num: 1, label: lang === "sw" ? "Shule" : "School", icon: Building2 },
    { num: 2, label: "Pro Admin", icon: Crown }
  ];
  return (
    <div className="flex items-center mb-4 px-1">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = step > s.num;
        const active = step === s.num;
        return (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center transition flex-shrink-0 ${done ? "bg-emerald-700 text-white" : active ? "ring-4 ring-emerald-100" : "bg-stone-100 text-stone-400"}`} style={active ? { background: "var(--green-700)", color: "white" } : {}}>
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <p className={`text-xs uppercase tracking-wider ${active || done ? "font-semibold" : "text-stone-400"}`} style={(active || done) ? { color: "var(--green-950)" } : {}}>
                {s.label}
              </p>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px mx-3 transition" style={{ background: step > s.num ? "var(--green-700)" : "#e7e5e4" }} />}
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
  const [step, setStep] = useState(1);
  const [schoolForm, setSchoolForm] = useState(EMPTY_SCHOOL);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN);
  const [includeAdmin, setIncludeAdmin] = useState(true);
  const [createdSchool, setCreatedSchool] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  // Load schools list using direct fetch
  const load = async () => {
    setLoading(true);
    try {
      const data = await directFetch("/rest/v1/schools?select=*&order=created_at.desc");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load schools failed:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // Direct fetch helper - completely bypasses Supabase JS client
  const directFetch = async (path, options = {}) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}${path}`;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Read auth token directly from localStorage (no supabase.auth call)
    let token = key;
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
          const v = JSON.parse(localStorage.getItem(k));
          if (v?.access_token) { token = v.access_token; break; }
        }
      }
    } catch (e) {
      // ignore, use anon key
    }

    console.log(`🚀 ${options.method || "GET"} ${url}`);
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      console.log(`✅ ${response.status} in ${duration}ms`);

      const text = await response.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }

      if (!response.ok) {
        const msg = typeof data === "object" ? (data.message || JSON.stringify(data)) : data;
        throw new Error(`HTTP ${response.status}: ${msg}`);
      }
      return data;
    } catch (e) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      if (e.name === "AbortError") throw new Error(`Request aborted after ${duration}ms (10s timeout)`);
      throw e;
    }
  };

  // Helper: race a promise against a timeout
  const withTimeout = (promise, ms = 15000, label = "Request") => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s — check connection`)), ms)
      )
    ]);
  };

  useEffect(() => {
    if (!editing && schoolForm.name) {
      const slug = schoolForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setSchoolForm((f) => ({ ...f, slug }));
    }
  }, [schoolForm.name, editing]);

  const openCreate = () => {
    setEditing(null); setStep(1);
    setSchoolForm(EMPTY_SCHOOL); setAdminForm(EMPTY_ADMIN);
    setIncludeAdmin(true); setCreatedSchool(null);
    setErr(""); setSuccess(""); setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row); setStep(1);
    setSchoolForm({ ...EMPTY_SCHOOL, ...row });
    setIncludeAdmin(false);
    setErr(""); setSuccess(""); setModalOpen(true);
  };

  const selectPlan = (plan) => {
    setSchoolForm({ ...schoolForm, plan, monthly_fee: PLAN_DETAILS[plan]?.fee || schoolForm.monthly_fee });
  };

  const goToStep2 = async () => {
    if (!schoolForm.name.trim()) {
      setErr(lang === "sw" ? "Tafadhali jaza jina la shule" : "Please enter school name");
      return;
    }
    setErr(""); setSuccess(""); setSaving(true);
    try {
      const slug = schoolForm.slug || schoolForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const payload = { ...schoolForm, slug, monthly_fee: Number(schoolForm.monthly_fee) || 0, student_count: Number(schoolForm.student_count) || 0 };

      if (editing) {
        // UPDATE existing school using direct fetch
        const data = await directFetch(`/rest/v1/schools?id=eq.${editing.id}`, {
          method: "PATCH",
          headers: { "Prefer": "return=representation" },
          body: JSON.stringify(payload)
        });
        const school = Array.isArray(data) ? data[0] : data;
        setCreatedSchool(school);
        setSuccess(lang === "sw" ? "Shule imehifadhiwa." : "School saved.");
        setTimeout(() => { setModalOpen(false); load(); }, 1500);
      } else {
        // CREATE new school using direct fetch (bypasses Supabase JS client)
        const data = await directFetch("/rest/v1/schools", {
          method: "POST",
          headers: { "Prefer": "return=representation" },
          body: JSON.stringify(payload)
        });
        const school = Array.isArray(data) ? data[0] : data;
        setCreatedSchool(school);
        setStep(2);
        load();
      }
    } catch (e) {
      console.error("goToStep2 error:", e);
      setErr(e.message);
    }
    finally { setSaving(false); }
  };

  const saveProAdmin = async () => {
    if (!includeAdmin) {
      setSuccess(lang === "sw" ? `Shule "${createdSchool.name}" imesajiliwa.` : `School "${createdSchool.name}" registered.`);
      setTimeout(() => setModalOpen(false), 1500);
      return;
    }
    if (!adminForm.first_name || !adminForm.last_name || !adminForm.email || !adminForm.password) {
      setErr(lang === "sw" ? "Tafadhali jaza taarifa zote" : "Please fill all fields");
      return;
    }
    setErr(""); setSaving(true);
    try {
      const fullName = [adminForm.first_name, adminForm.middle_name, adminForm.last_name].filter(Boolean).join(" ");
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email: adminForm.email, password: adminForm.password,
          options: {
            data: {
              first_name: adminForm.first_name, middle_name: adminForm.middle_name, last_name: adminForm.last_name,
              full_name: fullName, phone: adminForm.phone, role: "head_teacher", school_id: createdSchool.id
            }
          }
        }),
        15000,
        "Create Pro Admin"
      );
      if (error) { setErr((lang === "sw" ? "Pro Admin imeshindwa: " : "Pro Admin failed: ") + error.message); setSaving(false); return; }
      setSuccess(lang === "sw" ? `Shule + Pro Admin (${fullName}) imekamilika!` : `School + Pro Admin (${fullName}) done!`);
      setTimeout(() => { setModalOpen(false); load(); }, 1800);
    } catch (e) {
      console.error("saveProAdmin error:", e);
      setErr(e.message);
    }
    finally { setSaving(false); }
  };

  const remove = async (row) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await directFetch(`/rest/v1/schools?id=eq.${row.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      console.error("Delete failed:", e);
      alert(e.message);
    }
  };

  const filtered = rows.filter((r) =>
    [r.name, r.director_name, r.email, r.region].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  // Connection diagnostic
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const start = Date.now();
    try {
      const data = await directFetch("/rest/v1/schools?select=id&limit=1", { method: "GET" });
      const duration = Date.now() - start;
      setTestResult({ ok: true, msg: `Connection OK (${duration}ms). Found ${Array.isArray(data) ? data.length : 0} test row.` });
    } catch (e) {
      const duration = Date.now() - start;
      setTestResult({ ok: false, msg: `Failed after ${duration}ms: ${e.message}` });
    } finally {
      setTesting(false);
    }
  };

  // ── Footer buttons (sticky) ───────────────────────
  const renderFooter = () => {
    if (step === 1) {
      return (
        <div className="flex justify-end gap-2">
          <button onClick={() => setModalOpen(false)} className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">{t.cancel}</button>
          <button onClick={goToStep2} disabled={saving} className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-60" style={{ background: "var(--green-950)" }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? t.save : <>{lang === "sw" ? "Endelea" : "Continue"} <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      );
    }
    return (
      <div className="flex justify-between gap-2">
        <button onClick={() => setStep(1)} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
          <ArrowLeft className="h-4 w-4" /> {lang === "sw" ? "Rudi" : "Back"}
        </button>
        <button onClick={saveProAdmin} disabled={saving} className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-60" style={{ background: "var(--green-950)" }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : includeAdmin ? <><UserPlus className="h-4 w-4" /> {lang === "sw" ? "Sajili Pro Admin" : "Register Pro Admin"}</> : <><Check className="h-4 w-4" /> {lang === "sw" ? "Maliza Bila Admin" : "Finish Without Admin"}</>}
        </button>
      </div>
    );
  };

  return (
    <div>
      <PageHeader title={t.schools} subtitle={`${rows.length} ${t.schools.toLowerCase()}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={testConnection}
              disabled={testing}
              className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Phone className="h-3.5 w-3.5" />}
              Test Connection
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90" style={{ background: "var(--green-950)" }}>
              <Plus className="h-4 w-4" /> {t.registerSchool}
            </button>
          </div>
        }
      />

      {testResult && (
        <div className={`mb-3 rounded-lg p-3 text-sm border ${testResult.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          <div className="flex items-start gap-2">
            {testResult.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
            <span>{testResult.msg}</span>
          </div>
        </div>
      )}

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
              {loading ? <tr><td colSpan={8} className="py-16 text-center text-stone-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="py-16 text-center text-stone-400">{t.noData}</td></tr>
              : filtered.map((r) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t.edit : (lang === "sw" ? "Sajili Shule Mpya" : "Register New School")}
        size="2xl"
        footer={renderFooter()}
      >
        {!editing && <StepIndicator step={step} lang={lang} />}

        {/* STEP 1: 2-COLUMN COMPACT LAYOUT */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* LEFT COLUMN */}
              <div className="space-y-3">
                <MiniSection icon={Building2} title={lang === "sw" ? "Maelezo ya Msingi" : "Basic Information"}>
                  <div className="space-y-2.5">
                    <div>
                      <Label hint={schoolForm.slug ? `slug: ${schoolForm.slug}` : null}>{t.schoolName} *</Label>
                      <IconInput icon={Building2} value={schoolForm.name} onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })} placeholder="Mwenge Secondary School" />
                    </div>
                    <div>
                      <Label>{t.directorName}</Label>
                      <IconInput icon={User} value={schoolForm.director_name} onChange={(e) => setSchoolForm({ ...schoolForm, director_name: e.target.value })} placeholder="Dr. Joseph Mwakasege" />
                    </div>
                  </div>
                </MiniSection>

                <MiniSection icon={Phone} title={lang === "sw" ? "Mawasiliano" : "Contact"}>
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>{t.email}</Label>
                        <IconInput icon={Mail} type="email" value={schoolForm.email} onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })} placeholder="info@school.ac.tz" />
                      </div>
                      <div>
                        <Label>{t.phone}</Label>
                        <IconInput icon={Phone} value={schoolForm.phone} onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })} placeholder="+255 7XX XXX XXX" />
                      </div>
                    </div>
                    <div>
                      <Label>{t.address}</Label>
                      <IconInput icon={MapPin} value={schoolForm.address} onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })} placeholder="Mwenge Road, Kinondoni" />
                    </div>
                    <div>
                      <Label>{lang === "sw" ? "Mkoa" : "Region"}</Label>
                      <IconInput icon={MapPin} value={schoolForm.region} onChange={(e) => setSchoolForm({ ...schoolForm, region: e.target.value })} placeholder="Dar es Salaam" />
                    </div>
                  </div>
                </MiniSection>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-3">
                <MiniSection icon={CreditCard} title={lang === "sw" ? "Mpango wa Usajili" : "Subscription Plan"}>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {Object.entries(PLAN_DETAILS).map(([key, plan]) => {
                      const PlanIcon = plan.icon;
                      const selected = schoolForm.plan === key;
                      return (
                        <button key={key} type="button" onClick={() => selectPlan(key)}
                          className={`relative rounded-lg border-2 p-2.5 text-left transition ${selected ? "border-emerald-700" : "border-stone-200 hover:border-stone-300"}`}
                          style={selected ? { background: "linear-gradient(135deg, #ecfdf5, #ffffff)" } : {}}>
                          {selected && <CheckCircle2 className="absolute top-1 right-1 h-3.5 w-3.5" style={{ color: "var(--green-700)" }} />}
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center mb-1.5 bg-gradient-to-br ${plan.grad}`}>
                            <PlanIcon className="h-3 w-3 text-white" />
                          </div>
                          <p className="text-[9px] uppercase tracking-wider text-stone-500">{lang === "sw" ? plan.swText : plan.enText}</p>
                          <p className="font-semibold text-xs mt-0.5" style={{ color: "var(--green-950)" }}>{(plan.fee / 1000).toLocaleString()}K <span className="text-stone-400 font-normal">TZS</span></p>
                        </button>
                      );
                    })}
                  </div>
                </MiniSection>

                <MiniSection icon={Users} title={lang === "sw" ? "Hali & Ada" : "Status & Fee"}>
                  <div className="space-y-2.5">
                    <div>
                      <Label>{lang === "sw" ? "Hali" : "Status"}</Label>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(STATUS_OPTIONS).map(([key, st]) => {
                          const selected = schoolForm.status === key;
                          return (
                            <button key={key} type="button" onClick={() => setSchoolForm({ ...schoolForm, status: key })}
                              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${selected ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-stone-200 text-stone-600"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                              {lang === "sw" ? st.swText : st.enText}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>{lang === "sw" ? "Ada/Mwezi" : "Monthly Fee"}</Label>
                        <input type="number" className={INPUT_BASE} value={schoolForm.monthly_fee} onChange={(e) => setSchoolForm({ ...schoolForm, monthly_fee: e.target.value })} />
                      </div>
                      <div>
                        <Label>{lang === "sw" ? "Wanafunzi" : "Students"}</Label>
                        <div className="relative">
                          <Users className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                          <input type="number" className={INPUT_WITH_ICON} value={schoolForm.student_count} onChange={(e) => setSchoolForm({ ...schoolForm, student_count: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>
                </MiniSection>
              </div>
            </div>

            {err && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2 border border-red-100">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /><span>{err}</span>
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 flex items-start gap-2 border border-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /><span>{success}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PRO ADMIN */}
        {step === 2 && !editing && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {createdSchool && (
              <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)" }}>
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "var(--green-700)" }} />
                <div className="text-xs">
                  <p className="font-medium" style={{ color: "var(--green-950)" }}>
                    {lang === "sw" ? `Shule "${createdSchool.name}" imehifadhiwa` : `School "${createdSchool.name}" saved`}
                  </p>
                  <p className="text-stone-600">
                    {lang === "sw" ? "Sasa tengeneza Pro Admin au ruka" : "Now create Pro Admin or skip"}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-stone-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100" style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)" }}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)" }}>
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm" style={{ color: "var(--green-950)" }}>
                      {lang === "sw" ? "Pro Admin wa Shule" : "School Pro Admin"}
                    </h3>
                    <p className="text-[10px] text-stone-600">
                      {lang === "sw" ? "Mwalimu Mkuu atasimamia shule" : "Head Teacher will manage the school"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={includeAdmin} onChange={(e) => setIncludeAdmin(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600" />
                  <div className="text-xs">
                    <p className="font-medium text-stone-900">{lang === "sw" ? "Tengeneza akaunti sasa" : "Create account now"}</p>
                    <p className="text-stone-500">{lang === "sw" ? "Atapata email ya uthibitishaji" : "Will receive confirmation email"}</p>
                  </div>
                </label>

                {includeAdmin && (
                  <div className="space-y-2.5 pt-2 border-t border-stone-100">
                    <div>
                      <Label hint={lang === "sw" ? "Majina yote matatu" : "All three names"}>{lang === "sw" ? "Jina kamili" : "Full Name"} *</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <input className={INPUT_BASE} placeholder={lang === "sw" ? "Kwanza" : "First"} value={adminForm.first_name} onChange={(e) => setAdminForm({ ...adminForm, first_name: e.target.value })} />
                        <input className={INPUT_BASE} placeholder={lang === "sw" ? "Kati" : "Middle"} value={adminForm.middle_name} onChange={(e) => setAdminForm({ ...adminForm, middle_name: e.target.value })} />
                        <input className={INPUT_BASE} placeholder={lang === "sw" ? "Mwisho" : "Last"} value={adminForm.last_name} onChange={(e) => setAdminForm({ ...adminForm, last_name: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>{lang === "sw" ? "Barua pepe" : "Email"} *</Label>
                        <IconInput icon={Mail} type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="admin@school.ac.tz" />
                      </div>
                      <div>
                        <Label>{lang === "sw" ? "Simu" : "Phone"} *</Label>
                        <IconInput icon={Phone} value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} placeholder="+255 7XX XXX XXX" />
                      </div>
                    </div>

                    <div>
                      <Label hint={lang === "sw" ? "Angalau herufi 6" : "At least 6 chars"}>{lang === "sw" ? "Nenosiri" : "Password"} *</Label>
                      <IconInput icon={Lock} type="password" minLength={6} value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {err && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2 border border-red-100">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /><span>{err}</span>
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 flex items-start gap-2 border border-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /><span>{success}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
