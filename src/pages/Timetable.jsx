import { useEffect, useState } from "react";
import { useLang } from "../contexts/LangContext";
import { useResource } from "../hooks/useResource";
import { supabase } from "../lib/supabase";
import PageHeader from "../components/PageHeader";

const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAYS_SW = ["Jtatu", "Jnne", "Jtano", "Almisi", "Iju"];
const PERIODS = [1, 2, 3, 4, 5, 6];

export default function Timetable() {
  const { t, lang } = useLang();
  const { rows: classes } = useResource("classes", { orderBy: "name", ascending: true });
  const { rows: subjects } = useResource("subjects", { orderBy: "name", ascending: true });
  const { rows: teachers } = useResource("teachers", { orderBy: "full_name", ascending: true });
  const [classId, setClassId] = useState("");
  const [entries, setEntries] = useState([]);
  const days = lang === "sw" ? DAYS_SW : DAYS_EN;

  useEffect(() => {
    if (!classId && classes.length) setClassId(classes[0].id);
  }, [classes]);

  useEffect(() => {
    if (!classId) return;
    (async () => {
      const { data } = await supabase.from("timetable").select("*").eq("class_id", classId);
      setEntries(data || []);
    })();
  }, [classId]);

  const cellAt = (day, period) => entries.find((e) => e.day_of_week === day && e.period === period);

  return (
    <div>
      <PageHeader title={t.timetable} subtitle={lang === "sw" ? "Ratiba ya darasa" : "Class schedule"} />
      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-4">
        <label className="text-xs uppercase tracking-wider text-stone-500 mb-1.5 block">{t.class}</label>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full max-w-md rounded-lg border border-stone-200 px-3 py-2 text-sm">
          <option value="">—</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-stone-500 font-medium">Period</th>
              {days.map((d, i) => <th key={i} className="px-3 py-2 text-left text-xs uppercase tracking-wider text-stone-500 font-medium">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p) => (
              <tr key={p} className="border-t border-stone-100">
                <td className="px-3 py-3 font-medium text-stone-700">P{p}</td>
                {days.map((_, di) => {
                  const cell = cellAt(di + 1, p);
                  const subj = cell ? subjects.find((s) => s.id === cell.subject_id) : null;
                  const teach = cell ? teachers.find((tt) => tt.id === cell.teacher_id) : null;
                  return (
                    <td key={di} className="px-3 py-3">
                      {cell ? (
                        <div className="rounded-lg p-2 text-xs" style={{ background: "var(--green-50)", borderLeft: "3px solid var(--green-700)" }}>
                          <p className="font-medium text-stone-900">{subj?.name || "—"}</p>
                          <p className="text-stone-500">{teach?.full_name || "—"}</p>
                        </div>
                      ) : (
                        <div className="text-stone-300 text-xs italic">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-stone-500 mt-3">
        {lang === "sw" ? "Ratiba inajengwa kwa kuongeza vipindi vya timetable kupitia jedwali la `timetable`." : "Build the schedule by inserting timetable entries via the `timetable` table."}
      </p>
    </div>
  );
}
