"use client";

import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import type { Subject, Instructor } from "./types";

export default function AddSubjectModal({
  subjects,
  instructors,
  alreadyAddedSubjectIds,
  onClose,
  onAdd,
}: {
  subjects: Subject[];
  instructors: Instructor[];
  alreadyAddedSubjectIds: string[];
  onClose: () => void;
  onAdd: (args: {
    subjectId: string;
    instructorId: string | null;
    isRetake: boolean;
  }) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [instructorId, setInstructorId] = useState<string>("");
  const [isRetake, setIsRetake] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = subjects.filter(
      (s) => !alreadyAddedSubjectIds.includes(s.id)
    );
    if (!q) return available.slice(0, 20);
    return available
      .filter(
        (s) =>
          s.subject_code.toLowerCase().includes(q) ||
          s.subject_title.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [subjects, alreadyAddedSubjectIds, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-[#f8f9fa] p-6">
          <h3 className="text-lg font-bold text-[#1b4d5c]">Add Subject</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add subject modal"
            className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Subject
            </label>
            {selectedSubject ? (
              <div className="flex items-center justify-between rounded-md border border-[#1b4d5c] bg-[#e9f2f4] px-3 py-2">
                <span className="text-sm text-gray-800">
                  <span className="font-semibold">{selectedSubject.subject_code}</span>{" "}
                  — {selectedSubject.subject_title}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSubject(null)}
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
                    <p className="px-3 py-3 text-sm text-gray-400">
                      No subjects found.
                    </p>
                  ) : (
                    results.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSubject(s)}
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Instructor
            </label>
            <select
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              className="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            >
              <option value="">Select an instructor...</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.first_name} {i.last_name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isRetake}
              onChange={(e) => setIsRetake(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-gray-300"
            />
            Mark as retake / irregular subject
          </label>
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
            disabled={!selectedSubject}
            onClick={() =>
              selectedSubject &&
              onAdd({
                subjectId: selectedSubject.id,
                instructorId: instructorId || null,
                isRetake,
              })
            }
            className="cursor-pointer rounded-md bg-[#1b4d5c] px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#153c48] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to List
          </button>
        </div>
      </div>
    </div>
  );
}
