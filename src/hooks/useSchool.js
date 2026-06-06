import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Read auth token from localStorage (avoid Supabase JS client)
const getToken = () => {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const v = JSON.parse(localStorage.getItem(key));
        if (v?.access_token) return v.access_token;
      }
    }
  } catch {}
  return SUPABASE_KEY;
};

/**
 * useSchool() — current tenant/school context for the logged-in user.
 *
 * Returns:
 *   schoolId      - current school the user operates in (null for super admin)
 *   school        - the full school record (null if not loaded)
 *   isPlatform    - true for super admin (sees all schools)
 *   isSchoolUser  - true for users tied to a single school
 *   scopeFilter   - object to spread into queries: { school_id: <id> } or {}
 */
export function useSchool() {
  const { user, profile, isSuperAdmin } = useAuth();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(false);

  const schoolId = profile?.school_id || null;
  const isPlatform = isSuperAdmin === true || profile?.role === "super_admin";
  const isSchoolUser = !isPlatform && Boolean(schoolId);

  // Load school record once we have a school_id
  useEffect(() => {
    let cancelled = false;
    if (!schoolId || isPlatform) {
      setSchool(null);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    fetch(`${SUPABASE_URL}/rest/v1/schools?id=eq.${schoolId}&select=*`, {
      signal: controller.signal,
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${getToken()}`,
        "Accept": "application/json"
      }
    })
      .then((r) => r.json())
      .then((data) => {
        clearTimeout(timeoutId);
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) setSchool(data[0]);
      })
      .catch(() => { clearTimeout(timeoutId); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [schoolId, isPlatform]);

  // Filter to apply when querying school-scoped tables
  // Super Admin: no filter (sees all)
  // School user: filter by their school_id
  const scopeFilter = useMemo(() => {
    if (isPlatform) return {};
    if (schoolId) return { school_id: schoolId };
    // No school assigned and not platform — see nothing
    return { school_id: "__none__" };
  }, [isPlatform, schoolId]);

  // Helper: append scope filter to a URLSearchParams query
  const applyScope = useCallback((params) => {
    if (!params || isPlatform) return params;
    if (schoolId) {
      params.set("school_id", `eq.${schoolId}`);
    } else {
      // Block all results if user has no school
      params.set("school_id", "eq.__none__");
    }
    return params;
  }, [schoolId, isPlatform]);

  // Helper: inject school_id into payload before insert
  const withSchopeId = useCallback((payload) => {
    if (isPlatform) return payload;
    if (!schoolId) return payload;
    if (Array.isArray(payload)) {
      return payload.map((p) => ({ ...p, school_id: p.school_id || schoolId }));
    }
    return { ...payload, school_id: payload?.school_id || schoolId };
  }, [schoolId, isPlatform]);

  return {
    schoolId,
    school,
    schoolName: school?.name || null,
    loading,
    isPlatform,
    isSchoolUser,
    scopeFilter,
    applyScope,
    withSchoolId: withSchopeId
  };
}

export default useSchool;
