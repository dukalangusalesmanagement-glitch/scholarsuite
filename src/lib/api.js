import { supabase } from "./supabase";

/**
 * Generic CRUD helpers for any Supabase table.
 * All functions return { data, error } following Supabase convention.
 */

export const api = {
  /** SELECT all rows with optional filters and ordering */
  async list(table, opts = {}) {
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

    return await query;
  },

  /** SELECT single row by id */
  async get(table, id) {
    return await supabase.from(table).select("*").eq("id", id).single();
  },

  /** INSERT a new row */
  async create(table, payload) {
    return await supabase.from(table).insert(payload).select().single();
  },

  /** INSERT many rows */
  async createMany(table, payloads) {
    return await supabase.from(table).insert(payloads).select();
  },

  /** UPDATE a row by id */
  async update(table, id, payload) {
    return await supabase.from(table).update(payload).eq("id", id).select().single();
  },

  /** DELETE a row by id */
  async remove(table, id) {
    return await supabase.from(table).delete().eq("id", id);
  },

  /** COUNT rows */
  async count(table, filters = {}) {
    let query = supabase.from(table).select("*", { count: "exact", head: true });
    for (const [col, val] of Object.entries(filters)) query = query.eq(col, val);
    const { count, error } = await query;
    return { count: count || 0, error };
  }
};

/** Format TZS currency */
export const formatTZS = (n) => {
  const num = Number(n) || 0;
  return "TZS " + num.toLocaleString("en-TZ");
};

/** Format date (Kiswahili-friendly) */
export const formatDate = (d, lang = "sw") => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

/** Format relative time */
export const timeAgo = (d, lang = "sw") => {
  if (!d) return "—";
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (lang === "sw") {
    if (mins < 60) return `dakika ${mins} zilizopita`;
    if (hrs < 24) return `saa ${hrs} zilizopita`;
    return `siku ${days} zilizopita`;
  }
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
};

export default api;
