"use client";

import { useMemo, useState } from "react";
import { Search, MoreHorizontal, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import StudentDetailModal from "./student-detail-modal";
import { statusBadge, yearLevelLabel } from "@/lib/status";
import type { Program, StudentRow } from "./types";

const PAGE_SIZE = 10;
const YEAR_LEVELS = ["1st year", "2nd year", "3rd year", "4th year"] as const;
const STATUS_GROUPS = [
  { value: "", label: "Status" },
  { value: "enrolled", label: "Enrolled" },
  { value: "graduate", label: "Graduated" },
  { value: "dropout", label: "Dropped" },
  { value: "inactive", label: "Inactive" },
  { value: "transferred", label: "Transferred" },
] as const;

export default function StudentListClient({
  initialStudents,
  programs,
}: {
  initialStudents: StudentRow[];
  programs: Program[];
}) {
  const [students, setStudents] = useState<StudentRow[]>(initialStudents);
  const [query, setQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StudentRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      if (q && !fullName.includes(q) && !s.student_number.toLowerCase().includes(q)) {
        return false;
      }
      if (programFilter && s.program_id !== programFilter) return false;
      if (yearFilter && s.status !== yearFilter) return false;
      if (statusFilter) {
        if (statusFilter === "enrolled") {
          if (!(YEAR_LEVELS as readonly string[]).includes(s.status)) return false;
        } else if (s.status !== statusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [students, query, programFilter, yearFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function handleUpdated(updated: StudentRow) {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelected(updated);
  }

  function handleDeleted(studentId: string) {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-[#f8f9fa] p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1b4d5c]">Student Records</h1>
          <p className="mt-1 text-sm text-gray-500">
            Total:{" "}
            <span className="font-semibold text-gray-700">{filtered.length}</span>{" "}
            students
          </p>
        </div>

        <div className="relative w-72">
          <input
            type="text"
            placeholder="Search Student..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 outline-none transition-all focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Main Card */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-6">
          <div className="flex items-center gap-1 text-gray-500">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>

          <select
            value={programFilter}
            onChange={(e) => {
              setProgramFilter(e.target.value);
              setPage(1);
            }}
            className="min-w-[180px] cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 outline-none hover:bg-gray-50 focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
          >
            <option value="">Program</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.program_name}
              </option>
            ))}
          </select>

          <select
            value={yearFilter}
            disabled={!!statusFilter && statusFilter !== "enrolled"}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setPage(1);
            }}
            className="min-w-[140px] cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 outline-none hover:bg-gray-50 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Year Level</option>
            {YEAR_LEVELS.map((y) => (
              <option key={y} value={y}>
                {y.charAt(0).toUpperCase() + y.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setYearFilter("");
              setPage(1);
            }}
            className="min-w-[140px] cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 outline-none hover:bg-gray-50 focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
          >
            {STATUS_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="w-full flex-1 overflow-x-auto p-6 pt-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="pb-4 pr-4">Full Name</th>
                <th className="pb-4 pr-4">Program</th>
                <th className="pb-4 pr-4">Year Level</th>
                <th className="pb-4 pr-4">Block</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                paged.map((student) => {
                  const badge = statusBadge(student.status);
                  return (
                    <tr
                      key={student.id}
                      className="border-t border-gray-50 transition-colors hover:bg-gray-50/50"
                    >
                      <td className="py-4 pr-4 font-medium text-[#1b4d5c]">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="py-4 pr-4 text-gray-600">
                        {student.program_name}
                      </td>
                      <td className="py-4 pr-4 text-gray-600">
                        {yearLevelLabel(student.status)}
                      </td>
                      <td className="py-4 pr-4 text-gray-600">
                        {student.current_block}
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelected(student)}
                          aria-label={`View ${student.first_name} ${student.last_name}`}
                          className="inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-[#1b4d5c]"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/30 px-6 py-4">
          <p className="text-sm text-gray-500">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
            students
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

      {selected && (
        <StudentDetailModal
          student={selected}
          programs={programs}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
