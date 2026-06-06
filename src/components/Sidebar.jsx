import * as Icons from "lucide-react";
import { useMemo } from "react";
import { useLang } from "../contexts/LangContext";
import { useAuth } from "../contexts/AuthContext";
import { useSchool } from "../hooks/useSchool";
import { getMenuForUser } from "../lib/menu";
import { getRoleLabel, canAccess } from "../lib/permissions";

export default function Sidebar({ view, setView, onClose }) {
  const { t, lang } = useLang();
  const { user, profile, isSuperAdmin } = useAuth();
  const { schoolName, isPlatform } = useSchool();

  // Pick the right menu for this user (platform vs school)
  const baseMenu = useMemo(
    () => getMenuForUser({ role: profile?.role, isSuperAdmin }),
    [profile?.role, isSuperAdmin]
  );

  // Build user context for permission checks
  const ctx = useMemo(() => ({
    role: profile?.role,
    email: user?.email,
    isSuperAdmin
  }), [profile?.role, user?.email, isSuperAdmin]);

  // Filter menu items by role — hide groups with no visible items
  const visibleGroups = useMemo(() => {
    return baseMenu
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => canAccess(ctx, item.key))
      }))
      .filter((group) => group.items.length > 0);
  }, [baseMenu, ctx]);

  // Theme: platform owner gets dark + amber accents; school users get green
  const theme = isPlatform
    ? {
        bg: "linear-gradient(180deg, #1c1917 0%, #0c0a09 100%)",
        accent: "#fbbf24",
        accentSoft: "rgba(251, 191, 36, 0.12)",
        accentBorder: "rgba(251, 191, 36, 0.2)",
        textMuted: "rgba(251, 191, 36, 0.6)",
        textDim: "rgba(255, 255, 255, 0.45)",
        textActive: "#fef3c7",
        activeBg: "rgba(251, 191, 36, 0.15)",
        rail: "linear-gradient(180deg, #fbbf24, #d97706)",
        avatarGrad: "linear-gradient(135deg, #fbbf24, #d97706)",
        kicker: "PLATFORM OWNER",
        tagline: lang === "sw" ? "Mfumo wa SaaS" : "SaaS Platform"
      }
    : {
        bg: "var(--green-950)",
        accent: "var(--green-400)",
        accentSoft: "rgba(16, 185, 129, 0.10)",
        accentBorder: "rgba(255, 255, 255, 0.05)",
        textMuted: "rgba(167, 243, 208, 0.55)",
        textDim: "rgba(167, 243, 208, 0.35)",
        textActive: "#fff",
        activeBg: "rgba(255, 255, 255, 0.1)",
        rail: "var(--green-400)",
        avatarGrad: "linear-gradient(135deg, var(--green-700), var(--green-400))",
        kicker: schoolName || (lang === "sw" ? "Shule" : "School"),
        tagline: lang === "sw" ? "Mfumo wa Shule" : "School System"
      };

  const fullName = profile?.full_name || profile?.email || (isPlatform ? "Platform Owner" : "User");
  const initial = (fullName || "U").trim().charAt(0).toUpperCase();
  const roleText = getRoleLabel(profile?.role || (isPlatform ? "super_admin" : null), lang);

  return (
    <aside
      className="flex h-full w-64 flex-col"
      style={{ background: theme.bg }}
    >
      {/* Brand header */}
      <div
        className="px-5 py-5 border-b"
        style={{ borderColor: theme.accentBorder }}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col min-w-0 flex-1">
            <img
              src="/classlink-logo-white.svg"
              alt="ClassLink"
              className="h-7 w-auto"
            />
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ background: theme.accent }}
              />
              <p
                className="text-[10px] uppercase tracking-[0.15em] font-semibold truncate"
                style={{ color: theme.textMuted }}
              >
                {theme.kicker}
              </p>
            </div>
            <p
              className="text-[9px] uppercase tracking-[0.2em] mt-0.5 truncate"
              style={{ color: theme.textDim }}
            >
              {theme.tagline}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-white/60 hover:text-white p-1 -mt-1"
            >
              <Icons.X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {visibleGroups.map((group, gi) => (
          <div key={gi} className="mb-5">
            <p
              className="px-3 mb-2 text-[10px] uppercase tracking-[0.15em] font-medium"
              style={{ color: theme.textDim }}
            >
              {group.label[lang]}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = Icons[item.icon] || Icons.Circle;
                const active = view === item.key;
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => { setView(item.key); onClose?.(); }}
                      className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition"
                      style={{
                        background: active ? theme.activeBg : "transparent",
                        color: active ? theme.textActive : theme.textMuted
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = theme.accentSoft;
                          e.currentTarget.style.color = theme.textActive;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = theme.textMuted;
                        }
                      }}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full"
                          style={{ background: theme.rail }}
                        />
                      )}
                      <Icon
                        className="h-4 w-4"
                        strokeWidth={active ? 2.25 : 1.75}
                        style={{ color: active ? theme.accent : "currentColor" }}
                      />
                      <span className="truncate">{t[item.labelKey] || item.labelKey}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="border-t p-3" style={{ borderColor: theme.accentBorder }}>
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2.5"
          style={{ background: theme.accentSoft }}
        >
          <div
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-semibold shadow-sm"
            style={{ background: theme.avatarGrad }}
          >
            {isPlatform ? <Icons.Crown className="h-4 w-4" /> : initial}
            {isPlatform && (
              <span
                className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 flex items-center justify-center"
                style={{ background: "#fbbf24", ringColor: "#1c1917" }}
              >
                <Icons.Sparkles className="h-2 w-2 text-stone-900" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p
                className="text-[13px] font-medium truncate"
                style={{ color: theme.textActive }}
              >
                {fullName}
              </p>
              {isPlatform && (
                <span
                  className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                  style={{ background: theme.accent, color: "#1c1917" }}
                >
                  OWNER
                </span>
              )}
            </div>
            <p
              className="text-[10px] uppercase tracking-wider truncate font-medium"
              style={{ color: theme.textMuted }}
            >
              {roleText}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
