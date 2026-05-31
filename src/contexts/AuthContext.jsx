import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId, userEmail, userMetadata) => {
    if (!userId) return null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data) return data;

      // Profile doesn't exist — auto-create
      console.log("Auto-creating profile for:", userEmail);
      const meta = userMetadata || {};
      const fullName =
        meta.full_name ||
        [meta.first_name, meta.middle_name, meta.last_name].filter(Boolean).join(" ") ||
        userEmail?.split("@")[0] ||
        "User";

      const { data: created, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: userEmail,
          full_name: fullName,
          role: meta.role || "school_admin"
        })
        .select()
        .single();

      if (createError) {
        console.warn("Profile auto-create failed:", createError.message);
        return null;
      }
      return created;
    } catch (err) {
      console.warn("loadProfile error:", err.message || err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Race getSession against a 4-second timeout
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { session: null }, _timeout: true }), 4000)
          )
        ]);

        if (!mounted) return;

        if (sessionResult._timeout) {
          console.warn("Auth init timed out — proceeding without session");
          setLoading(false);
          return;
        }

        const session = sessionResult.data?.session;
        setUser(session?.user || null);

        if (session?.user) {
          const p = await loadProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata
          );
          if (mounted) setProfile(p);
        }
      } catch (err) {
        console.error("initAuth threw:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log("Auth state changed:", event);
      setUser(session?.user || null);
      if (session?.user) {
        const p = await loadProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata
        );
        if (mounted) setProfile(p);
      } else {
        setProfile(null);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    return { data, error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("signOut error:", e);
    }
    setUser(null);
    setProfile(null);
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    window.location.href = "/";
  };

  // Super admin detection: by profile role OR by user email matching known owner
  const isSuperAdmin =
    profile?.role === "super_admin" ||
    user?.email === "baruthdickson005@gmail.com";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isSuperAdmin,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

export default AuthContext;
