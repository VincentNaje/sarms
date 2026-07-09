"use client";

import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import SubjectFormModal from "@/components/subjects/subject-form-modal";
import type { SubjectCategory, SubjectRow } from "@/components/subjects/types";
import { YEAR_LEVELS, SEMESTERS, yearLabel, semesterLabel, type SubjectOption } from "./types";

export default function AssignSubjectModal({
  subjects,
  onClose,
  onAssign,
  onSubjectCreated,
}: {
  subjects: SubjectOption[];
  onClose: () => void;
  onAssign: (args: {
    subjectId: string;
    yearLevel: number;
    semester: "1st" | "2nd";
  }) => Promise<{ error?: string }>;
  onSubjectCreated: (subject: SubjectOption) => void;
}) {
  const [yearLevel, setYearLevel] = useState<number>(1);
  const [semester, setSemester] = useState<"1st" | "2nd">("1st");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SubjectOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateSubject, setShowCreateSubject] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects.slice(0, 20);
    return subjects
      .filter(
        (s) =>
          s.subject_code.toLowerCase().includes(q) ||
          s.subject_title.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [subjects, query]);

  async function handleAssign() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const result = await onAssign({ subjectId: selected.id, yearLevel, semester });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  }

  async function handleSubjectFormSave(payload: {
    subject_code: string;
    subject_title: string;
    category: SubjectCategory;
    lec_units: number;
    lab_units: number;
  }): Promise<{ error?: string }> {
    // Delegate the actual insert to the same Subjects-module logic via
    // a plain Supabase call here would duplicate code, so instead we
    // let the parent handle creation and report back the new row.
    const created = await createSubjectAndReturn(payload);
    if ("error" in created) return { error: created.error };
    onSubjectCreated(created.subject);
    setSelected(created.subject);
    setShowCreateSubject(false);
    return {};
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-[#f8f9fa] p-6">
          <div>
            <h3 className="text-lg font-bold text-[#1b4d5c]">Assign Subject</h3>
            <p className="text-sm text-gray-500">BS Tourism Management</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close assign subject modal"
            className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {error && (
            <p role="alert" className="text-sm text-red-600">
              ⚠ {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-700">Year level</label>
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(Number(e.target.value))}
                className="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              >
                {YEAR_LEVELS.map((y) => (
                  <option key={y} value={y}>
                    {yearLabel(y)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as "1st" | "2nd")}
                className="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {semesterLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700">Subject</label>
            {selected ? (
              <div className="flex items-center justify-between rounded-md border border-[#1b4d5c] bg-[#e9f2f4] px-3 py-2">
                <span className="text-sm text-gray-800">
                  <span className="font-semibold">{selected.subject_code}</span> —{" "}
                  {selected.subject_title}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Clear selected subject"
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search subject code or title"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm text-black outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto rounded-md border border-gray-200">
                  {results.length === 0 ? (
                    <div className="p-3 text-center">
                      <p className="mb-2 text-sm text-gray-400">
                        No subjects found for &ldquo;{query}&rdquo;.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowCreateSubject(true)}
                        className="cursor-pointer text-sm font-medium text-sky-600 hover:underline"
                      >
                        + Create &ldquo;{query}&rdquo; as a new subject
                      </button>
                    </div>
                  ) : (
                    results.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelected(s)}
                        className="block w-full cursor-pointer border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-800">
                          {s.subject_code}
                        </span>{" "}
                        <span className="text-gray-600">{s.subject_title}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 p-4 px-6">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected || saving}
            onClick={handleAssign}
            className="cursor-pointer rounded-md bg-[#1b4d5c] px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#153c48] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Assigning..." : "Assign Subject"}
          </button>
        </div>
      </div>

      {showCreateSubject && (
        <SubjectFormModal
          subject={null}
          onClose={() => setShowCreateSubject(false)}
          onSave={handleSubjectFormSave}
        />
      )}
    </div>
  );
}

// Injected by the parent via prop in a real setup would be cleaner,
// but to keep this modal self-contained we do the insert here.
async function createSubjectAndReturn(payload: {
  subject_code: string;
  subject_title: string;
  category: SubjectCategory;
  lec_units: number;
  lab_units: number;
}): Promise<{ subject: SubjectOption } | { error: string }> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subjects")
    .insert(payload)
    .select()
    .single();
  if (error) return { error: error.message };
  const row = data as SubjectRow;
  return {
    subject: {
      id: row.id,
      subject_code: row.subject_code,
      subject_title: row.subject_title,
      units: row.units,
    },
  };
}