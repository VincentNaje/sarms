  "use client";

  import { useEffect, useMemo, useState } from "react";
  import { createClient } from "@/lib/supabase/client";
 import { remarksBadge, computeGWA, gwaColorClass, gradeToPercentageString } from "./types";

  type SemesterOption = {
    academicYearId: string;
    semester: "1st" | "2nd";
    label: string;
  };

  type Row = {
    id: string;
    subject_code: string;
    subject_title: string;
    units: number;
    grade: number | null;
    remarks: string;
    instructor_name: string | null;
  };

  export default function AcademicHistoryTab({ studentId }: { studentId: string }) {
    const supabase = useMemo(() => createClient(), []);
    const [options, setOptions] = useState<SemesterOption[]>([]);
    const [selected, setSelected] = useState<string>("");
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [cumulativeEntries, setCumulativeEntries] = useState <
      { grade: number | null; units: number }[]
    >([]);

    // Load the list of semesters this student has grade records for.
    useEffect(() => {
      (async () => {
        const { data } = await supabase
          .from("student_grades")
          .select("semester, academic_years(id, year_label)")
          .eq("student_id", studentId);

        type SemesterQueryRow = {
          semester: "1st" | "2nd";
          academic_years: { id: string; year_label: string } | null;
        };

        const seen = new Map<string, SemesterOption>();
        ((data ?? []) as unknown as SemesterQueryRow[]).forEach((r) => {
          const ayId = r.academic_years?.id;
          const ayLabel = r.academic_years?.year_label;
          if (!ayId) return;
          const key = `${ayId}|${r.semester}`;
          if (!seen.has(key)) {
            seen.set(key, {
              academicYearId: ayId,
              semester: r.semester,
              label: `AY ${ayLabel} ${r.semester === "1st" ? "1st" : "2nd"} Semester`,
            });
          }
        });
        const opts = Array.from(seen.values()).sort((a, b) => b.label.localeCompare(a.label));
        setOptions(opts);
        if (opts.length > 0) {
          setSelected(`${opts[0].academicYearId}|${opts[0].semester}`);
        } else {
          setLoading(false);
        }
      })();
    }, [studentId, supabase]);

    // Load grades for the selected semester.
    useEffect(() => {
      if (!selected) return;
      const [academicYearId, semester] = selected.split("|");
      (async () => {
        setLoading(true);
        const { data } = await supabase
          .from("student_grades")
          .select(
            "id, grade, remarks, subjects(subject_code, subject_title, units), instructors(first_name, last_name)"
          )
          .eq("student_id", studentId)
          .eq("academic_year_id", academicYearId)
          .eq("semester", semester);

        type GradeQueryRow = {
          id: string;
          grade: number | null;
          remarks: string;
          subjects: { subject_code: string; subject_title: string; units: number } | null;
          instructors: { first_name: string; last_name: string } | null;
        };

        setRows(
          ((data ?? []) as unknown as GradeQueryRow[]).map((r) => ({
            id: r.id,
            subject_code: r.subjects?.subject_code ?? "—",
            subject_title: r.subjects?.subject_title ?? "—",
            units: r.subjects?.units ?? 0,
            grade: r.grade,
            remarks: r.remarks,
            instructor_name: r.instructors
              ? `${r.instructors.first_name} ${r.instructors.last_name}`
              : null,
          }))
        );
        setLoading(false);
      })();
    }, [selected, studentId, supabase]);

    // Load ALL grades ever recorded for this student, for the cumulative GWA.
    useEffect(() => {
      (async () => {
        const { data } = await supabase
          .from("student_grades")
          .select("grade, subjects(units)")
          .eq("student_id", studentId);

        type CumulativeQueryRow = { grade: number | null; subjects: { units: number } | null };

        setCumulativeEntries(
          ((data ?? []) as unknown as CumulativeQueryRow[]).map((r) => ({
            grade: r.grade,
            units: r.subjects?.units ?? 0,
          }))
        );
      })();
    }, [studentId, supabase]);

    const semesterGWA = useMemo(
      () => computeGWA(rows.map((r) => ({ grade: r.grade, units: r.units }))),
      [rows]
    );
    const cumulativeGWA = useMemo(() => computeGWA(cumulativeEntries), [cumulativeEntries]);
    const semesterUnits = rows.reduce((sum, r) => sum + (r.grade !== null ? r.units : 0), 0);

    // --- NEW: Mathematically accurate Percentage GWAs ---
    const semesterPercentageGWA = useMemo(() => {
      const validRows = rows.filter(r => r.grade !== null);
      if (validRows.length === 0) return null;
      const totalUnits = validRows.reduce((sum, r) => sum + r.units, 0);
      if (totalUnits === 0) return null;
      const totalPct = validRows.reduce((sum, r) => {
        const pct = parseFloat(gradeToPercentageString(r.grade as number));
        return sum + (pct * r.units);
      }, 0);
      return totalPct / totalUnits;
    }, [rows]);

    const cumulativePercentageGWA = useMemo(() => {
      const validEntries = cumulativeEntries.filter(e => e.grade !== null);
      if (validEntries.length === 0) return null;
      const totalUnits = validEntries.reduce((sum, e) => sum + e.units, 0);
      if (totalUnits === 0) return null;
      const totalPct = validEntries.reduce((sum, e) => {
        const pct = parseFloat(gradeToPercentageString(e.grade as number));
        return sum + (pct * e.units);
      }, 0);
      return totalPct / totalUnits;
    }, [cumulativeEntries]);

    return (
      <div className="flex w-full flex-col pt-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-6">
          <div className="w-72">
            <label className="mb-2 block text-xs font-bold text-gray-700">
              Selected Semester
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={options.length === 0}
              className="w-full cursor-pointer rounded-md border border-gray-400 bg-white px-3 py-2.5 text-sm text-black outline-none transition-colors focus:border-gray-600 focus:ring-1 focus:ring-gray-600 disabled:cursor-not-allowed disabled:bg-gray-50"
            >
              {options.length === 0 && <option>No academic records yet</option>}
              {options.map((o) => (
                <option
                  key={`${o.academicYearId}|${o.semester}`}
                  value={`${o.academicYearId}|${o.semester}`}
                >
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-8 text-sm">
            <div>
              <p className="text-xs text-gray-500">Units This Semester</p>
              <p className="text-lg font-semibold text-gray-800">{semesterUnits}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Semester GWA</p>
              <p className={`text-lg font-semibold ${gwaColorClass(semesterGWA)}`}>
                {semesterPercentageGWA !== null ? `${semesterPercentageGWA.toFixed(2)}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Cumulative GWA</p>
              <p className={`text-lg font-semibold ${gwaColorClass(cumulativeGWA)}`}>
                {cumulativePercentageGWA !== null ? `${cumulativePercentageGWA.toFixed(2)}%` : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 text-base font-semibold text-black">
                <th className="w-28 pb-3 pl-2">Code</th>
                <th className="pb-3">Subjects</th>
                <th className="pb-3 text-center">Grades</th>
                <th className="pb-3 text-center">Instructor</th>
                <th className="pb-3 text-center">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    No academic records for this semester.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const badge = remarksBadge(row.remarks);
                  return (
                    <tr key={row.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                      <td className="py-4 pl-2 text-gray-700">{row.subject_code}</td>
                      <td className="py-4 font-medium text-gray-900">{row.subject_title}</td>
                        <td className="py-4 text-center text-gray-800">
                          {row.grade !== null ? gradeToPercentageString(row.grade) : "—"}
                        </td>
                      <td className="py-4 text-center text-gray-700">
                        {row.instructor_name ?? "—"}
                      </td>
                      <td className="py-4 text-center">
                        <span className={`inline-block rounded-md px-3 py-1 text-xs font-semibold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }