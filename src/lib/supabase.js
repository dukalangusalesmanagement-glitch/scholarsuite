// =============================================================
// ClassLink Supabase Stub — 100% direct fetch, no @supabase/supabase-js
// Implements same interface as Supabase JS client
// =============================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isPlaceholder = !SUPABASE_URL || !SUPABASE_KEY;

// Diagnostic log
try {
  console.log(
    "%c🔌 ClassLink Supabase Config",
    "background: #064e3b; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
  );
  console.log("URL:", SUPABASE_URL || "❌ MISSING");
  console.log("Key:", SUPABASE_KEY ? "✅ present" : "❌ MISSING");
  if (isPlaceholder) {
    console.error("%c⚠️ ENV VARS HAZIPO!", "background: #dc2626; color: white; padding: 6px 10px; font-weight: bold;");
  }
} catch {}

// Get access token from localStorage
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

// Base direct fetch with timeout
const rawFetch = async (url, options = {}) => {
  if (isPlaceholder) {
    return { data: null, error: { message: "Supabase not configured" } };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${getToken()}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(options.headers || {})
      }
    });
    clearTimeout(timeoutId);
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) {
      const msg = (data && (data.message || data.error_description || data.msg)) || `HTTP ${response.status}`;
      return { data: null, error: { message: msg, code: response.status, status: response.status } };
    }
    return { data, error: null, status: response.status };
  } catch (e) {
    clearTimeout(timeoutId);
    return { data: null, error: { message: e.name === "AbortError" ? "Request timed out" : e.message } };
  }
};

