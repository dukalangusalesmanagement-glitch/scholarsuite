import { useEffect, useState } from "react";
import { Loader2, Check, X, Calendar } from "lucide-react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import { supabase } from "../lib/supabase";
import PageHeader from "../components/PageHeader";

export default function Attendance() {
  const { t } = useLang();
  const { rows: schools } = useResource("schools", { orderBy: "name", ascending: true });
  const { rows: classes } = useResource("classes", { orderBy: "name", ascending: true });
  const { rows: students } = useResource("students", { orderBy: "full_name", ascending: true, limit: 500 });
  const [schoolId, setSchoolId] = useState("");
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState({}); // {studentId: 'present' | 'absent'}
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!schoolId && schools.length) setSchoolId(schools[0].id);
  }, [schools]);

  const scopedStudents = students.filter((s) => {
    if (schoolId && s.school_id !== schoolId) return false;
    if (classId && s.class_id !== classId) return false;
    return true;
  });

  // Load existing attendance for the day
  useEffect(() => {
    if (!schoolId || !date) return;
    (async () => {
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("school_id", schoolId)
        .eq("date", date);
      const m = {};
      (data || []).forEach((a) => (m[a.student_id] = a.status));
      setMarks(m);
    })();
  }, [schoolId, date, classId]);

  const setStatus = (studentId, status) =>
    setMarks((prev) => ({ ...prev, [studentId]: status }));

  const saveAll = async () => {
    setSaving(true);
    setMsg("");
    const payloads = Object.entries(marks).map(([student_id, status]) => ({
      school_id: schoolId,
      student_id,
      class_id: classId || null,
      date,
      status
    }));
    if (payloads.length === 0) {
      setSaving(false);
      return;
    }
    // upsert via delete + insert (simpler than upsert with composite unique)
    await supabase.from("attendance").delete().eq("school_id", schoolId).eq("date", date).in("student_id", payloads.map((p) => p.student_id));
    const { error } = await supabase.from("attendance").insert(payloads);
    setMsg(error ? error.message : t.saved);
    setSaving(false);
  };

  const presentCount = Object.values(marks).filter((s) => s === "present").length;
  const absentCount = Object.values(marks).filter((s) => s === "absent").length;

  return (
    <div>
      <PageHeader title={t.attendance} subtitle={t.markAttendance} />

      <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs uppercase tracking-wider text-stone-500 mb-1.5 block">{t.schoolName}</label>
            <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm">
              <option value="">—</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs uppercase tracking-wider text-stone-500 mb-1.5 block">{t.class}</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm">
              <option value="">{t.total}</option>
              {classes.filter((c) => !schoolId || c.school_id === schoolId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs uppercase tracking-wider text-stone-500 mb-1.5 block">{t.date}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <p className="text-xs uppercase text-emerald-700 tracking-wider">{t.present}</p>
          <p className="display text-2xl text-emerald-900 mt-1">{presentCount}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-xs uppercase text-red-700 tracking-wider">{t.absent}</p>
          <p className="display text-2xl text-red-900 mt-1">{absentCount}</p>
        </div>
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
          <p className="text-xs uppercase text-stone-600 tracking-wider">{t.total}</p>
          <p className="display text-2xl text-stone-900 mt-1">{scopedStudents.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100">
        {scopedStudents.length === 0 ? (
          <div className="py-16 text-center text-stone-400">{t.noData}</div>
        ) : (
          scopedStudents.map((s) => {
            const status = marks[s.id];
            return (
              <div key={s.id} className="flex items-center gap-4 px-4 py-3 hover:bg-stone-50/50">
                <div className="h-9 w-9 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  {(s.full_name || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">{s.full_name}</p>
                  <p className="text-xs text-stone-500">{s.admission_no}</p>
                </div>
                <button
                  onClick={() => setStatus(s.id, "present")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${status === "present" ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-emerald-50"}`}
                >
                  <Check className="h-3.5 w-3.5" /> {t.present}
                </button>
                <button
                  onClick={() => setStatus(s.id, "absent")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${status === "absent" ? "bg-red-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-red-50"}`}
                >
                  <X className="h-3.5 w-3.5" /> {t.absent}
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex justify-end gap-3">
        {msg && <p className="text-sm text-stone-600">{msg}</p>}
        <button onClick={saveAll} disabled={saving} className="rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60" style={{ background: "var(--green-950)" }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
        </button>
      </div>
    </div>
  );
}
