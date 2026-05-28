import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Soft warning instead of crashing the whole app
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "⚠️ Supabase env variables hazipo. Hakikisha .env ina:\n" +
    "VITE_SUPABASE_URL=https://your-project.supabase.co\n" +
    "VITE_SUPABASE_ANON_KEY=your-anon-key"
  );
}

// Always create client (with fallbacks if env vars missing — app loads but auth will fail gracefully)
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key-not-configured",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

export default supabase;
