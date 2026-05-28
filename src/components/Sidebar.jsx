import * as Icons from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useAuth } from "../contexts/AuthContext";
import { menuGroups } from "../lib/menu";
import { canAccess, getRoleLabel } from "../lib/permissions";

export default function Sidebar({ view, setView, onClose }) {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const role = profile?.role;

  // Filter groups by role — only show groups that have at least one accessible item
  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(role, item.key))
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className="flex h-full w-64 flex-col"
      style={{ background: "var(--green-950)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
        <div className="flex flex-col">
          <img
            src="/classlink-logo-white.svg"
            alt="ClassLink"
            className="h-7 w-auto"
          />
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/60 mt-2 pl-1">
            {lang === "sw" ? "Mfumo wa Shule" : "School System"}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-white/60 hover:text-white p-1"
          >
            <Icons.X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {visibleGroups.map((group, gi) => (
          <div key={gi} className="mb-5">
            <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.15em] text-emerald-300/40">
              {group.label[lang]}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = Icons[item.icon] || Icons.Circle;
                const active = view === item.key;
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => {
                        setView(item.key);
                        onClose?.();
                      }}
                      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-emerald-100/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full"
                          style={{ background: "var(--green-400)" }}
                        />
                      )}
                      <Icon
                        className={`h-4 w-4 ${active ? "text-emerald-300" : ""}`}
                        strokeWidth={active ? 2.25 : 1.75}
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

      {/* User mini */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-white/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400 text-emerald-950 text-sm font-semibold">
            {(profile?.full_name || profile?.email || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white truncate">
              {profile?.full_name || profile?.email || t.superAdmin}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-emerald-300/80 truncate">
              {getRoleLabel(profile?.role, lang)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
