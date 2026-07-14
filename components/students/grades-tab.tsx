"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AddSubjectModal from "./add-subject-modal";
import { getCurrentAcademicTerm } from "./types";
import {
  computeRemarks,
  remarksBadge,
  percentageToGrade,
  computeGWA,
  gwaColorClass,
  statusToYearLevel,
  gradeToPercentageString,
  type AcademicYear,
  type Instructor,
  type StudentRow,
  type Subject,
} from "./types";

type ResultType = "percentage" | "inc" | "drop";

type GradeDraftRow = {
  key: string;
  subjectId: string;
  subjectCode: string;
  subjectTitle: string;
  instructorId: string | null;
  existingGrade: number | null; // decimal currently saved in DB, if any
  percentageInput: string; // what the Dean types now; blank = keep existing
  resultType: ResultType;
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
  const [addingInstructorFor, setAddingInstructorFor] = useState<string | null>(null);
  const [newInstructorName, setNewInstructorName] = useState("");
  const [instructorSaving, setInstructorSaving] = useState(false);

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
    (async () => {
      // Fetch existing Academic Years
      const { data: ays, error: ayError } = await supabase
        .from("academic_years")
        .select("id, year_label")
        .order("year_label", { ascending: false });

      let currentAys = ays ?? [];
      
      //Get the exact term based on your Aug/Jan calendar rules
      const currentTerm = getCurrentAcademicTerm();

      //Check if the calculated Academic Year exists in the database
      const hasCurrentAy = currentAys.some((ay) => ay.year_label === currentTerm.ayLabel);

      //If it doesn't exist, silently create it!
      if (!hasCurrentAy && !ayError) {
        const { data: newAy } = await supabase
          .from("academic_years")
          .insert({ year_label: currentTerm.ayLabel })
          .select("id, year_label")
          .single();

        if (newAy) {
          currentAys = [newAy, ...currentAys];
        }
      }

      //Fetch Subjects and Instructors concurrently
      const [{ data: subs }, { data: ins }] = await Promise.all([
        supabase.from("subjects").select("*").order("subject_code"),
        supabase.from("instructors").select("id, first_name, last_name").order("last_name"),
      ]);

      setAcademicYears(currentAys);
      setSubjects(subs ?? []);
      setInstructors(ins ?? []);

      //Automatically set both the Year and Semester dropdowns for the Dean!
      if (currentAys.length > 0) {
        // Find the ID of the dynamically generated (or matched) year
        const activeAyId = currentAys.find(ay => ay.year_label === currentTerm.ayLabel)?.id;
        if (activeAyId) {
          setSelectedAY(activeAyId);
        } else {
          setSelectedAY(currentAys[0].id); // Fallback
        }
      }
      
      // Automatically switch to 1st or 2nd semester based on the calendar month
      setSemester(currentTerm.semester);
      
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
        remarks: string;
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
          "id, subject_id, instructor_id, grade, remarks, is_retake, subjects(subject_code, subject_title)"
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

      function toResultType(remarks: string): ResultType {
        if (remarks === "inc") return "inc";
        if (remarks === "drop") return "drop";
        return "percentage";
      }

      const existingBySubject = new Map(gradeRows.map((g) => [g.subject_id, g]));

      const curriculumDrafts: GradeDraftRow[] = curriculumRows.map((c) => {
        const existing = existingBySubject.get(c.subject_id);
        return {
          key: c.subject_id,
          subjectId: c.subject_id,
          subjectCode: c.subjects?.subject_code ?? "—",
          subjectTitle: c.subjects?.subject_title ?? "—",
          instructorId: existing?.instructor_id ?? null,
          existingGrade: existing?.grade ?? null,
          percentageInput: "",
          resultType: existing ? toResultType(existing.remarks) : "percentage",
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
          existingGrade: g.grade,
          percentageInput: "",
          resultType: toResultType(g.remarks),
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
        existingGrade: null,
        percentageInput: "",
        resultType: "percentage",
        isRetake,
        isNew: true,
      },
    ]);
    setShowAddModal(false);
  }

  async function handleCreateInstructor(rowKey: string) {
  const trimmed = newInstructorName.trim();
  if (!trimmed) return;

  const parts = trimmed.split(/\s+/);
  const first_name = parts[0];
  const last_name = parts.slice(1).join(" ") || parts[0];

  setInstructorSaving(true);
  const { data, error } = await supabase
    .from("instructors")
    .insert({ first_name, last_name })
    .select()
    .single();
  setInstructorSaving(false);

  if (error || !data) {
    setSaveMessage(`Could not add instructor: ${error?.message}`);
    return;
  }

  setInstructors((prev) =>
    [...prev, data as Instructor].sort((a, b) => a.last_name.localeCompare(b.last_name))
  );
  updateRow(rowKey, { instructorId: (data as Instructor).id });
  setAddingInstructorFor(null);
  setNewInstructorName("");
}

  /** Resolves a row's final grade + remarks for saving/preview, or null if nothing to save. */
  function resolveRow(row: GradeDraftRow): { grade: number | null; remarks: string } | null {
    if (row.resultType === "inc") return { grade: null, remarks: "inc" };
    if (row.resultType === "drop") return { grade: null, remarks: "drop" };

    if (row.percentageInput.trim() !== "") {
      const pct = parseFloat(row.percentageInput);
      if (Number.isNaN(pct)) return null;
      const grade = percentageToGrade(pct);
      return { grade, remarks: computeRemarks(grade) };
    }
    if (row.existingGrade !== null) {
      return { grade: row.existingGrade, remarks: computeRemarks(row.existingGrade) };
    }
    return null;
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);

    const payload = rows
      .map((r) => {
        const resolved = resolveRow(r);
        if (!resolved) return null;
        return {
          student_id: student.id,
          subject_id: r.subjectId,
          instructor_id: r.instructorId,
          academic_year_id: selectedAY,
          semester,
          grade: resolved.grade,
          remarks: resolved.remarks,
          is_retake: r.isRetake,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

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

  const runningGWA = useMemo(() => {
    const entries = rows
      .map((r) => {
        const resolved = resolveRow(r);
        if (!resolved || resolved.grade === null) return null;
        const subj = subjects.find((s) => s.id === r.subjectId);
        return { grade: resolved.grade, units: subj?.units ?? 0 };
      })
      .filter((e): e is { grade: number; units: number } => e !== null);
    return computeGWA(entries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, subjects]);

  const runningPercentageGWA = useMemo(() => {
    const entries = rows
      .map((r) => {
        const resolved = resolveRow(r);
        if (!resolved || resolved.grade === null) return null;
        
        const subj = subjects.find((s) => s.id === r.subjectId);
        const units = subj?.units ?? 0;
        
        // Grab the percentage: either what the Dean just typed, or from the database
        let pct = 0;
        if (r.percentageInput.trim() !== "") {
          pct = parseFloat(r.percentageInput);
        } else if (r.existingGrade !== null) {
          pct = parseFloat(gradeToPercentageString(r.existingGrade));
        }

        if (Number.isNaN(pct)) return null;

        return { percentage: pct, units };
      })
      .filter((e): e is { percentage: number; units: number } => e !== null);

    if (entries.length === 0) return null;

    const totalUnits = entries.reduce((sum, e) => sum + e.units, 0);
    if (totalUnits === 0) return null;

    const totalPct = entries.reduce((sum, e) => sum + (e.percentage * e.units), 0);
    
    return totalPct / totalUnits;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, subjects]);



  

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
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 text-base font-semibold text-black">
              <th className="w-24 pb-3 pl-2">Code</th>
              <th className="w-52 pb-3">Subjects</th>
              <th className="w-36 pb-3 text-center">Result</th>
              <th className="w-28 pb-3 text-center">Grade %</th>
              <th className="w-44 pb-3 text-center">Instructor</th>
              <th className="pb-3 text-center">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  Loading curriculum...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  No subjects for this semester yet. Use &ldquo;Add Subject
                  Manually&rdquo; to encode one.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const resolved = resolveRow(row);
                const badge = resolved ? remarksBadge(resolved.remarks) : null;

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
                      <select
                        value={row.resultType}
                        onChange={(e) =>
                          updateRow(row.key, {
                            resultType: e.target.value as ResultType,
                            percentageInput: "",
                          })
                        }
                        className="w-full cursor-pointer rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                      >
                        <option value="percentage">Grade</option>
                        <option value="inc">INC</option>
                        <option value="drop">Dropped</option>
                      </select>
                    </td>
                    <td className="py-4 text-center">
                      {row.resultType === "percentage" ? (
                        <div>
                          <input
                            type="number"
                            min={70}
                            max={100}
                            step={1}
                            value={row.percentageInput}
                            onChange={(e) =>
                              updateRow(row.key, { percentageInput: e.target.value })
                            }
                            placeholder={
                              row.existingGrade !== null
                                ? gradeToPercentageString(row.existingGrade)
                                : "0–100"
                            }
                            className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm text-black outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                          />
                          
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                        {addingInstructorFor === row.key ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Full name"
                              value={newInstructorName}
                              onChange={(e) => setNewInstructorName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateInstructor(row.key);
                                if (e.key === "Escape") {
                                  setAddingInstructorFor(null);
                                  setNewInstructorName("");
                                }
                              }}
                              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-black outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleCreateInstructor(row.key)}
                              disabled={instructorSaving || !newInstructorName.trim()}
                              aria-label="Save new instructor"
                              className="cursor-pointer rounded-md bg-[#1b4d5c] px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                            >
                              {instructorSaving ? "..." : "Add"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddingInstructorFor(null);
                                setNewInstructorName("");
                              }}
                              aria-label="Cancel adding instructor"
                              className="cursor-pointer rounded-md px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <select
                            value={row.instructorId ?? ""}
                            onChange={(e) => {
                              if (e.target.value === "__add_new__") {
                                setAddingInstructorFor(row.key);
                                setNewInstructorName("");
                              } else {
                                updateRow(row.key, { instructorId: e.target.value || null });
                              }
                            }}
                            className="w-full cursor-pointer rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                          >
                            <option value="">Select...</option>
                            {instructors.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.first_name} {i.last_name}
                              </option>
                            ))}
                            <option value="__add_new__">+ Add New Instructor...</option>
                          </select>
                        )}
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

      <div className="mt-12 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          {runningPercentageGWA !== null && (
            <span>
              Running GWA:{" "}
              <span className={`font-semibold ${gwaColorClass(runningGWA)}`}>
                {runningPercentageGWA.toFixed(2)}%
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
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