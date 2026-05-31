import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Visible diagnostic — always log so user can verify deployment
const isPlaceholder = !supabaseUrl || !supabaseAnonKey;
console.log(
  "%c🔌 ClassLink Supabase Config",
  "background: #064e3b; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
);
console.log("URL:", supabaseUrl || "❌ MISSING — set VITE_SUPABASE_URL on Netlify");
console.log("Key:", supabaseAnonKey ? "✅ present" : "❌ MISSING — set VITE_SUPABASE_ANON_KEY on Netlify");

if (isPlaceholder) {
  console.error(
    "%c⚠️ ENV VARS HAZIPO! Mfumo HAUTAFANYA KAZI hadi uweke Netlify env vars",
    "background: #dc2626; color: white; padding: 6px 10px; font-weight: bold;"
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key-not-configured",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: "public"
    },
    global: {
      headers: {
        "x-client-info": "classlink-web"
      }
    }
  }
);

// Expose status flag for UI to detect
export const supabaseConfigured = !isPlaceholder;

export default supabase;
