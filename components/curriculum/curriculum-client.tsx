"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "@/components/students/confirm-modal";
import AssignSubjectModal from "./assign-subject-modal";
import {
  YEAR_LEVELS,
  SEMESTERS,
  yearLabel,
  semesterLabel,
  type CurriculumEntry,
  type SubjectOption,
} from "./types";

export default function CurriculumClient({
  programId,
  programName,
  initialEntries,
  initialSubjects,
}: {
  programId: string;
  programName: string;
  initialEntries: CurriculumEntry[];
  initialSubjects: SubjectOption[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState<CurriculumEntry[]>(initialEntries);
  const [subjects, setSubjects] = useState<SubjectOption[]>(initialSubjects);
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set(["1|1st"]));
  const [showAssign, setShowAssign] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<CurriculumEntry | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePanel(key: string) {
    setOpenPanels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const grandTotal = entries.reduce((sum, e) => sum + e.units, 0);

  async function handleAssign({
    subjectId,
    yearLevel,
    semester,
  }: {
    subjectId: string;
    yearLevel: number;
    semester: "1st" | "2nd";
  }) {
    const { data, error: insertError } = await supabase
      .from("curriculum")
      .insert({ program_id: programId, subject_id: subjectId, year_level: yearLevel, semester })
      .select("id, year_level, semester, subjects(id, subject_code, subject_title, units)")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return { error: "This subject is already assigned to that year and semester." };
      }
      return { error: insertError.message };
    }

    const row = data as unknown as {
      id: string;
      year_level: number;
      semester: "1st" | "2nd";
      subjects: { id: string; subject_code: string; subject_title: string; units: number };
    };

    setEntries((prev) => [
      ...prev,
      {
        curriculumId: row.id,
        subjectId: row.subjects.id,
        subjectCode: row.subjects.subject_code,
        subjectTitle: row.subjects.subject_title,
        units: row.subjects.units,
        yearLevel: row.year_level,
        semester: row.semester,
      },
    ]);
    setOpenPanels((prev) => new Set(prev).add(`${yearLevel}|${semester}`));
    return {};
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    setError(null);

    const { error: deleteError } = await supabase
      .from("curriculum")
      .delete()
      .eq("id", removeTarget.curriculumId);

    setRemoving(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.curriculumId !== removeTarget.curriculumId));
    setRemoveTarget(null);
  }

  function handleSubjectCreated(subject: SubjectOption) {
    setSubjects((prev) => [...prev, subject]);
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#f8f9fa] p-8">
      <div className="mb-6 flex flex-none items-center justify-between">
        <select
          value={programId}
          disabled
          className="w-64 cursor-not-allowed rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
        >
          <option value={programId}>{programName}</option>
        </select>
        <button
          type="button"
          onClick={() => setShowAssign(true)}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-[#1b4d5c] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#153c48]"
        >
          <Plus className="h-4 w-4" />
          Assign Subject
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-4 flex-none text-sm text-red-600">
          ⚠ {error}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {YEAR_LEVELS.map((year) =>
          SEMESTERS.map((sem) => {
            const key = `${year}|${sem}`;
            const panelEntries = entries.filter(
              (e) => e.yearLevel === year && e.semester === sem
            );
            const panelUnits = panelEntries.reduce((sum, e) => sum + e.units, 0);
            const isOpen = openPanels.has(key);

            return (
              <div
                key={key}
                className="mb-2 overflow-hidden rounded-lg border border-gray-200"
              >
                <button
                  type="button"
                  onClick={() => togglePanel(key)}
                  className="flex w-full cursor-pointer items-center justify-between bg-gray-50 px-4 py-3 text-left text-sm"
                >
                  <span className="flex items-center gap-2 font-medium text-gray-800">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                    {yearLabel(year)} · {semesterLabel(sem)}
                  </span>
                  <span className="text-gray-500">{panelUnits} units</span>
                </button>

                {isOpen && (
                  <div className="flex flex-wrap gap-2 p-4">
                    {panelEntries.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        No subjects assigned yet.
                      </p>
                    ) : (
                      panelEntries.map((entry) => (
                        <span
                          key={entry.curriculumId}
                          className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700"
                        >
                          {entry.subjectCode}
                          <button
                            type="button"
                            onClick={() => setRemoveTarget(entry)}
                            aria-label={`Remove ${entry.subjectCode} from curriculum`}
                            className="cursor-pointer rounded-full p-0.5 hover:bg-sky-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex flex-none items-center justify-between border-t border-gray-200 pt-4 text-sm">
        <span className="text-gray-500">Total program units</span>
        <span className="font-semibold text-gray-800">{grandTotal}</span>
      </div>

      {showAssign && (
        <AssignSubjectModal
          subjects={subjects}
          onClose={() => setShowAssign(false)}
          onAssign={handleAssign}
          onSubjectCreated={handleSubjectCreated}
        />
      )}

      {removeTarget && (
        <ConfirmModal
          message={`Remove ${removeTarget.subjectCode} - ${removeTarget.subjectTitle} from the curriculum? This won't affect grades already encoded for students who already took it.`}
          confirmLabel="Remove"
          confirmClassName="bg-red-600 hover:bg-red-700"
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
          busy={removing}
        />
      )}
    </div>
  );
}