import { useState, lazy, Suspense, useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LangContext";
import { canAccess } from "../lib/permissions";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Schools = lazy(() => import("../pages/Schools"));
const Staff = lazy(() => import("../pages/Staff"));
const Students = lazy(() => import("../pages/Students"));
const Teachers = lazy(() => import("../pages/Teachers"));
const Fees = lazy(() => import("../pages/Fees"));
const Attendance = lazy(() => import("../pages/Attendance"));
const Exams = lazy(() => import("../pages/Exams"));
const Classes = lazy(() => import("../pages/Classes"));
const Subjects = lazy(() => import("../pages/Subjects"));
const Timetable = lazy(() => import("../pages/Timetable"));
const Library = lazy(() => import("../pages/Library"));
const Hostel = lazy(() => import("../pages/Hostel"));
const Transport = lazy(() => import("../pages/Transport"));
const Payroll = lazy(() => import("../pages/Payroll"));
const Inventory = lazy(() => import("../pages/Inventory"));
const Discipline = lazy(() => import("../pages/Discipline"));
const Events = lazy(() => import("../pages/Events"));
const Communications = lazy(() => import("../pages/Communications"));
const Reports = lazy(() => import("../pages/Reports"));
const Subscriptions = lazy(() => import("../pages/Subscriptions"));
const Settings = lazy(() => import("../pages/Settings"));

const ROUTES = {
  dashboard: Dashboard,
  schools: Schools,
  staff: Staff,
  students: Students,
  teachers: Teachers,
  fees: Fees,
  attendance: Attendance,
  exams: Exams,
  classes: Classes,
  subjects: Subjects,
  timetable: Timetable,
  library: Library,
  hostel: Hostel,
  transport: Transport,
  payroll: Payroll,
  inventory: Inventory,
  discipline: Discipline,
  events: Events,
  communications: Communications,
  reports: Reports,
  subscriptions: Subscriptions,
  settings: Settings
};

function LoadingScreen() {
  return (
    <div className="flex h-full items-center justify-center p-12">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--green-700)" }} />
    </div>
  );
}

function AccessDenied({ onBack }) {
  const { t, lang } = useLang();
  return (
    <div className="flex h-full items-center justify-center p-12">
      <div className="text-center max-w-md">
        <div
          className="inline-flex h-16 w-16 items-center justify-center rounded-full mb-4"
          style={{ background: "#fee2e2", color: "#991b1b" }}
        >
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="display text-3xl mb-2" style={{ color: "var(--green-950)" }}>
          {lang === "sw" ? "Hauruhusiwi" : "Access Denied"}
        </h2>
        <p className="text-sm text-stone-600 mb-6">
          {lang === "sw"
            ? "Akaunti yako haina ruhusa ya kuona ukurasa huu. Wasiliana na msimamizi."
            : "Your account does not have permission to view this page. Contact your administrator."}
        </p>
        <button
          onClick={onBack}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: "var(--green-950)" }}
        >
          {lang === "sw" ? "Rudi Dashibodi" : "Back to Dashboard"}
        </button>
      </div>
    </div>
  );
}

export default function Shell({ view, setView }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { profile } = useAuth();
  const role = profile?.role;

  // If user lands on an unauthorized page, redirect to dashboard
  const allowed = canAccess(role, view);
  const Page = ROUTES[view] || Dashboard;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--cream)" }}>
      <div className="hidden md:block flex-shrink-0">
        <Sidebar view={view} setView={setView} />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar
              view={view}
              setView={setView}
              onClose={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMobileNav={() => setMobileNavOpen(true)} setView={setView} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
            <Suspense fallback={<LoadingScreen />}>
              {allowed ? (
                <Page setView={setView} />
              ) : (
                <AccessDenied onBack={() => setView("dashboard")} />
              )}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
