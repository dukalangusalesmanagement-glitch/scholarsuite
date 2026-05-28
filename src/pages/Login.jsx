import { useState } from "react";
import { Loader2, Globe, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LangContext";

export default function Login() {
  const { t, lang, toggleLang } = useLang();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "signup" && password !== confirmPwd) {
      setError(t.passwordMismatch);
      return;
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) setError(error.message || t.invalidCreds);
      } else {
        const { error } = await signUp(email, password, { full_name: fullName });
        if (error) setError(error.message);
        else {
          setSuccess(t.accountCreated);
          setMode("signin");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ background: "var(--cream)" }}
    >
      {/* Left: hero panel */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-3/5 flex-col justify-between p-10 lg:p-16 relative overflow-hidden"
        style={{ background: "var(--green-950)" }}
      >
        <div className="relative z-10">
          <img
            src="/classlink-logo-white.svg"
            alt="ClassLink"
            className="h-10 w-auto"
          />
          <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-300/70 mt-3 pl-1">
            {t.tagline}
          </p>
        </div>

        <div className="relative z-10">
          <h2 className="display text-4xl lg:text-6xl text-white leading-[1.05] max-w-xl">
            One platform.
            <br />
            <span className="italic" style={{ color: "var(--green-300)" }}>
              Every school
            </span>{" "}
            you manage.
          </h2>
          <p className="mt-6 text-emerald-100/70 max-w-lg leading-relaxed">
            {t.welcomeMessage}
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
            {[
              { num: "30+", label: t.schools },
              { num: "10k+", label: t.students },
              { num: "99.9%", label: "uptime" }
            ].map((s, i) => (
              <div key={i}>
                <p className="display text-3xl text-white">{s.num}</p>
                <p className="text-xs uppercase tracking-wider text-emerald-300/60 mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-emerald-300/40">
          © {new Date().getFullYear()} {t.poweredBy}. {t.allRights}
        </p>

        <div
          className="absolute top-1/2 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "var(--green-400)", filter: "blur(80px)" }}
        />
      </div>

      {/* Right: form */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-4">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang.toUpperCase()}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="md:hidden mb-8 text-center">
              <img
                src="/classlink-logo.svg"
                alt="ClassLink"
                className="h-14 w-auto mx-auto"
              />
            </div>

            <h2 className="display text-3xl" style={{ color: "var(--green-950)" }}>
              {mode === "signin" ? t.signIn : t.createAccount}
            </h2>
            <p className="text-sm text-stone-500 mt-2">
              {mode === "signin" ? t.welcome : t.tagline}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                    {t.fullName}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                  {t.passwordLabel}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-600 mb-1.5">
                    {t.confirmPassword}
                  </label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    required
                    className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition disabled:opacity-60"
                style={{ background: "var(--green-950)" }}
              >
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.signingIn}
                  </span>
                ) : mode === "signin" ? (
                  t.signInBtn
                ) : (
                  t.createAccount
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-stone-500">
              {mode === "signin" ? t.dontHaveAccount : t.alreadyHaveAccount}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError("");
                  setSuccess("");
                }}
                className="font-medium hover:underline"
                style={{ color: "var(--green-700)" }}
              >
                {mode === "signin" ? t.signUp : t.signInBtn}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
