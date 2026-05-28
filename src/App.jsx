import { useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useLang } from "./contexts/LangContext";
import Login from "./pages/Login";
import Shell from "./components/Shell";
import { Loader2 } from "lucide-react";

export default function App() {
  const { user, profile, loading } = useAuth();
  const { t } = useLang();
  const [view, setView] = useState("dashboard");

  if (loading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: "var(--cream)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--green-700)" }} />
          <p className="text-sm text-stone-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return <Shell view={view} setView={setView} />;
}
