import { useEffect, useState, useCallback } from "react";

/**
 * Generic data-fetching hook using direct fetch (bypasses Supabase JS client).
 *
 * Usage:
 *   const { rows, loading, error, reload, create, update, remove } = useResource("students");
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Get auth token from localStorage directly
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

// Direct fetch helper
const directFetch = async (path, options = {}) => {
  const token = getToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${token}`,
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
      const msg = (data && (data.message || data.error_description)) || `HTTP ${response.status}`;
      return { data: null, error: { message: msg, status: response.status } };
    }
    return { data, error: null };
  } catch (e) {
    clearTimeout(timeoutId);
    return { data: null, error: { message: e.name === "AbortError" ? "Request timed out" : e.message } };
  }
};

export function useResource(table, opts = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string
      const params = new URLSearchParams();
      params.set("select", opts.select || "*");
      if (opts.filters) {
        for (const [col, val] of Object.entries(opts.filters)) {
          params.set(col, `eq.${val}`);
        }
      }
      if (opts.orderBy) {
        params.set("order", `${opts.orderBy}.${opts.ascending ? "asc" : "desc"}`);
      }
      if (opts.limit) params.set("limit", opts.limit);

      const { data, error } = await directFetch(`/rest/v1/${table}?${params.toString()}`);
      if (error) {
        setError(error);
        setRows([]);
      } else {
        setRows(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setError({ message: e.message });
      setRows([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, JSON.stringify(opts)]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (payload) => {
    const { data, error } = await directFetch(`/rest/v1/${table}`, {
      method: "POST",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify(payload)
    });
    const single = Array.isArray(data) ? data[0] : data;
    if (!error && single) setRows((prev) => [single, ...prev]);
    return { data: single, error };
  };

  const update = async (id, payload) => {
    const { data, error } = await directFetch(`/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify(payload)
    });
    const single = Array.isArray(data) ? data[0] : data;
    if (!error && single) setRows((prev) => prev.map((r) => (r.id === id ? single : r)));
    return { data: single, error };
  };

  const remove = async (id) => {
    const { error } = await directFetch(`/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE"
    });
    if (!error) setRows((prev) => prev.filter((r) => r.id !== id));
    return { error };
  };

  return { rows, loading, error, reload: load, create, update, remove };
}

export default useResource;
