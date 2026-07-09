"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "@/components/students/confirm-modal";
import SubjectFormModal from "./subject-form-modal";
import { CATEGORY_OPTIONS, type SubjectCategory, type SubjectRow } from "./types";

const PAGE_SIZE = 10;

export default function SubjectsListClient({
  initialSubjects,
}: {
  initialSubjects: SubjectRow[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [subjects, setSubjects] = useState<SubjectRow[]>(initialSubjects);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SubjectCategory | "">("");
  const [page, setPage] = useState(1);
  const [editingSubject, setEditingSubject] = useState<SubjectRow | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<SubjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subjects.filter((s) => {
      if (
        q &&
        !s.subject_code.toLowerCase().includes(q) &&
        !s.subject_title.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (categoryFilter && s.category !== categoryFilter) return false;
      return true;
    });
  }, [subjects, query, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleSave(payload: {
    subject_code: string;
    subject_title: string;
    category: SubjectCategory;
    lec_units: number;
    lab_units: number;
  }) {
    if (editingSubject && editingSubject !== "new") {
      const { data, error } = await supabase
        .from("subjects")
        .update(payload)
        .eq("id", editingSubject.id)
        .select()
        .single();
      if (error) return { error: error.message };
      setSubjects((prev) =>
        prev.map((s) => (s.id === editingSubject.id ? (data as SubjectRow) : s))
      );
      return {};
    }

    const { data, error } = await supabase
      .from("subjects")
      .insert(payload)
      .select()
      .single();
    if (error) return { error: error.message };
    setSubjects((prev) => [...prev, data as SubjectRow]);
    return {};
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    const { error } = await supabase.from("subjects").delete().eq("id", deleteTarget.id);

    setDeleting(false);

    if (error) {
      setDeleteError(error.message);
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#f8f9fa] p-8">
      <h1 className="mb-6 flex-none text-lg font-semibold text-gray-800">Subject</h1>

      {/* Card wrapper: header/filters fixed, table scrolls internally, pagination fixed */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-none flex-wrap items-center gap-3 border-b border-gray-100 p-6">
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search subject code or title"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm text-black outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as SubjectCategory | "");
              setPage(1);
            }}
            className="cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setEditingSubject("new")}
            className="ml-auto flex cursor-pointer items-center gap-2 rounded-md bg-[#1b4d5c] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#153c48]"
          >
            <Plus className="h-4 w-4" />
            Add Subject
          </button>
        </div>

        {/* This is the only part that scrolls */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-gray-300 text-gray-600">
                <th className="py-3 pr-4 font-medium">Code</th>
                <th className="py-3 pr-4 font-medium">Title</th>
                <th className="py-3 pr-4 font-medium">Lec</th>
                <th className="py-3 pr-4 font-medium">Lab</th>
                <th className="py-3 pr-4 font-medium">Units</th>
                <th className="py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    No subjects found.
                  </td>
                </tr>
              ) : (
                paged.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 pr-4 font-medium text-[#1b4d5c]">
                      {s.subject_code}
                    </td>
                    <td className="py-4 pr-4 text-gray-700">{s.subject_title}</td>
                    <td className="py-4 pr-4 text-gray-600">{s.lec_units}</td>
                    <td className="py-4 pr-4 text-gray-600">
                      {s.lab_units > 0 ? s.lab_units : "-"}
                    </td>
                    <td className="py-4 pr-4 text-gray-600">{s.units}</td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingSubject(s)}
                        aria-label={`Edit ${s.subject_code}`}
                        className="mr-2 cursor-pointer rounded-md p-1.5 text-blue-500 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(s)}
                        aria-label={`Delete ${s.subject_code}`}
                        className="cursor-pointer rounded-md p-1.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-none items-center justify-between border-t border-gray-100 bg-gray-50/30 px-6 py-4">
          <p className="text-sm text-gray-500">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
            subjects
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
                  p === currentPage
                    ? "bg-[#1b4d5c] text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {editingSubject && (
        <SubjectFormModal
          subject={editingSubject === "new" ? null : editingSubject}
          onClose={() => setEditingSubject(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          message="Deleting this subject cannot be undone. Are you sure?"
          confirmLabel="Delete"
          confirmClassName="bg-red-600 hover:bg-red-700"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          busy={deleting}
        />
      )}
      {deleteError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          ⚠ {deleteError}
        </p>
      )}
    </div>
  );
}