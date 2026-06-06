/**
 * Sidebar navigation configuration.
 * Two distinct menu sets:
 *
 *   PLATFORM_MENU   - For Super Admin (SaaS owner). Platform/technical only.
 *                     NO school operations. Manages tenants, subscriptions, system.
 *
 *   SCHOOL_MENU     - For everyone inside a school (director, head teacher,
 *                     accountant, teachers, etc). School operations only.
 *                     Items filtered further by role in Sidebar via canAccess().
 */

// Super Admin sees ONLY platform-level features
export const PLATFORM_MENU = [
  {
    label: { en: "Platform", sw: "Mfumo wa SaaS" },
    items: [
      { key: "dashboard", icon: "LayoutDashboard", labelKey: "overview" }
    ]
  },
  {
    label: { en: "Tenant Management", sw: "Usimamizi wa Shule" },
    items: [
      { key: "schools", icon: "Building2", labelKey: "schools" },
      { key: "subscriptions", icon: "CreditCard", labelKey: "subscriptionsNav" }
    ]
  },
  {
    label: { en: "Analytics", sw: "Uchambuzi" },
    items: [
      { key: "reports", icon: "FileBarChart", labelKey: "reports" }
    ]
  },
  {
    label: { en: "System", sw: "Mfumo" },
    items: [
      { key: "settings", icon: "Settings", labelKey: "settings" }
    ]
  }
];

// School users see school operations (filtered by role)
export const SCHOOL_MENU = [
  {
    label: { en: "Overview", sw: "Muhtasari" },
    items: [
      { key: "dashboard", icon: "LayoutDashboard", labelKey: "overview" }
    ]
  },
  {
    label: { en: "People", sw: "Watu" },
    items: [
      { key: "staff", icon: "UserCog", labelKey: "staff" },
      { key: "teachers", icon: "GraduationCap", labelKey: "teachers" },
      { key: "students", icon: "Users", labelKey: "students" }
    ]
  },
  {
    label: { en: "Academic", sw: "Masomo" },
    items: [
      { key: "classes", icon: "Layers", labelKey: "classes" },
      { key: "subjects", icon: "BookOpen", labelKey: "subjects" },
      { key: "attendance", icon: "ClipboardCheck", labelKey: "attendance" },
      { key: "exams", icon: "FileText", labelKey: "examinations" },
      { key: "timetable", icon: "Calendar", labelKey: "timetable" }
    ]
  },
  {
    label: { en: "Operations", sw: "Shughuli" },
    items: [
      { key: "fees", icon: "Wallet", labelKey: "fees" },
      { key: "library", icon: "Library", labelKey: "library" },
      { key: "hostel", icon: "Bed", labelKey: "hostel" },
      { key: "transport", icon: "Bus", labelKey: "transport" },
      { key: "payroll", icon: "Briefcase", labelKey: "payroll" },
      { key: "inventory", icon: "Package", labelKey: "inventory" }
    ]
  },
  {
    label: { en: "Engagement", sw: "Mawasiliano" },
    items: [
      { key: "discipline", icon: "AlertTriangle", labelKey: "discipline" },
      { key: "events", icon: "Award", labelKey: "events" },
      { key: "communications", icon: "MessageSquare", labelKey: "communications" }
    ]
  },
  {
    label: { en: "Insights", sw: "Uchambuzi" },
    items: [
      { key: "reports", icon: "FileBarChart", labelKey: "reports" },
      { key: "settings", icon: "Settings", labelKey: "settings" }
    ]
  }
];

// Backward-compat alias (some code still imports menuGroups)
export const menuGroups = SCHOOL_MENU;

/**
 * Pick which menu the user should see.
 * Super Admin -> platform menu (no school operations)
 * Everyone else -> school menu (filtered further by role)
 */
export function getMenuForUser({ role, isSuperAdmin }) {
  if (isSuperAdmin === true || role === "super_admin") return PLATFORM_MENU;
  return SCHOOL_MENU;
}

export default { PLATFORM_MENU, SCHOOL_MENU, menuGroups, getMenuForUser };
