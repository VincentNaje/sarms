"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AddSubjectModal from "./add-subject-modal";
import {
  computeRemarks,
  remarksBadge,
  statusToYearLevel,
  type AcademicYear,
  type Instructor,
  type StudentRow,
  type Subject,
} from "./types";

type GradeDraftRow = {
  key: string;
  subjectId: string;
  subjectCode: string;
  subjectTitle: string;
  instructorId: string | null;
  grade: string;
  isRetake: boolean;
  isNew: boolean;
};

export default function GradesTab({ student }: { student: StudentRow }) {
  const supabase = useMemo(() => createClient(), []);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAY, setSelectedAY] = useState<string>("");
  const [semester, setSemester] = useState<"1st" | "2nd">("1st");
  const [rows, setRows] = useState<GradeDraftRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: ays }, { data: subs }, { data: ins }] = await Promise.all([
        supabase
          .from("academic_years")
          .select("id, year_label")
          .order("year_label", { ascending: false }),
        supabase.from("subjects").select("*").order("subject_code"),
        supabase
          .from("instructors")
          .select("id, first_name, last_name")
          .order("last_name"),
      ]);
      setAcademicYears(ays ?? []);
      setSubjects(subs ?? []);
      setInstructors(ins ?? []);
      if (ays && ays.length > 0) setSelectedAY(ays[0].id);
    })();
  }, [supabase]);

  useEffect(() => {
    if (!selectedAY) return;
    (async () => {
      setLoading(true);
      const yearLevel = statusToYearLevel(student.status);

      type CurriculumQueryRow = {
        subject_id: string;
        subjects: { id: string; subject_code: string; subject_title: string } | null;
      };
      type GradeQueryRow = {
        subject_id: string;
        instructor_id: string | null;
        grade: number | null;
        is_retake: boolean;
        subjects: { subject_code: string; subject_title: string } | null;
      };

      const curriculumPromise = yearLevel
        ? supabase
            .from("curriculum")
            .select(
              "subject_id, year_level, semester, subjects(id, subject_code, subject_title)"
            )
            .eq("program_id", student.program_id)
            .eq("year_level", yearLevel)
            .eq("semester", semester)
        : Promise.resolve({ data: [] as CurriculumQueryRow[] });

      const gradesPromise = supabase
        .from("student_grades")
        .select(
          "id, subject_id, instructor_id, grade, is_retake, subjects(subject_code, subject_title)"
        )
        .eq("student_id", student.id)
        .eq("academic_year_id", selectedAY)
        .eq("semester", semester);

      const [{ data: curriculumRowsRaw }, { data: gradeRowsRaw }] = await Promise.all([
        curriculumPromise,
        gradesPromise,
      ]);
      const curriculumRows = (curriculumRowsRaw ?? []) as unknown as CurriculumQueryRow[];
      const gradeRows = (gradeRowsRaw ?? []) as unknown as GradeQueryRow[];

      const existingBySubject = new Map(gradeRows.map((g) => [g.subject_id, g]));

      const curriculumDrafts: GradeDraftRow[] = curriculumRows.map((c) => {
        const existing = existingBySubject.get(c.subject_id);
        return {
          key: c.subject_id,
          subjectId: c.subject_id,
          subjectCode: c.subjects?.subject_code ?? "—",
          subjectTitle: c.subjects?.subject_title ?? "—",
          instructorId: existing?.instructor_id ?? null,
          grade: existing?.grade != null ? String(existing.grade) : "",
          isRetake: existing?.is_retake ?? false,
          isNew: !existing,
        };
      });

      const curriculumSubjectIds = new Set(curriculumDrafts.map((d) => d.subjectId));
      const manualDrafts: GradeDraftRow[] = gradeRows
        .filter((g) => !curriculumSubjectIds.has(g.subject_id))
        .map((g) => ({
          key: g.subject_id,
          subjectId: g.subject_id,
          subjectCode: g.subjects?.subject_code ?? "—",
          subjectTitle: g.subjects?.subject_title ?? "—",
          instructorId: g.instructor_id,
          grade: g.grade != null ? String(g.grade) : "",
          isRetake: g.is_retake,
          isNew: false,
        }));

      setRows([...curriculumDrafts, ...manualDrafts]);
      setLoading(false);
    })();
  }, [selectedAY, semester, student, supabase]);

  function updateRow(key: string, patch: Partial<GradeDraftRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function handleAddSubject({
    subjectId,
    instructorId,
    isRetake,
  }: {
    subjectId: string;
    instructorId: string | null;
    isRetake: boolean;
  }) {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    setRows((prev) => [
      ...prev,
      {
        key: subjectId,
        subjectId,
        subjectCode: subject.subject_code,
        subjectTitle: subject.subject_title,
        instructorId,
        grade: "",
        isRetake,
        isNew: true,
      },
    ]);
    setShowAddModal(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);

    const payload = rows
      .filter((r) => r.grade.trim() !== "")
      .map((r) => {
        const gradeNum = parseFloat(r.grade);
        return {
          student_id: student.id,
          subject_id: r.subjectId,
          instructor_id: r.instructorId,
          academic_year_id: selectedAY,
          semester,
          grade: gradeNum,
          remarks: computeRemarks(gradeNum),
          is_retake: r.isRetake,
        };
      });

    if (payload.length === 0) {
      setSaving(false);
      setSaveMessage("Enter at least one grade before saving.");
      return;
    }

    const { error } = await supabase.from("student_grades").upsert(payload, {
      onConflict: "student_id,subject_id,academic_year_id,semester",
    });

    setSaving(false);
    setSaveMessage(error ? `Error: ${error.message}` : "Grades saved.");
  }

  return (
    <div className="flex w-full flex-col pt-4">
      <div className="mb-6 flex items-end justify-between">
        <div className="flex gap-3">
          <div className="w-52">
            <label className="mb-2 block text-xs font-bold text-gray-700">
              Academic Year
            </label>
            <select
              value={selectedAY}
              onChange={(e) => setSelectedAY(e.target.value)}
              className="w-full cursor-pointer rounded-md border border-gray-400 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
            >
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.year_label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="mb-2 block text-xs font-bold text-gray-700">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as "1st" | "2nd")}
              className="w-full cursor-pointer rounded-md border border-gray-400 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
            >
              <option value="1st">1st Semester</option>
              <option value="2nd">2nd Semester</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="cursor-pointer rounded-full bg-[#6a9bc2] px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5785a8]"
        >
          Add Subject Manually
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 text-base font-semibold text-black">
              <th className="w-24 pb-3 pl-2">Code</th>
              <th className="w-64 pb-3">Subjects</th>
              <th className="w-32 pb-3 pr-2 text-center">Grade</th>
              <th className="w-48 pb-3 text-center">Instructor</th>
              <th className="pb-3 text-center">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-400">
                  Loading curriculum...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-400">
                  No subjects for this semester yet. Use &ldquo;Add Subject
                  Manually&rdquo; to encode one.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const gradeNum = row.grade.trim() === "" ? null : parseFloat(row.grade);
                const remarks =
                  row.grade.trim() === "" ? null : computeRemarks(gradeNum);
                const badge = remarks ? remarksBadge(remarks) : null;
                return (
                  <tr
                    key={row.key}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                  >
                    <td className="py-4 pl-2 text-gray-700">{row.subjectCode}</td>
                    <td className="py-4 font-medium text-gray-900">
                      {row.subjectTitle}
                      {row.isRetake && (
                        <span className="ml-2 inline-block rounded-md bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
                          🔁 Retake
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      <input
                        type="number"
                        min={1}
                        max={5}
                        step={0.25}
                        value={row.grade}
                        onChange={(e) => updateRow(row.key, { grade: e.target.value })}
                        placeholder="1.00–5.00"
                        className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm text-black outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                      />
                    </td>
                    <td className="py-4 text-center">
                      <select
                        value={row.instructorId ?? ""}
                        onChange={(e) =>
                          updateRow(row.key, { instructorId: e.target.value || null })
                        }
                        className="w-full cursor-pointer rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                      >
                        <option value="">Select...</option>
                        {instructors.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.first_name} {i.last_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 text-center">
                      {badge ? (
                        <span
                          className={`inline-block rounded-md px-3 py-1 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-12 flex items-center justify-end gap-4">
        {saveMessage && <p className="text-sm text-gray-600">{saveMessage}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="cursor-pointer rounded-md bg-[#1b4d5c] px-8 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#153c48] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Grades"}
        </button>
      </div>

      {showAddModal && (
        <AddSubjectModal
          subjects={subjects}
          instructors={instructors}
          alreadyAddedSubjectIds={rows.map((r) => r.subjectId)}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddSubject}
        />
      )}
    </div>
  );
}
