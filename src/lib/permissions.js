/**
 * RBAC Permissions Configuration
 * Defines which roles can access each menu/feature in the system.
 */

// All system roles
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  SCHOOL_DIRECTOR: "school_director",
  HEAD_TEACHER: "head_teacher",
  ACADEMIC_MASTER: "academic_master",
  ACCOUNTANT: "accountant",
  SUBJECT_TEACHER: "subject_teacher",
  CLASS_TEACHER: "class_teacher",
  LIBRARIAN: "librarian",
  HOSTEL_MANAGER: "hostel_manager",
  TRANSPORT_MANAGER: "transport_manager",
  SECRETARY: "secretary",
  RECEPTIONIST: "receptionist",
  NURSE: "nurse",
  STORE_KEEPER: "store_keeper",
  SECURITY_SUPERVISOR: "security_supervisor",
  HR_OFFICER: "hr_officer",
  SCHOOL_ADMIN: "school_admin", // legacy / generic
  PARENT: "parent",
  STUDENT: "student"
};

/**
 * Menu access matrix.
 * Key = menu item key (matches src/lib/menu.js & Shell routes)
 * Value = array of roles allowed. "*" means everyone.
 */
export const MENU_ACCESS = {
  dashboard: ["*"],
  schools: ["super_admin", "school_director"],
  subscriptions: ["super_admin"],
  staff: ["super_admin", "school_director", "head_teacher", "hr_officer"],
  students: ["super_admin", "school_director", "head_teacher", "academic_master", "class_teacher", "secretary"],
  teachers: ["super_admin", "school_director", "head_teacher", "hr_officer"],
  classes: ["super_admin", "school_director", "head_teacher", "academic_master"],
  subjects: ["super_admin", "school_director", "head_teacher", "academic_master"],
  attendance: ["super_admin", "school_director", "head_teacher", "academic_master", "class_teacher", "subject_teacher"],
  exams: ["super_admin", "school_director", "head_teacher", "academic_master", "subject_teacher"],
  timetable: ["super_admin", "school_director", "head_teacher", "academic_master", "subject_teacher", "class_teacher"],
  fees: ["super_admin", "school_director", "head_teacher", "accountant"],
  library: ["super_admin", "school_director", "head_teacher", "librarian"],
  hostel: ["super_admin", "school_director", "head_teacher", "hostel_manager"],
  transport: ["super_admin", "school_director", "head_teacher", "transport_manager"],
  payroll: ["super_admin", "school_director", "head_teacher", "accountant", "hr_officer"],
  inventory: ["super_admin", "school_director", "head_teacher", "store_keeper"],
  discipline: ["super_admin", "school_director", "head_teacher", "class_teacher"],
  events: ["super_admin", "school_director", "head_teacher", "secretary"],
  communications: ["super_admin", "school_director", "head_teacher", "secretary"],
  reports: ["super_admin", "school_director", "head_teacher", "accountant", "academic_master"],
  settings: ["*"]
};

/**
 * Check if a role can access a specific menu/page
 */
export function canAccess(role, menuKey) {
  if (!role) return false;
  // Super admin bypasses ALL permission checks — they own the platform
  if (role === "super_admin") return true;
  const allowed = MENU_ACCESS[menuKey];
  if (!allowed) return false;
  return allowed.includes("*") || allowed.includes(role);
}

/**
 * Get default landing page for a role (first allowed page)
 */
export function defaultPageForRole(role) {
  return "dashboard"; // everyone gets dashboard
}

/**
 * Roles that the current user is allowed to create.
 * - super_admin can create anyone
 * - school_director can create head_teacher and below
 * - head_teacher can create all staff (excluding super_admin and director)
 * - hr_officer can create staff (excluding admins)
 */
export function getCreatableRoles(currentRole) {
  switch (currentRole) {
    case "super_admin":
      return [
        "school_director", "head_teacher", "academic_master", "accountant",
        "subject_teacher", "class_teacher", "librarian", "hostel_manager",
        "transport_manager", "secretary", "receptionist", "nurse",
        "store_keeper", "security_supervisor", "hr_officer"
      ];
    case "school_director":
      return [
        "head_teacher", "academic_master", "accountant", "hr_officer"
      ];
    case "head_teacher":
      return [
        "academic_master", "accountant", "subject_teacher", "class_teacher",
        "librarian", "hostel_manager", "transport_manager", "secretary",
        "receptionist", "nurse", "store_keeper", "security_supervisor", "hr_officer"
      ];
    case "hr_officer":
      return [
        "subject_teacher", "class_teacher", "librarian", "secretary",
        "receptionist", "nurse", "store_keeper", "security_supervisor"
      ];
    default:
      return [];
  }
}

/**
 * Localized role names
 */
const ROLE_LABELS = {
  sw: {
    super_admin: "Msimamizi Mkuu",
    school_director: "Mkurugenzi wa Shule",
    head_teacher: "Mwalimu Mkuu",
    academic_master: "Msimamizi wa Masomo",
    accountant: "Mhasibu",
    subject_teacher: "Mwalimu wa Somo",
    class_teacher: "Mwalimu wa Darasa",
    librarian: "Mkutubi",
    hostel_manager: "Msimamizi wa Bweni",
    transport_manager: "Msimamizi wa Usafiri",
    secretary: "Katibu",
    receptionist: "Mpokeaji Wageni",
    nurse: "Muuguzi",
    store_keeper: "Mshika Bohari",
    security_supervisor: "Msimamizi wa Ulinzi",
    hr_officer: "Afisa Rasilimaliwatu",
    school_admin: "Msimamizi wa Shule",
    parent: "Mzazi",
    student: "Mwanafunzi"
  },
  en: {
    super_admin: "Super Administrator",
    school_director: "School Director",
    head_teacher: "Head Teacher",
    academic_master: "Academic Master",
    accountant: "Accountant / Bursar",
    subject_teacher: "Subject Teacher",
    class_teacher: "Class Teacher",
    librarian: "Librarian",
    hostel_manager: "Hostel Manager",
    transport_manager: "Transport Manager",
    secretary: "Secretary",
    receptionist: "Receptionist",
    nurse: "Nurse",
    store_keeper: "Store Keeper",
    security_supervisor: "Security Supervisor",
    hr_officer: "HR Officer",
    school_admin: "School Administrator",
    parent: "Parent",
    student: "Student"
  }
};

export function getRoleLabel(role, lang = "sw") {
  if (!role) return "—";
  return ROLE_LABELS[lang]?.[role] || role.replace(/_/g, " ");
}

export default {
  ROLES,
  MENU_ACCESS,
  canAccess,
  getCreatableRoles,
  getRoleLabel,
  defaultPageForRole
};
