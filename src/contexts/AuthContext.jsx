import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) {
        console.warn("Profile load returned error:", error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error("Profile load threw:", err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety net: never stay in loading state longer than 8 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("Auth init timed out — showing login");
        setLoading(false);
      }
    }, 8000);

    // Restore existing session on mount
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("getSession error:", error.message);
        }
        setUser(session?.user || null);
        if (session?.user) {
          const p = await loadProfile(session.user.id);
          if (mounted) setProfile(p);
        }
      })
      .catch((err) => {
        console.error("getSession threw:", err);
      })
      .finally(() => {
        if (mounted) {
          clearTimeout(safetyTimeout);
          setLoading(false);
        }
      });

    // Listen for auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setUser(session?.user || null);
      if (session?.user) {
        const p = await loadProfile(session.user.id);
        if (mounted) setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
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
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isSuperAdmin = profile?.role === "super_admin";

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
