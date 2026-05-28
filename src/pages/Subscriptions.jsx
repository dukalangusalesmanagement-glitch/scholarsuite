import { Loader2, CreditCard, CheckCircle2 } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import { formatTZS } from "../lib/api";
import PageHeader from "../components/PageHeader";
import StatusPill from "../components/StatusPill";

const PLANS = [
  { key: "basic", priceFrom: 500000, features: ["1 school", "Up to 300 students", "Basic reports", "Email support"] },
  { key: "standard", priceFrom: 1200000, features: ["1 school", "Up to 800 students", "All modules", "Priority email"] },
  { key: "premium", priceFrom: 2500000, features: ["1 school", "Unlimited students", "Advanced analytics", "Phone support"] },
  { key: "enterprise", priceFrom: 4800000, features: ["Multiple schools", "Unlimited everything", "Dedicated CSM", "SLA"] }
];

export default function Subscriptions() {
  const { t, lang } = useLang();
  const { rows: schools, loading } = useResource("schools", { orderBy: "created_at" });

  const countPlan = (k) => schools.filter((s) => s.plan === k).length;
  const revPlan = (k) => schools.filter((s) => s.plan === k && s.status === "active").reduce((s, x) => s + Number(x.monthly_fee || 0), 0);

  return (
    <div>
      <PageHeader title={t.subscriptionsNav} subtitle={lang === "sw" ? "Mipango ya usajili na mapato" : "Subscription tiers & revenue"} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {PLANS.map((p, i) => {
          const isHighlight = p.key === "premium";
          return (
            <div key={i} className={`rounded-2xl p-5 border ${isHighlight ? "shadow-lift" : "border-stone-200 bg-white"}`} style={isHighlight ? { background: "var(--green-950)", borderColor: "var(--green-950)", color: "white" } : {}}>
              <div className="flex items-center gap-2 mb-3"><CreditCard className={`h-5 w-5 ${isHighlight ? "text-emerald-300" : "text-emerald-700"}`} /><h3 className={`display text-2xl ${isHighlight ? "text-white" : ""}`} style={isHighlight ? {} : { color: "var(--green-950)" }}>{t[p.key]}</h3></div>
              <p className={`text-3xl display mb-1 ${isHighlight ? "text-white" : ""}`} style={isHighlight ? {} : { color: "var(--green-950)" }}>{formatTZS(p.priceFrom)}</p>
              <p className={`text-xs uppercase tracking-wider mb-4 ${isHighlight ? "text-emerald-300/70" : "text-stone-500"}`}>{lang === "sw" ? "kwa mwezi, kuanzia" : "per month, from"}</p>
              <div className={`pt-3 border-t ${isHighlight ? "border-white/20" : "border-stone-100"}`}>
                <p className={`text-xs uppercase tracking-wider ${isHighlight ? "text-emerald-300/70" : "text-stone-500"}`}>{t.schools}</p>
                <p className={`display text-2xl ${isHighlight ? "text-emerald-300" : ""}`} style={isHighlight ? {} : { color: "var(--green-800)" }}>{countPlan(p.key)}</p>
                <p className={`text-xs mt-2 ${isHighlight ? "text-emerald-100/80" : "text-stone-600"}`}>{formatTZS(revPlan(p.key))} / mo</p>
              </div>
              <ul className={`text-xs space-y-1.5 mt-4 ${isHighlight ? "text-emerald-100/80" : "text-stone-600"}`}>
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-1.5"><CheckCircle2 className={`h-3.5 w-3.5 ${isHighlight ? "text-emerald-300" : "text-emerald-600"}`} /> {f}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
            <tr><th className="px-4 py-3 font-medium">{t.schoolName}</th><th className="px-4 py-3 font-medium">{t.plan}</th><th className="px-4 py-3 font-medium">{t.monthlyRevenue}</th><th className="px-4 py-3 font-medium">{t.status}</th><th className="px-4 py-3 font-medium">{t.activeStudents}</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? <tr><td colSpan={5} className="py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></td></tr> :
             schools.length === 0 ? <tr><td colSpan={5} className="py-16 text-center text-stone-400">{t.noData}</td></tr> :
             schools.map((s) => (
               <tr key={s.id} className="hover:bg-stone-50/50">
                 <td className="px-4 py-3 font-medium text-stone-900">{s.name}</td>
                 <td className="px-4 py-3 capitalize text-stone-700">{t[s.plan] || s.plan}</td>
                 <td className="px-4 py-3 font-medium">{formatTZS(s.monthly_fee)}</td>
                 <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                 <td className="px-4 py-3 text-stone-700">{(s.student_count || 0).toLocaleString()}</td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
