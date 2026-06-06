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
 *
 * IMPORTANT: super_admin is INTENTIONALLY excluded from school-level menus.
 * Super Admin is the SaaS platform owner — they manage tenants, subscriptions,
 * and system health. They do NOT participate in daily school operations
 * (registering students, marking attendance, entering grades, etc.).
 * Those belong to in-school roles (head_teacher, teachers, accountants, etc.).
 *
 * Platform-only keys are: dashboard, schools, subscriptions, reports, settings
 *
 * Backward-compatible role names included so existing DB roles continue to work:
 *   teacher → subject_teacher
 *   academic_head → academic_master
 *   hostel_warden → hostel_manager
 *   transport_officer → transport_manager
 */
export const MENU_ACCESS = {
  // Platform-level (super admin + relevant role)
  dashboard: ["*"],
  schools: ["super_admin"],
  subscriptions: ["super_admin"],

  // School-level (NO super_admin — they're not in-school staff)
  staff: ["school_director", "head_teacher", "hr_officer"],
  students: ["school_director", "head_teacher", "academic_master", "academic_head", "class_teacher", "secretary", "receptionist", "nurse"],
  teachers: ["school_director", "head_teacher", "academic_master", "academic_head", "hr_officer"],
  classes: ["school_director", "head_teacher", "academic_master", "academic_head"],
  subjects: ["school_director", "head_teacher", "academic_master", "academic_head"],
  attendance: ["school_director", "head_teacher", "academic_master", "academic_head", "class_teacher", "subject_teacher", "teacher"],
  exams: ["school_director", "head_teacher", "academic_master", "academic_head", "subject_teacher", "teacher", "class_teacher"],
  timetable: ["school_director", "head_teacher", "academic_master", "academic_head", "subject_teacher", "teacher", "class_teacher"],
  fees: ["school_director", "head_teacher", "accountant"],
  library: ["school_director", "head_teacher", "librarian"],
  hostel: ["school_director", "head_teacher", "hostel_manager", "hostel_warden"],
  transport: ["school_director", "head_teacher", "transport_manager", "transport_officer"],
  payroll: ["school_director", "head_teacher", "accountant", "hr_officer"],
  inventory: ["school_director", "head_teacher", "store_keeper"],
  discipline: ["school_director", "head_teacher", "class_teacher"],
  events: ["school_director", "head_teacher", "secretary"],
  communications: ["school_director", "head_teacher", "secretary", "class_teacher"],

  // Platform analytics — super admin sees SaaS-wide; school admins see their school
  reports: ["super_admin", "school_director", "head_teacher", "accountant", "academic_master", "academic_head"],

  // Settings — everyone has their own
  settings: ["*"]
};

// Emails granted super-admin regardless of DB role
const SUPER_ADMIN_EMAILS = ["baruthdickson005@gmail.com"];

/**
 * Check if a user can access a specific menu/page.
 * Accepts either (ctx, key) where ctx = { role, email, isSuperAdmin },
 * OR legacy (role, key) signature.
 *
 * Note: Super Admin is NOT auto-granted everything. They have their own
 * platform-level menus (schools, subscriptions, etc) explicitly listed in
 * MENU_ACCESS. School operations are deliberately not in super_admin's scope.
 */
export function canAccess(ctxOrRole, menuKey) {
  if (!menuKey) return false;

  // Normalize args — support both signatures
  let role, email, isSuperAdmin;
  if (typeof ctxOrRole === "object" && ctxOrRole !== null) {
    role = ctxOrRole.role;
    email = ctxOrRole.email;
    isSuperAdmin = ctxOrRole.isSuperAdmin;
  } else {
    role = ctxOrRole;
  }

  // Resolve effective role: email fallback for Baruth maps to super_admin
  let effectiveRole = role;
  if (!effectiveRole) {
    if (isSuperAdmin === true) effectiveRole = "super_admin";
    else if (email && SUPER_ADMIN_EMAILS.includes(String(email).toLowerCase())) {
      effectiveRole = "super_admin";
    }
  }

  const allowed = MENU_ACCESS[menuKey];
  if (!allowed) return false;
  if (allowed.includes("*")) return true;

  return Boolean(effectiveRole) && allowed.includes(effectiveRole);
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
