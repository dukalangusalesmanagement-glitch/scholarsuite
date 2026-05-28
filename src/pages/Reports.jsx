import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp, DollarSign, Users, Building2 } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { supabase } from "../lib/supabase";
import { formatTZS } from "../lib/api";
import PageHeader from "../components/PageHeader";

const fmtM = (n) => "TZS " + (Number(n) / 1_000_000).toFixed(1) + "M";

export default function Reports() {
  const { t, lang } = useLang();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    schoolCount: 0,
    studentCount: 0,
    teacherCount: 0,
    revenue: 0,
    expenses: 0,
    feesPaid: 0,
    feesPending: 0,
    collectionRate: 0
  });
  const [perSchool, setPerSchool] = useState([]);
  const [planDist, setPlanDist] = useState([]);

  useEffect(() => {
    (async () => {
      const [schoolsRes, teachersRes, feesRes, payrollRes] = await Promise.all([
        supabase.from("schools").select("*"),
        supabase.from("teachers").select("id"),
        supabase.from("fees").select("amount, amount_paid, status"),
        supabase.from("payroll").select("net_salary, paid")
      ]);

      const schools = schoolsRes.data || [];
      const fees = feesRes.data || [];
      const payroll = payrollRes.data || [];

      const studentCount = schools.reduce((s, x) => s + (x.student_count || 0), 0);
      const revenue = schools.reduce((s, x) => s + Number(x.monthly_fee || 0), 0);
      const feesPaid = fees.reduce((s, f) => s + Number(f.amount_paid || 0), 0);
      const feesPending = fees.reduce((s, f) => s + (Number(f.amount || 0) - Number(f.amount_paid || 0)), 0);
      const totalFees = feesPaid + feesPending;
      const collectionRate = totalFees > 0 ? Math.round((feesPaid / totalFees) * 100) : 0;
      const expenses = payroll.filter((p) => p.paid).reduce((s, p) => s + Number(p.net_salary || 0), 0);

      setStats({
        schoolCount: schools.length,
        studentCount,
        teacherCount: (teachersRes.data || []).length,
        revenue,
        expenses,
        feesPaid,
        feesPending,
        collectionRate
      });

      setPerSchool(schools.slice(0, 10).map((s) => ({
        name: (s.name || "—").split(" ")[0],
        revenue: Number(s.monthly_fee || 0) / 1_000_000,
        students: s.student_count || 0
      })));

      const byPlan = {};
      schools.forEach((s) => { byPlan[s.plan || "basic"] = (byPlan[s.plan || "basic"] || 0) + 1; });
      const colors = { basic: "#94a3b8", standard: "#5eead4", premium: "#16a34a", enterprise: "#064e3b" };
      setPlanDist(Object.entries(byPlan).map(([k, v]) => ({ name: k, value: v, color: colors[k] || "#94a3b8" })));

      setLoading(false);
    })();
  }, []);

  const kpis = [
    { label: t.schoolsManaged, value: stats.schoolCount, icon: Building2 },
    { label: t.activeStudents, value: stats.studentCount.toLocaleString(), icon: Users },
    { label: t.income, value: fmtM(stats.revenue), icon: DollarSign },
    { label: t.collectionRate, value: stats.collectionRate + "%", icon: TrendingUp }
  ];

  return (
    <div>
      <PageHeader title={t.reports} subtitle={lang === "sw" ? "Muhtasari wa utendaji" : "Performance overview"} />

      {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-stone-400" /></div> :
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "var(--green-100)", color: "var(--green-800)" }}><Icon className="h-5 w-5" /></div>
                </div>
                <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">{k.label}</p>
                <p className="display text-3xl" style={{ color: "var(--green-950)" }}>{k.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <p className="text-xs uppercase tracking-wider text-stone-500">{t.income}</p>
            <p className="display text-3xl text-emerald-700 mt-1">{formatTZS(stats.feesPaid)}</p>
            <p className="text-xs text-stone-500 mt-2">{lang === "sw" ? "Fees zilizolipwa" : "Fees collected"}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <p className="text-xs uppercase tracking-wider text-stone-500">{t.expenses}</p>
            <p className="display text-3xl text-red-600 mt-1">{formatTZS(stats.expenses)}</p>
            <p className="text-xs text-stone-500 mt-2">{lang === "sw" ? "Mishahara iliyolipwa" : "Salaries paid"}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <p className="text-xs uppercase tracking-wider text-stone-500">{t.netProfit}</p>
            <p className="display text-3xl mt-1" style={{ color: "var(--green-950)" }}>{formatTZS(stats.feesPaid - stats.expenses)}</p>
            <p className="text-xs text-stone-500 mt-2">{t.thisMonth}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-stone-200 p-5">
            <h3 className="display text-2xl mb-4" style={{ color: "var(--green-950)" }}>{t.revenueByPlan}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={perSchool}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} name="Revenue (M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h3 className="display text-2xl mb-4" style={{ color: "var(--green-950)" }}>{t.subscriptionPlan}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={planDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {planDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-3">
              {planDist.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} /><span className="text-stone-600 capitalize">{t[p.name] || p.name}</span></div>
                  <span className="font-medium" style={{ color: "var(--green-950)" }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>}
    </div>
  );
}
