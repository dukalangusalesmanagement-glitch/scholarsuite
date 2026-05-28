import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

/**
 * Generic data-fetching hook for any Supabase table.
 *
 * Usage:
 *   const { rows, loading, error, reload, create, update, remove } = useResource("students");
 */
export function useResource(table, opts = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase.from(table).select(opts.select || "*");
    if (opts.filters) {
      for (const [col, val] of Object.entries(opts.filters)) {
        query = query.eq(col, val);
      }
    }
    if (opts.orderBy) {
      query = query.order(opts.orderBy, { ascending: opts.ascending ?? false });
    }
    if (opts.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) setError(error);
    else setRows(data || []);
    setLoading(false);
  }, [table, JSON.stringify(opts)]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (payload) => {
    const { data, error } = await supabase.from(table).insert(payload).select().single();
    if (!error) setRows((prev) => [data, ...prev]);
    return { data, error };
  };

  const update = async (id, payload) => {
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (!error) setRows((prev) => prev.map((r) => (r.id === id ? data : r)));
    return { data, error };
  };

  const remove = async (id) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) setRows((prev) => prev.filter((r) => r.id !== id));
    return { error };
  };

  return { rows, loading, error, reload: load, create, update, remove };
}

export default useResource;
