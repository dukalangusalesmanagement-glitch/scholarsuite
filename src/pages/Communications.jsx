import { useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../contexts/AuthContext";
import { timeAgo } from "../lib/api";
import PageHeader from "../components/PageHeader";
import Field, { inputClass } from "../components/Field";

const EMPTY = { school_id: null, title: "", message: "", recipients: "all", channel: "in_app" };

export default function Communications() {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const { rows, loading, create } = useResource("announcements", { orderBy: "sent_at" });
  const { rows: schools } = useResource("schools", { orderBy: "name", ascending: true });
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const payload = { ...form, school_id: form.school_id || schools[0]?.id, sent_by: profile?.id };
    const res = await create(payload);
    if (res.error) setMsg(res.error.message);
    else {
      setMsg(t.saved);
      setForm(EMPTY);
    }
    setBusy(false);
  };

  return (
    <div>
      <PageHeader title={t.communications} subtitle={t.sendAnnouncement} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <form onSubmit={send} className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <Field label={t.schoolName}>
            <select className={inputClass} value={form.school_id || ""} onChange={(e) => setForm({ ...form, school_id: e.target.value })}>
              <option value="">{lang === "sw" ? "Shule zote" : "All schools"}</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label={t.title}><input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label={t.message}><textarea required rows={5} className={inputClass} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.recipients}>
              <select className={inputClass} value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })}>
                <option value="all">{lang === "sw" ? "Wote" : "All"}</option>
                <option value="parents">{lang === "sw" ? "Wazazi" : "Parents"}</option>
                <option value="teachers">{t.teachers}</option>
                <option value="students">{t.students}</option>
              </select>
            </Field>
            <Field label="Channel">
              <select className={inputClass} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                <option value="in_app">In-app</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </Field>
          </div>
          {msg && <div className={`rounded-lg px-3 py-2 text-sm ${msg === t.saved ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg}</div>}
          <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white" style={{ background: "var(--green-950)" }}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> {t.send}</>}
          </button>
        </form>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="display text-2xl mb-4" style={{ color: "var(--green-950)" }}>{t.recent}</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {loading ? <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" /></div> :
             rows.length === 0 ? <p className="text-sm text-stone-400 text-center py-8">{t.noData}</p> :
             rows.map((r) => (
               <div key={r.id} className="border-l-2 pl-4 py-2" style={{ borderColor: "var(--green-700)" }}>
                 <div className="flex items-start justify-between mb-1 gap-2">
                   <h4 className="font-medium text-stone-900">{r.title}</h4>
                   <span className="text-[10px] uppercase tracking-wider text-stone-400 flex-shrink-0">{r.channel}</span>
                 </div>
                 <p className="text-sm text-stone-600 mb-1">{r.message}</p>
                 <p className="text-xs text-stone-400">→ {r.recipients} · {timeAgo(r.sent_at, lang)}</p>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
