import { useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useLang } from "./contexts/LangContext";
import Login from "./pages/Login";
import Shell from "./components/Shell";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabaseConfigured } from "./lib/supabase";

function ConfigErrorBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">Configuration Missing — Mfumo hautafanya kazi</p>
          <p className="text-red-100 text-xs mt-1">
            Netlify env vars hazipo. Weka <code className="bg-red-700 px-1 rounded">VITE_SUPABASE_URL</code> na <code className="bg-red-700 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> kwenye Netlify → Site settings → Environment variables, kisha redeploy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const { t } = useLang();
  const [view, setView] = useState("dashboard");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--cream)" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--green-700)" }} />
          <p className="text-sm text-stone-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!supabaseConfigured && <ConfigErrorBanner />}
      <div style={{ paddingTop: !supabaseConfigured ? "70px" : "0" }}>
        {!user ? <Login /> : <Shell view={view} setView={setView} />}
      </div>
    </>
  );
}
