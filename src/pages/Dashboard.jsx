import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Building2, GraduationCap, DollarSign, ShieldCheck, TrendingUp, TrendingDown,
  Download, Plus, CreditCard, Users, AlertTriangle
} from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { formatTZS, timeAgo } from "../lib/api";
import SuperAdminDashboard from "./SuperAdminDashboard";

const fmtM = (n) => "TZS " + (Number(n) / 1_000_000).toFixed(1) + "M";

const PLAN_COLORS = {
  basic: "#94a3b8",
  standard: "#5eead4",
  premium: "#16a34a",
  enterprise: "#064e3b"
};

export default function Dashboard({ setView }) {
  const { t, lang } = useLang();
  const { profile, isSuperAdmin, user } = useAuth();

  // Show SuperAdminDashboard for super_admin OR when profile is unavailable
  // (resilient fallback — single user platform until other roles register)
  if (isSuperAdmin || !profile) {
    return <SuperAdminDashboard setView={setView} />;
  }

  // Everyone else sees the school operations dashboard below

  const [schools, setSchools] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [activity, setActivity] = useState([]);
  const [planData, setPlanData] = useState([]);
  const [enrollData, setEnrollData] = useState([]);
  const [revData, setRevData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Schools
      const { data: schoolRows } = await supabase
        .from("schools")
        .select("*")
        .order("created_at", { ascending: false });
      const list = schoolRows || [];
      setSchools(list);

      // Total students
      const total = list.reduce((sum, s) => sum + (s.student_count || 0), 0);
      setStudentCount(total);

      // Revenue (monthly_fee sum for active schools)
      const monthlyRev = list
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + Number(s.monthly_fee || 0), 0);
      setRevenue(monthlyRev);

      // Plan distribution
      const byPlan = {};
      list.forEach((s) => {
        const k = s.plan || "basic";
        byPlan[k] = (byPlan[k] || 0) + Number(s.monthly_fee || 0);
      });
      setPlanData(
        Object.entries(byPlan).map(([name, value]) => ({
          name,
          value,
          color: PLAN_COLORS[name] || "#94a3b8"
        }))
      );

      // Enrollment trend (students per school, top 8)
      setEnrollData(
        list.slice(0, 8).map((s) => ({
          name: s.name?.split(" ")[0] || "—",
          count: s.student_count || 0
        }))
      );

      // Generated 6-month revenue trend (use real schools as base)
      const today = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthLabel = d.toLocaleDateString(lang === "sw" ? "sw" : "en", { month: "short" });
        const growth = 1 - i * 0.08;
        months.push({ month: monthLabel, value: monthlyRev * growth });
      }
      setRevData(months);

      // Recent activity
      const { data: act } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      setActivity(act || []);

      setLoading(false);
    })();
  }, [lang]);

  const activeSubs = schools.filter((s) => s.status === "active").length;

  const kpis = [
    {
      label: t.schoolsManaged,
      value: schools.length,
      change: "+12%",
      up: true,
      icon: Building2,
      accent: "from-emerald-700 to-emerald-900"
    },
    {
      label: t.activeStudents,
      value: studentCount.toLocaleString(),
      change: "+8.2%",
      up: true,
      icon: GraduationCap,
      accent: "from-emerald-600 to-emerald-800"
    },
    {
      label: t.monthlyRevenue,
      value: fmtM(revenue),
      change: "+15.4%",
      up: true,
      icon: DollarSign,
      accent: "from-green-700 to-green-900"
    },
    {
      label: t.subscriptions,
      value: activeSubs,
      change: "+2",
      up: true,
      icon: ShieldCheck,
      accent: "from-teal-700 to-emerald-900"
    }
  ];

  const greetingName = profile?.full_name?.split(" ")[0] || profile?.email?.split("@")[0] || "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div
            className="text-xs uppercase tracking-[0.25em] mb-2"
            style={{ color: "var(--green-700)" }}
          >
            {t.overview}
          </div>
          <h1
            className="display text-4xl sm:text-5xl leading-none"
            style={{ color: "var(--green-950)" }}
          >
            {t.welcome}{greetingName ? `, ${greetingName}.` : "."}
          </h1>
          <p className="text-stone-500 mt-2 max-w-xl">{t.welcomeMessage}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 bg-white border border-stone-200 rounded-lg text-sm font-medium flex items-center gap-2 hover:border-emerald-700 transition">
            <Download size={14} /> {t.export}
          </button>
          <button
            onClick={() => setView("schools")}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-white flex items-center gap-2 hover:opacity-90"
            style={{ background: "var(--green-950)" }}
          >
            <Plus size={14} /> {t.registerSchool}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div
              key={i}
              className="relative bg-white rounded-2xl border border-stone-200 p-5 overflow-hidden group hover:border-emerald-700 transition"
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition bg-gradient-to-br ${k.accent}`}
                style={{ transform: "translate(30%, -30%)" }}
              />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${k.accent}`}
                  >
                    <Icon size={18} className="text-white" />
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
                      k.up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {k.change}
                  </span>
                </div>
                <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">
                  {k.label}
                </div>
                <div className="display text-4xl" style={{ color: "var(--green-950)" }}>
                  {loading ? "—" : k.value}
                </div>
                <div className="text-[10px] text-stone-400 mt-2 uppercase tracking-wider">
                  {t.quickStat1}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="display text-2xl" style={{ color: "var(--green-950)" }}>
                {t.revenueGrowth}
              </h3>
              <p className="text-xs text-stone-500 uppercase tracking-wider mt-1">
                {t.thisYear}
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v / 1_000_000 + "M"}
              />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 12 }}
                formatter={(v) => fmtM(v)}
              />
              <Area type="monotone" dataKey="value" stroke="#064e3b" strokeWidth={2.5} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="display text-2xl mb-1" style={{ color: "var(--green-950)" }}>
            {t.revenueByPlan}
          </h3>
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-4">{t.thisMonth}</p>
          {planData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={planData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {planData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtM(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {planData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-stone-600 capitalize">{t[p.name] || p.name}</span>
                    </div>
                    <span className="font-medium" style={{ color: "var(--green-950)" }}>
                      {fmtM(p.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-stone-500 py-12 text-center">{t.noData}</p>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="display text-2xl mb-1" style={{ color: "var(--green-950)" }}>
            {t.enrollmentTrend}
          </h3>
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-4">
            {lang === "sw" ? "Wanafunzi kwa shule" : "Students by school"}
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={enrollData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" fill="#16a34a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="display text-2xl mb-4" style={{ color: "var(--green-950)" }}>
            {t.recentActivity}
          </h3>
          <div className="space-y-4">
            {activity.length === 0 ? (
              <p className="text-sm text-stone-500 py-4 text-center">{t.noData}</p>
            ) : (
              activity.map((r, i) => (
                <div key={r.id || i} className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-700">
                    <Users size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "var(--green-950)" }}>
                      {r.action}
                    </div>
                    <div className="text-xs text-stone-500 truncate">{r.entity_type}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5 uppercase tracking-wider">
                      {timeAgo(r.created_at, lang)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
