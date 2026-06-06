import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LangContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSchool } from "../hooks/useSchool";
import { getRoleLabel } from "../lib/permissions";
import {
  Search, Bell, Moon, Sun, Globe, ChevronDown, User,
  Settings, LogOut, Crown, AlertTriangle, Loader2, Building2, Sparkles
} from "lucide-react";

export default function Header({ onMobileNav, setView }) {
  const { user, profile, isSuperAdmin, signOut } = useAuth();
  const { lang, setLang, t } = useLang();
  const { dark, setDark } = useTheme();
  const { schoolName, isPlatform } = useSchool();

  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        setConfirmLogout(false);
      }
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const initial = (displayName || "U").trim().charAt(0).toUpperCase();

  const handleLogout = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      console.error("Sign out error:", e);
      // signOut already redirects, but if it fails, force-redirect
      window.location.href = "/";
    }
  };

  const roleLabel = profile?.role ? getRoleLabel(profile.role, lang) : null;

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 bg-white/70 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30">
      {/* Context pill — shows what scope user is operating in */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {isPlatform ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
            style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)", color: "#1c1917" }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === "sw" ? "Mfumo wa SaaS" : "Platform Owner"}</span>
          </div>
        ) : schoolName ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-xs font-semibold text-emerald-900 truncate max-w-[200px]">{schoolName}</span>
          </div>
        ) : null}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder={lang === "sw" ? "Tafuta..." : "Search..."}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-200 bg-stone-50 text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === "sw" ? "en" : "sw")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-stone-700 hover:bg-stone-100 transition"
          title="Language"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="uppercase">{lang}</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-full text-stone-700 hover:bg-stone-100 transition"
          title="Theme"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-full text-stone-700 hover:bg-stone-100 transition relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setOpen(!open); setConfirmLogout(false); }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-stone-100 transition"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm"
              style={{
                background: isSuperAdmin
                  ? "linear-gradient(135deg, #f59e0b, #d97706)"
                  : "linear-gradient(135deg, var(--green-700), var(--green-950))"
              }}
            >
              {isSuperAdmin ? <Crown className="w-4 h-4" /> : initial}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-xl border border-stone-200 overflow-hidden">
              {/* Header */}
              <div
                className="px-4 py-4 text-white"
                style={{
                  background: isSuperAdmin
                    ? "linear-gradient(135deg, #f59e0b, #d97706)"
                    : "linear-gradient(135deg, var(--green-700), var(--green-950))"
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-base font-semibold border border-white/30">
                    {isSuperAdmin ? <Crown className="w-5 h-5" /> : initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{displayName}</div>
                    <div className="text-xs text-white/80 truncate">{user?.email || ""}</div>
                  </div>
                </div>
                {(isSuperAdmin || roleLabel) && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-semibold border border-white/30">
                    {isSuperAdmin ? (
                      <>
                        <Crown className="w-3 h-3" />
                        OWNER
                      </>
                    ) : (
                      roleLabel
                    )}
                  </div>
                )}
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <button
                  onClick={() => { setOpen(false); if (setView) setView("settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition"
                >
                  <User className="w-4 h-4 text-stone-400" />
                  <span>{lang === "sw" ? "Wasifu" : "Profile"}</span>
                </button>
                <button
                  onClick={() => { setOpen(false); if (setView) setView("settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition"
                >
                  <Settings className="w-4 h-4 text-stone-400" />
                  <span>{lang === "sw" ? "Mipangilio" : "Settings"}</span>
                </button>
              </div>

              {/* Logout area */}
              <div className="border-t border-stone-200 p-2">
                {!confirmLogout ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">{lang === "sw" ? "Toka" : "Sign out"}</span>
                  </button>
                ) : (
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-800">
                        {lang === "sw"
                          ? "Una uhakika unataka kutoka?"
                          : "Are you sure you want to sign out?"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmLogout(false)}
                        disabled={signingOut}
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                      >
                        {lang === "sw" ? "Ghairi" : "Cancel"}
                      </button>
                      <button
                        onClick={handleLogout}
                        disabled={signingOut}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {signingOut ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>{lang === "sw" ? "Inatoka..." : "Signing out..."}</span>
                          </>
                        ) : (
                          <>
                            <LogOut className="w-3 h-3" />
                            <span>{lang === "sw" ? "Ndio, Toka" : "Yes, sign out"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
