import { useLang } from "../contexts/LangContext";

const STYLES = {
  active: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  paid: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  present: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  available: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  trial: "bg-amber-100 text-amber-800 ring-amber-200",
  pending: "bg-amber-100 text-amber-800 ring-amber-200",
  partial: "bg-amber-100 text-amber-800 ring-amber-200",
  inactive: "bg-stone-100 text-stone-700 ring-stone-200",
  expired: "bg-red-100 text-red-800 ring-red-200",
  overdue: "bg-red-100 text-red-800 ring-red-200",
  absent: "bg-red-100 text-red-800 ring-red-200",
  borrowed: "bg-blue-100 text-blue-800 ring-blue-200"
};

export default function StatusPill({ status }) {
  const { t } = useLang();
  const key = String(status || "").toLowerCase();
  const cls = STYLES[key] || "bg-stone-100 text-stone-700 ring-stone-200";
  const label = t[key] || status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}
