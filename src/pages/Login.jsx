import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LangContext";
import {
  Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  User, ArrowRight, Sparkles
} from "lucide-react";

export default function Login() {
  const { signIn, signUp, translateError } = useAuth();
  const { lang, t } = useLang();

  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const T = {
    sw: {
      welcome: "Karibu ClassLink",
      subtitle: "Mfumo wa Usimamizi wa Shule",
      signin: "Ingia",
      signup: "Jisajili",
      signinDesc: "Ingia kwenye akaunti yako",
      signupDesc: "Tengeneza akaunti mpya",
      fullName: "Jina kamili",
      fullNamePh: "Jina lako la kamili",
      email: "Barua pepe",
      emailPh: "wewe@email.com",
      password: "Nenosiri",
      passwordPh: "Andika nenosiri lako",
      passwordHint: "Angalau herufi 6",
      forgotPw: "Umesahau nenosiri?",
      signinBtn: "Ingia",
      signupBtn: "Tengeneza Akaunti",
      busy: "Inafanya kazi...",
      noAccount: "Huna akaunti?",
      hasAccount: "Una akaunti?",
      switchToSignup: "Jisajili",
      switchToSignin: "Ingia",
      poweredBy: "Imeundwa kwa shule za Tanzania",
      signupSuccess: "Akaunti imeundwa! Angalia email yako kwa uthibitishaji.",
      missingFields: "Tafadhali jaza taarifa zote"
    },
    en: {
      welcome: "Welcome to ClassLink",
      subtitle: "School Management System",
      signin: "Sign In",
      signup: "Sign Up",
      signinDesc: "Sign in to your account",
      signupDesc: "Create a new account",
      fullName: "Full Name",
      fullNamePh: "Your full name",
      email: "Email",
      emailPh: "you@email.com",
      password: "Password",
      passwordPh: "Enter your password",
      passwordHint: "At least 6 characters",
      forgotPw: "Forgot password?",
      signinBtn: "Sign In",
      signupBtn: "Create Account",
      busy: "Working...",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      switchToSignup: "Sign up",
      switchToSignin: "Sign in",
      poweredBy: "Built for Tanzanian schools",
      signupSuccess: "Account created! Check your email for verification.",
      missingFields: "Please fill all fields"
    }
  };
  const L = T[lang] || T.en;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setErr(""); setSuccess("");
    if (!email.trim() || !password) {
      setErr(L.missingFields);
      return;
    }
    if (mode === "signup" && !fullName.trim()) {
      setErr(L.missingFields);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        // AuthProvider will update — App routes to dashboard
      } else {
        await signUp(email, password, { full_name: fullName.trim() });
        setSuccess(L.signupSuccess);
      }
    } catch (e) {
      console.error("Auth error:", e);
      setErr(translateError(e.message, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 20% 10%, rgba(16, 122, 87, 0.15), transparent 40%), radial-gradient(circle at 80% 90%, rgba(5, 88, 64, 0.18), transparent 40%), linear-gradient(135deg, #f6f4ef 0%, #ecf3ef 100%)"
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--green-700)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-15 blur-3xl"
        style={{ background: "var(--green-950)" }} />

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg mb-3"
            style={{ background: "linear-gradient(135deg, var(--green-700), var(--green-950))" }}>
            <span className="text-white font-bold text-xl" style={{ fontFamily: "Instrument Serif, serif" }}>CL</span>
          </div>
          <h1 className="text-3xl font-semibold text-stone-900" style={{ fontFamily: "Instrument Serif, serif" }}>
            {L.welcome}
          </h1>
          <p className="text-sm text-stone-500 mt-1 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--green-700)" }} />
            {L.subtitle}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-stone-200/60 overflow-hidden">
          {/* Tab switcher */}
          <div className="grid grid-cols-2 p-1.5 m-3 mb-0 rounded-xl bg-stone-100/80">
            <button
              type="button"
              onClick={() => { setMode("signin"); setErr(""); setSuccess(""); }}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === "signin"
                  ? "bg-white shadow-sm text-stone-900"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {L.signin}
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setErr(""); setSuccess(""); }}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === "signup"
                  ? "bg-white shadow-sm text-stone-900"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {L.signup}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                {mode === "signin" ? L.signinDesc : L.signupDesc}
              </h2>
            </div>

            {/* Full name (signup only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">{L.fullName}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={L.fullNamePh}
                    autoComplete="name"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-stone-200 bg-white text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">{L.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={L.emailPh}
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-stone-200 bg-white text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-stone-700">{L.password}</label>
                {mode === "signin" && (
                  <button type="button" className="text-xs font-medium hover:underline" style={{ color: "var(--green-700)" }}>
                    {L.forgotPw}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={L.passwordPh}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-stone-200 bg-white text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-[11px] text-stone-500 mt-1.5">{L.passwordHint}</p>
              )}
            </div>

            {/* Error message */}
            {err && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{err}</span>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              style={{
                background: "linear-gradient(135deg, var(--green-700), var(--green-950))"
              }}
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{L.busy}</span>
                </>
              ) : (
                <>
                  <span>{mode === "signin" ? L.signinBtn : L.signupBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch mode */}
            <div className="text-center text-xs text-stone-500">
              {mode === "signin" ? L.noAccount : L.hasAccount}{" "}
              <button
                type="button"
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(""); setSuccess(""); }}
                className="font-medium hover:underline"
                style={{ color: "var(--green-700)" }}
              >
                {mode === "signin" ? L.switchToSignup : L.switchToSignin}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-stone-400 mt-4">
          {L.poweredBy} · v1.0
        </p>
      </div>
    </div>
  );
}
