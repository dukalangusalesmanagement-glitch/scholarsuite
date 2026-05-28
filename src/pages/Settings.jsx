import { useState, useEffect } from "react";
import { Loader2, Database, Globe, Moon, Sun, KeyRound, UserCog } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { supabase } from "../lib/supabase";
import PageHeader from "../components/PageHeader";
import Field, { inputClass } from "../components/Field";

export default function Settings() {
  const { t, lang, setLang } = useLang();
  const { profile, user } = useAuth();
  const { dark, toggle: toggleDark } = useTheme();
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [pwd, setPwd] = useState({ newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [dbStatus, setDbStatus] = useState("checking");

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || "", phone: profile.phone || "" });
  }, [profile]);

  useEffect(() => {
    (async () => {
      const { error } = await supabase.from("schools").select("id", { count: "exact", head: true });
      setDbStatus(error ? "error" : "connected");
    })();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    setMsg(error ? error.message : t.saved);
    setBusy(false);
  };

  const changePwd = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    if (pwd.newPassword !== pwd.confirm) {
      setPwdMsg(t.passwordMismatch);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd.newPassword });
    setPwdMsg(error ? error.message : t.saved);
    if (!error) setPwd({ newPassword: "", confirm: "" });
    setBusy(false);
  };

  return (
    <div>
      <PageHeader title={t.settings} subtitle={lang === "sw" ? "Akaunti, mfumo na muonekano" : "Account, system & appearance"} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={saveProfile} className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <UserCog className="h-5 w-5 text-emerald-700" />
            <h3 className="display text-2xl" style={{ color: "var(--green-950)" }}>{t.profile}</h3>
          </div>
          <Field label={t.email}>
            <input disabled className={inputClass} value={user?.email || ""} />
          </Field>
          <Field label={t.fullName}>
            <input className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Field>
          <Field label={t.phone}>
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label={t.role}>
            <input disabled className={inputClass} value={profile?.role?.replace("_", " ") || ""} />
          </Field>
          {msg && <div className={`rounded-lg px-3 py-2 text-sm ${msg === t.saved ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg}</div>}
          <button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
          </button>
        </form>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-5 w-5 text-emerald-700" />
              <h3 className="display text-2xl" style={{ color: "var(--green-950)" }}>Supabase</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${dbStatus === "connected" ? "bg-emerald-500" : dbStatus === "error" ? "bg-red-500" : "bg-amber-500"}`} />
              <span className="text-sm text-stone-700">
                {dbStatus === "connected" ? t.connected : dbStatus === "error" ? t.error : t.connecting}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-5 w-5 text-emerald-700" />
              <h3 className="display text-2xl" style={{ color: "var(--green-950)" }}>{t.language}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setLang("sw")} className={`flex-1 rounded-lg py-2 text-sm font-medium ${lang === "sw" ? "text-white" : "bg-stone-100 text-stone-700"}`} style={lang === "sw" ? { background: "var(--green-950)" } : {}}>Kiswahili</button>
              <button onClick={() => setLang("en")} className={`flex-1 rounded-lg py-2 text-sm font-medium ${lang === "en" ? "text-white" : "bg-stone-100 text-stone-700"}`} style={lang === "en" ? { background: "var(--green-950)" } : {}}>English</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              {dark ? <Sun className="h-5 w-5 text-emerald-700" /> : <Moon className="h-5 w-5 text-emerald-700" />}
              <h3 className="display text-2xl" style={{ color: "var(--green-950)" }}>{t.theme}</h3>
            </div>
            <button onClick={toggleDark} className="w-full rounded-lg py-2 text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200">
              {dark ? t.darkMode + " ✓" : t.darkMode}
            </button>
          </div>
        </div>

        <form onSubmit={changePwd} className="lg:col-span-3 bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <KeyRound className="h-5 w-5 text-emerald-700" />
            <h3 className="display text-2xl" style={{ color: "var(--green-950)" }}>{t.passwordLabel}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t.passwordLabel}>
              <input type="password" className={inputClass} value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} required minLength={6} />
            </Field>
            <Field label={t.confirmPassword}>
              <input type="password" className={inputClass} value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} required minLength={6} />
            </Field>
          </div>
          {pwdMsg && <div className={`rounded-lg px-3 py-2 text-sm ${pwdMsg === t.saved ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{pwdMsg}</div>}
          <button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
          </button>
        </form>
      </div>
    </div>
  );
}
