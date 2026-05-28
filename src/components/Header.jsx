import { useState, useRef, useEffect } from "react";
import { Search, Bell, Globe, Moon, Sun, ChevronDown, LogOut, UserCog, Menu } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Header({ onMobileNav }) {
  const { t, lang, toggleLang } = useLang();
  const { profile, signOut } = useAuth();
  const { dark, toggle: toggleDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur">
      <div className="flex items-center gap-3 px-4 md:px-6 py-3">
        <button
          onClick={onMobileNav}
          className="md:hidden rounded-lg p-2 text-stone-600 hover:bg-stone-100"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden md:block flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder={t.search}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            title={t.language}
          >
            <Globe className="h-3.5 w-3.5" />
            {lang.toUpperCase()}
          </button>

          <button
            onClick={toggleDark}
            className="rounded-lg border border-stone-200 p-2 text-stone-700 hover:bg-stone-50"
            title={t.darkMode}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            className="relative rounded-lg border border-stone-200 p-2 text-stone-700 hover:bg-stone-50"
            title={t.notifications}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500" />
          </button>

          <div className="relative" ref={ref}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-stone-200 px-2 py-1.5 hover:bg-stone-50"
            >
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                style={{ background: "var(--green-700)" }}
              >
                {(profile?.full_name || profile?.email || "U").slice(0, 1).toUpperCase()}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-stone-200 bg-white shadow-lg animate-in">
                <div className="border-b border-stone-100 px-4 py-3">
                  <p className="text-sm font-medium text-stone-900 truncate">
                    {profile?.full_name || profile?.email}
                  </p>
                  <p className="text-xs text-stone-500 truncate">
                    {profile?.role?.replace("_", " ") || "—"}
                  </p>
                </div>
                <div className="p-1.5">
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">
                    <UserCog className="h-4 w-4" /> {t.profile}
                  </button>
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> {t.logout}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
