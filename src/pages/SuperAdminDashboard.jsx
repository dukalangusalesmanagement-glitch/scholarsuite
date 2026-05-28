import { useEffect, useState } from "react";
import {
  Building2, Users, DollarSign, TrendingUp, Plus, MapPin,
  ArrowUpRight, Sparkles, Zap, Activity, Crown, BarChart3
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useLang } from "../contexts/LangContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { formatTZS, timeAgo } from "../lib/api";

const fmtM = (n) => "TZS " + (Number(n) / 1_000_000).toFixed(1) + "M";

const PLAN_COLORS = {
  basic: "#94a3b8",
  standard: "#5eead4",
  premium: "#16a34a",
  enterprise: "#064e3b"
};

export default function SuperAdminDashboard({ setView }) {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [data, setData] = useState({
    schools: [],
    profiles: [],
    activity: [],
    loading: true
  });

  useEffect(() => {
    (async () => {
      try {
        const [s, p, a] = await Promise.all([
          supabase.from("schools").select("*").order("created_at", { ascending: false }),
          supabase.from("profiles").select("id, role, school_id, created_at"),
          supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(8)
        ]);
        setData({
          schools: s.data || [],
          profiles: p.data || [],
          activity: a.data || [],
          loading: false
        });
      } catch (e) {
        console.error("Dashboard load failed:", e);
        setData((d) => ({ ...d, loading: false }));
      }
    })();
  }, []);

  const { schools, profiles, activity, loading } = data;

  // Compute metrics
  const totalSchools = schools.length;
  const activeSchools = schools.filter((s) => s.status === "active").length;
  const trialSchools = schools.filter((s) => s.status === "trial").length;
  const totalUsers = profiles.length;
  const totalStudents = schools.reduce((sum, s) => sum + (s.student_count || 0), 0);
  const mrr = schools
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + Number(s.monthly_fee || 0), 0);
  const conversionRate = totalSchools > 0 ? Math.round((activeSchools / totalSchools) * 100) : 0;

  // Revenue trend (6-month simulated growth based on current MRR)
  const today = new Date();
  const revenueTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    revenueTrend.push({
      month: d.toLocaleDateString(lang === "sw" ? "sw" : "en", { month: "short" }),
      revenue: mrr * Math.pow(0.92, i)
    });
  }

  // Plan distribution
  const byPlan = {};
  schools.forEach((s) => {
    const k = s.plan || "basic";
    byPlan[k] = (byPlan[k] || 0) + Number(s.monthly_fee || 0);
  });
  const planData = Object.entries(byPlan).map(([name, value]) => ({
    name,
    value,
    color: PLAN_COLORS[name] || "#94a3b8"
  }));

  // Schools by region
  const byRegion = {};
  schools.forEach((s) => {
    const r = s.region || "Other";
    byRegion[r] = (byRegion[r] || 0) + 1;
  });
  const regionData = Object.entries(byRegion).map(([name, count]) => ({ name, count }));

  // Top & recent
  const topSchools = [...schools]
    .sort((a, b) => (b.monthly_fee || 0) - (a.monthly_fee || 0))
    .slice(0, 5);
  const recentSchools = schools.slice(0, 5);

  const firstName =
    profile?.first_name ||
    profile?.full_name?.split(" ")[0] ||
    profile?.email?.split("@")[0] ||
    "Admin";

  const kpis = [
    {
      label: lang === "sw" ? "Shule zote" : "Total Schools",
      value: totalSchools,
      sub: `${activeSchools} ${lang === "sw" ? "hai" : "active"} • ${trialSchools} ${lang === "sw" ? "jaribio" : "trial"}`,
      icon: Building2,
      gradient: "from-emerald-500 to-emerald-700",
      change: "+12%"
    },
    {
      label: lang === "sw" ? "Watumiaji" : "Total Users",
      value: totalUsers,
      sub: `${totalStudents.toLocaleString()} ${lang === "sw" ? "wanafunzi" : "students"}`,
      icon: Users,
      gradient: "from-teal-500 to-emerald-700",
      change: "+8%"
    },
    {
      label: lang === "sw" ? "Mapato ya Mwezi" : "Monthly Revenue",
      value: fmtM(mrr),
      sub: lang === "sw" ? "kutoka shule hai" : "from active subs",
      icon: DollarSign,
      gradient: "from-green-600 to-emerald-800",
      change: "+15%"
    },
    {
      label: lang === "sw" ? "Conversion Rate" : "Conversion Rate",
      value: conversionRate + "%",
      sub: lang === "sw" ? "trial → active" : "trial → active",
      icon: Activity,
      gradient: "from-emerald-600 to-green-900",
      change: "+5%"
    }
  ];

  return (
    <div className="space-y-6">
      {/* HERO — Command Center */}
      <div
        className="relative rounded-3xl overflow-hidden p-8 md:p-12"
        style={{ background: "linear-gradient(135deg, #064e3b 0%, #022c1e 60%, #014737 100%)" }}
      >
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20"
          style={{ background: "var(--green-400)", filter: "blur(80px)", transform: "translate(30%, -30%)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full opacity-10"
          style={{ background: "var(--green-400)", filter: "blur(60px)" }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4" style={{ color: "var(--green-400)" }} />
            <span className="text-[11px] uppercase tracking-[0.3em] text-emerald-300">
              {lang === "sw" ? "Kituo cha Udhibiti" : "Command Center"}
            </span>
          </div>
          <h1 className="display text-4xl md:text-6xl text-white leading-[1.05]">
            {lang === "sw" ? "Habari" : "Hello"}, {firstName}.
          </h1>
          <p className="display text-2xl md:text-4xl italic mt-1" style={{ color: "var(--green-300)" }}>
            {lang === "sw" ? "Mfumo wako wa ClassLink." : "Your ClassLink platform."}
          </p>
          <p className="mt-4 text-emerald-100/70 max-w-xl text-sm md:text-base">
            {lang === "sw"
              ? "Simamia shule zote, usajili, mapato, na watumiaji kutoka dashibodi moja yenye nguvu."
              : "Manage all schools, subscriptions, revenue, and users from one powerful dashboard."}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <button
              onClick={() => setView("schools")}
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium hover:bg-emerald-50 transition"
              style={{ color: "var(--green-950)" }}
            >
              <Plus className="h-4 w-4" />
              {lang === "sw" ? "Sajili Shule Mpya" : "Add New School"}
            </button>
            <button
              onClick={() => setView("staff")}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition backdrop-blur"
            >
              <Users className="h-4 w-4" />
              {lang === "sw" ? "Watumiaji" : "Manage Users"}
            </button>
            <button
              onClick={() => setView("subscriptions")}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition backdrop-blur"
            >
              <Zap className="h-4 w-4" />
              {lang === "sw" ? "Usajili" : "Subscriptions"}
            </button>
            <button
              onClick={() => setView("reports")}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition backdrop-blur"
            >
              <BarChart3 className="h-4 w-4" />
              {lang === "sw" ? "Ripoti" : "Reports"}
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div
              key={i}
              className="relative bg-white rounded-2xl border border-stone-200 p-5 overflow-hidden group hover:shadow-lift transition"
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition bg-gradient-to-br ${k.gradient}`}
                style={{ transform: "translate(30%, -30%)" }}
              />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${k.gradient}`}
                  >
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <TrendingUp size={10} /> {k.change}
                  </span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-stone-500 mb-1">
                  {k.label}
                </div>
                <div className="display text-3xl leading-none" style={{ color: "var(--green-950)" }}>
                  {loading ? "—" : k.value}
                </div>
                <p className="text-[11px] text-stone-500 mt-2 truncate">{k.sub}</p>
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
                {lang === "sw" ? "Mwelekeo wa Mapato" : "Revenue Trend"}
              </h3>
              <p className="text-xs text-stone-500 uppercase tracking-wider mt-1">
                {lang === "sw" ? "Miezi 6 iliyopita" : "Last 6 months"}
              </p>
            </div>
            <button
              onClick={() => setView("reports")}
              className="text-xs text-emerald-700 hover:underline flex items-center gap-1"
            >
              {lang === "sw" ? "Zaidi" : "Details"} <ArrowUpRight size={12} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
              />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 12 }}
                formatter={(v) => fmtM(v)}
              />
              <Area type="monotone" dataKey="revenue" stroke="#064e3b" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="display text-2xl mb-1" style={{ color: "var(--green-950)" }}>
            {lang === "sw" ? "Mipango" : "Plans"}
          </h3>
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-4">
            {lang === "sw" ? "Mgawanyo wa mapato" : "Revenue split"}
          </p>
          {planData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={planData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {planData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtM(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {planData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-stone-600 capitalize">{p.name}</span>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="display text-2xl" style={{ color: "var(--green-950)" }}>
              {lang === "sw" ? "Shule za Hivi Karibuni" : "Recent Schools"}
            </h3>
            <button
              onClick={() => setView("schools")}
              className="text-xs text-emerald-700 hover:underline flex items-center gap-1"
            >
              {lang === "sw" ? "Zote" : "View all"} <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {loading ? (
              <p className="text-sm text-stone-400 py-4 text-center">Loading...</p>
            ) : recentSchools.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">{t.noData}</p>
            ) : (
              recentSchools.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
                    style={{ background: "var(--green-700)" }}
                  >
                    {s.name?.slice(0, 1)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{s.name}</p>
                    <p className="text-xs text-stone-500 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> {s.region}
                      <span className="text-stone-300">•</span>
                      <span className="capitalize">{s.plan}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium" style={{ color: "var(--green-950)" }}>
                      {formatTZS(s.monthly_fee)}
                    </p>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        s.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : s.status === "trial"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="display text-2xl mb-1" style={{ color: "var(--green-950)" }}>
            {lang === "sw" ? "Mikoa" : "Regions"}
          </h3>
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-4">
            {lang === "sw" ? "Shule kwa eneo" : "Schools by location"}
          </p>
          {regionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={regionData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip cursor={{ fill: "#f3f4f6" }} />
                <Bar dataKey="count" fill="#16a34a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-stone-500 py-12 text-center">{t.noData}</p>
          )}
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="display text-2xl mb-4" style={{ color: "var(--green-950)" }}>
            {lang === "sw" ? "Shule Bora kwa Mapato" : "Top Schools by Revenue"}
          </h3>
          <div className="space-y-2">
            {topSchools.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">{t.noData}</p>
            ) : (
              topSchools.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50">
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background:
                        i === 0 ? "#fbbf24" : i === 1 ? "#9ca3af" : i === 2 ? "#fdba74" : "#f3f4f6",
                      color: i < 3 ? "white" : "#6b7280"
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{s.name}</p>
                    <p className="text-xs text-stone-500">
                      {(s.student_count || 0).toLocaleString()} {lang === "sw" ? "wanafunzi" : "students"} •{" "}
                      <span className="capitalize">{s.plan}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--green-950)" }}>
                      {formatTZS(s.monthly_fee)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="display text-2xl mb-4" style={{ color: "var(--green-950)" }}>
            {lang === "sw" ? "Shughuli" : "Activity"}
          </h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">{t.noData}</p>
            ) : (
              activity.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-700">
                    <Activity size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-stone-900 truncate">{a.action}</p>
                    {a.entity_type && (
                      <p className="text-[10px] text-stone-500 truncate">{a.entity_type}</p>
                    )}
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider mt-0.5">
                      {timeAgo(a.created_at, lang)}
                    </p>
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
