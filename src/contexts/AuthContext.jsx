import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Derive storage key from URL (Supabase uses sb-{project-ref}-auth-token)
const STORAGE_KEY = (() => {
  if (!SUPABASE_URL) return "sb-auth-token";
  const match = SUPABASE_URL.match(/\/\/([^.]+)\./);
  return match ? `sb-${match[1]}-auth-token` : "sb-auth-token";
})();

// Direct HTTP fetch with timeout — completely bypasses Supabase JS client
const apiFetch = async (path, options = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(options.headers || {})
      }
    });
    clearTimeout(timeoutId);
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { ok: response.ok, status: response.status, data };
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === "AbortError") {
      return { ok: false, status: 0, data: { error_description: "Network timeout" } };
    }
    return { ok: false, status: 0, data: { error_description: e.message } };
  }
};

// Session storage helpers
const getStoredSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const setStoredSession = (session) => {
  if (session) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch {}
  } else {
    // Clear ALL sb-* keys for complete logout
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("sb-")) localStorage.removeItem(key);
      }
      // Clear sessionStorage too
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith("sb-")) sessionStorage.removeItem(key);
      }
    } catch {}
  }
};

// Translate auth errors to Swahili
const translateError = (msg, lang = "en") => {
  if (!msg) return lang === "sw" ? "Hitilafu isiyojulikana" : "Unknown error";
  const lower = msg.toLowerCase();
  if (lang !== "sw") return msg;
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Email au nenosiri si sahihi";
  }
  if (lower.includes("user already") || lower.includes("already registered") || lower.includes("already been")) {
    return "Email hii imesajiliwa tayari";
  }
  if (lower.includes("password") && (lower.includes("6") || lower.includes("short"))) {
    return "Nenosiri lazima iwe na herufi 6 au zaidi";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Umejaribu mara nyingi. Subiri dakika 1-2.";
  }
  if (lower.includes("invalid") && lower.includes("email")) {
    return "Email haijasahihika";
  }
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Email haijahakikishwa. Angalia inbox yako.";
  }
  if (lower.includes("network") || lower.includes("timeout")) {
    return "Tatizo la mtandao. Hakiki internet yako.";
  }
  return msg;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(null);

  // Load profile via REST API
  const loadProfile = useCallback(async (userId, accessToken) => {
    if (!userId || !accessToken) return null;
    try {
      const { ok, data } = await apiFetch(
        `/rest/v1/profiles?id=eq.${userId}&select=*`,
        { headers: { "Authorization": `Bearer ${accessToken}` } },
        8000
      );
      if (ok && Array.isArray(data) && data.length > 0) {
        return data[0];
      }
      return null;
    } catch (e) {
      console.warn("Profile load failed:", e);
      return null;
    }
  }, []);

  // Initialize from storage on mount
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const session = getStoredSession();
      if (session?.user && session?.access_token) {
        if (cancelled) return;
        setUser(session.user);
        setSessionToken(session.access_token);
        const p = await loadProfile(session.user.id, session.access_token);
        if (cancelled) return;
        setProfile(p);
      }
      if (!cancelled) setLoading(false);
    };
    init();
    return () => { cancelled = true; };
  }, [loadProfile]);

  // Sign in with email + password
  const signIn = async (email, password) => {
    const { ok, status, data } = await apiFetch(
      "/auth/v1/token?grant_type=password",
      { method: "POST", body: JSON.stringify({ email: email.trim(), password }) },
      10000
    );
    if (!ok) {
      const msg = data?.error_description || data?.msg || data?.message || `HTTP ${status}`;
      throw new Error(msg);
    }
    setStoredSession(data);
    setUser(data.user);
    setSessionToken(data.access_token);
    const p = await loadProfile(data.user.id, data.access_token);
    setProfile(p);
    return data;
  };

  // Sign up
  const signUp = async (email, password, metadata = {}) => {
    const { ok, status, data } = await apiFetch(
      "/auth/v1/signup",
      { method: "POST", body: JSON.stringify({ email: email.trim(), password, data: metadata }) },
      10000
    );
    if (!ok) {
      const msg = data?.error_description || data?.msg || data?.message || `HTTP ${status}`;
      throw new Error(msg);
    }
    if (data.session) {
      setStoredSession(data.session);
      setUser(data.user);
      setSessionToken(data.session.access_token);
      const p = await loadProfile(data.user.id, data.session.access_token);
      setProfile(p);
    }
    return data;
  };

  // Sign out — bulletproof: clear everything immediately, fire-and-forget API call
  const signOut = async () => {
    const session = getStoredSession();
    // Fire-and-forget logout (don't wait — max 2s)
    if (session?.access_token) {
      apiFetch(
        "/auth/v1/logout",
        { method: "POST", headers: { "Authorization": `Bearer ${session.access_token}` } },
        2000
      ).catch(() => {});
    }
    // Clear state and storage IMMEDIATELY
    setStoredSession(null);
    setUser(null);
    setProfile(null);
    setSessionToken(null);
    // Force navigation
    setTimeout(() => { window.location.href = "/"; }, 100);
  };

  const isSuperAdmin =
    profile?.role === "super_admin" ||
    user?.email === "baruthdickson005@gmail.com";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        sessionToken,
        signIn,
        signUp,
        signOut,
        isSuperAdmin,
        translateError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
