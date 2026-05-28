/**
 * Sidebar navigation configuration
 * Menu access per role is enforced via src/lib/permissions.js
 */

export const menuGroups = [
  {
    label: { en: "Overview", sw: "Muhtasari" },
    items: [
      { key: "dashboard", icon: "LayoutDashboard", labelKey: "overview" }
    ]
  },
  {
    label: { en: "Tenants", sw: "Wateja" },
    items: [
      { key: "schools", icon: "Building2", labelKey: "schools" },
      { key: "subscriptions", icon: "CreditCard", labelKey: "subscriptionsNav" }
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

export default menuGroups;