// QueryBuilder mimics Supabase JS client query chaining
class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.params = new URLSearchParams();
    this.method = "GET";
    this.body = null;
    this.headers = {};
    this._single = false;
    this._maybeSingle = false;
    this._count = null;
    this._head = false;
    this.params.set("select", "*");
  }

  select(columns = "*", options = {}) {
    this.params.set("select", columns);
    if (options.count) {
      this._count = options.count;
      this.headers["Prefer"] = `count=${options.count}`;
    }
    if (options.head) {
      this._head = true;
      this.method = "HEAD";
    }
    return this;
  }

  insert(payload) {
    this.method = "POST";
    this.body = JSON.stringify(payload);
    return this;
  }

  upsert(payload) {
    this.method = "POST";
    this.body = JSON.stringify(payload);
    this.headers["Prefer"] = "resolution=merge-duplicates,return=representation";
    return this;
  }

  update(payload) {
    this.method = "PATCH";
    this.body = JSON.stringify(payload);
    return this;
  }

  delete() {
    this.method = "DELETE";
    return this;
  }

  eq(col, val) {
    this.params.set(col, `eq.${val}`);
    return this;
  }

  neq(col, val) {
    this.params.set(col, `neq.${val}`);
    return this;
  }

  gt(col, val) {
    this.params.set(col, `gt.${val}`);
    return this;
  }

  gte(col, val) {
    this.params.set(col, `gte.${val}`);
    return this;
  }

  lt(col, val) {
    this.params.set(col, `lt.${val}`);
    return this;
  }

  lte(col, val) {
    this.params.set(col, `lte.${val}`);
    return this;
  }

  like(col, pattern) {
    this.params.set(col, `like.${pattern}`);
    return this;
  }

  ilike(col, pattern) {
    this.params.set(col, `ilike.${pattern}`);
    return this;
  }

  in(col, values) {
    this.params.set(col, `in.(${values.join(",")})`);
    return this;
  }

  is(col, val) {
    this.params.set(col, `is.${val}`);
    return this;
  }

  order(col, options = {}) {
    const dir = options.ascending === false ? "desc" : "asc";
    const existing = this.params.get("order");
    const newOrder = `${col}.${dir}`;
    this.params.set("order", existing ? `${existing},${newOrder}` : newOrder);
    return this;
  }

  limit(n) {
    this.params.set("limit", String(n));
    return this;
  }

  range(from, to) {
    this.headers["Range"] = `${from}-${to}`;
    return this;
  }

  single() {
    this._single = true;
    this.headers["Accept"] = "application/vnd.pgrst.object+json";
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  // Make QueryBuilder thenable (await-able)
  then(onfulfilled, onrejected) {
    return this._execute().then(onfulfilled, onrejected);
  }

  catch(onrejected) {
    return this._execute().catch(onrejected);
  }

  async _execute() {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${this.table}?${this.params.toString()}`;
      const opts = {
        method: this.method,
        headers: { ...this.headers }
      };
      if (this.body) opts.body = this.body;
      // For mutations, add Prefer header to return representation
      if ((this.method === "POST" || this.method === "PATCH") && !opts.headers["Prefer"]) {
        opts.headers["Prefer"] = "return=representation";
      }

      const result = await rawFetch(url, opts);

      // Handle single() — array → single object
      if (result.data && this._single && Array.isArray(result.data)) {
        if (result.data.length > 0) {
          result.data = result.data[0];
        } else {
          return { data: null, error: { message: "No rows found" } };
        }
      }
      if (result.data && this._maybeSingle && Array.isArray(result.data)) {
        result.data = result.data.length > 0 ? result.data[0] : null;
      }
      return result;
    } catch (e) {
      return { data: null, error: { message: e.message || String(e) } };
    }
  }
}

// Auth methods
const auth = {
  async getSession() {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
          const v = JSON.parse(localStorage.getItem(key));
          if (v) return { data: { session: v }, error: null };
        }
      }
    } catch {}
    return { data: { session: null }, error: null };
  },

  async getUser() {
    const { data } = await auth.getSession();
    return { data: { user: data.session?.user || null }, error: null };
  },

  async signInWithPassword({ email, password }) {
    if (isPlaceholder) return { data: null, error: { message: "Not configured" } };
    const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: { message: data.error_description || data.msg || data.message || `HTTP ${response.status}` } };
      }
      return { data: { session: data, user: data.user }, error: null };
    } catch (e) {
      clearTimeout(timeoutId);
      return { data: null, error: { message: e.message } };
    }
  },

  async signUp({ email, password, options = {} }) {
    if (isPlaceholder) return { data: null, error: { message: "Not configured" } };
    const url = `${SUPABASE_URL}/auth/v1/signup`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, data: options.data || {} })
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: { message: data.error_description || data.msg || data.message || `HTTP ${response.status}` } };
      }
      return { data, error: null };
    } catch (e) {
      clearTimeout(timeoutId);
      return { data: null, error: { message: e.message } };
    }
  },

  async signOut() {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("sb-")) localStorage.removeItem(key);
      }
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith("sb-")) sessionStorage.removeItem(key);
      }
    } catch {}
    return { error: null };
  },

  async updateUser(updates) {
    if (isPlaceholder) return { data: null, error: { message: "Not configured" } };
    const url = `${SUPABASE_URL}/auth/v1/user`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        method: "PUT",
        signal: controller.signal,
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updates)
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (!response.ok) {
        return { data: null, error: { message: data.error_description || data.msg || `HTTP ${response.status}` } };
      }
      return { data, error: null };
    } catch (e) {
      clearTimeout(timeoutId);
      return { data: null, error: { message: e.message } };
    }
  },

  // No-op auth state subscription (we use AuthContext for state management)
  onAuthStateChange(callback) {
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }
};

// Main supabase object
export const supabase = {
  from(table) {
    return new QueryBuilder(table);
  },
  auth,
  // Storage stub (some pages might import this)
  storage: {
    from(bucket) {
      return {
        async upload() { return { data: null, error: { message: "Storage not implemented" } }; },
        async download() { return { data: null, error: { message: "Storage not implemented" } }; },
        async remove() { return { data: null, error: { message: "Storage not implemented" } }; },
        getPublicUrl(path) { return { data: { publicUrl: "" } }; }
      };
    }
  }
};

export const supabaseConfigured = !isPlaceholder;
export default supabase;
