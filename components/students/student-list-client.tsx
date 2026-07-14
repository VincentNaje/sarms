"use client";

import { useMemo, useState } from "react";
import { Search, MoreHorizontal, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import StudentDetailModal from "./student-detail-modal";
import { statusBadge, yearLevelLabel } from "@/lib/status";
import { createClient } from "@/lib/supabase/client"; // <-- Ensure this is imported for the bulk update
import type { Program, StudentRow } from "./types";

const PAGE_SIZE = 10;
const YEAR_LEVELS = ["1st year", "2nd year", "3rd year", "4th year"] as const;
const GENDER_OPTIONS = [
  { value: "", label: "Gender" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
] as const;
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
  const supabase = useMemo(() => createClient(), []);
  
  const [students, setStudents] = useState<StudentRow[]>(initialStudents);
  const [query, setQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StudentRow | null>(null);

  // --- NEW BULK UPDATE STATES ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newBulkStatus, setNewBulkStatus] = useState("");
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      if (q && !fullName.includes(q) && !s.student_number.toLowerCase().includes(q)) {
        return false;
      }
      if (programFilter && s.program_id !== programFilter) return false;
      if (yearFilter && s.status !== yearFilter) return false;
      if (genderFilter && s.sex !== genderFilter) return false;
      if (statusFilter) {
        if (statusFilter === "enrolled") {
          if (!(YEAR_LEVELS as readonly string[]).includes(s.status)) return false;
        } else if (s.status !== statusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [students, query, programFilter, yearFilter, genderFilter, statusFilter]);

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
    // Remove from selection if it was selected
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  }

  // --- NEW BULK SELECTION LOGIC ---
  const isAllPagedSelected = paged.length > 0 && paged.every(s => selectedIds.has(s.id));
  
  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (isAllPagedSelected) {
      // Deselect all on current page
      paged.forEach(s => next.delete(s.id));
    } else {
      // Select all on current page
      paged.forEach(s => next.add(s.id));
    }
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkUpdate = async () => {
    if (!newBulkStatus || selectedIds.size === 0) return;
    setIsUpdatingBulk(true);

    const idsArray = Array.from(selectedIds);

    // Update in Supabase (Make sure 'students' matches your actual table name)
    const { error } = await supabase
      .from('students')
      .update({ status: newBulkStatus })
      .in('id', idsArray);

    if (!error) {
      // Instantly update the local UI without refreshing
      setStudents(prev => prev.map(s => 
        idsArray.includes(s.id) ? { ...s, status: newBulkStatus } : s
      ));
      setSelectedIds(new Set()); // Clear selections
      setShowBulkModal(false);
      setNewBulkStatus("");
    } else {
      alert("Error updating students: " + error.message);
    }
    
    setIsUpdatingBulk(false);
  };

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
        
        {/* Filters & Dynamic Bulk Action Bar */}
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

          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPage(1);
            }}
            className="min-w-[130px] cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 outline-none hover:bg-gray-50 focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
          >
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>

          {/* THE DYNAMIC ACTION BAR: Pushed to the far right using ml-auto */}
          <div className="ml-auto flex items-center">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <span className="text-sm font-semibold text-[#1b4d5c]">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="cursor-pointer rounded-md bg-[#1b4d5c] px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#153c48]"
                >
                  Update Status
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="w-full flex-1 overflow-x-auto p-6 pt-2">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {/* NEW CHECKBOX HEADER */}
                <th className="pb-4 pl-2 pr-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={isAllPagedSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#1b4d5c]"
                  />
                </th>
                <th className="pb-4 pr-4">Full Name</th>
                <th className="pb-4 pr-4">Gender</th>
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
                  <td colSpan={8} className="py-10 text-center text-gray-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                paged.map((student) => {
                  const badge = statusBadge(student.status);
                  const isSelected = selectedIds.has(student.id);

                  return (
                    <tr
                      key={student.id}
                      className={`border-t border-gray-50 transition-colors hover:bg-gray-50/50 ${isSelected ? 'bg-blue-50/30' : ''}`}
                    >
                      {/* NEW CHECKBOX ROW */}
                      <td className="py-4 pl-2 pr-4">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelectOne(student.id)}
                          className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#1b4d5c]"
                        />
                      </td>
                      <td className="py-4 pr-4 font-medium text-[#1b4d5c]">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="py-4 pr-4 text-gray-600">
                        {student.sex ?? "—"}
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

      {/* NEW BULK UPDATE MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl zoom-in-95 animate-in">
            <div className="border-b border-gray-200 bg-[#f8f9fa] p-6">
              <h2 className="text-xl font-bold text-[#1c304f]">Batch Update Status</h2>
            </div>
            
            <div className="p-6">
              <p className="mb-6 text-sm text-gray-600">
                You are about to update the records of <span className="font-bold text-[#1b4d5c]">{selectedIds.size}</span> students. Select their new status or year level below.
              </p>
              
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">New Status</label>
                <select
                  value={newBulkStatus}
                  onChange={(e) => setNewBulkStatus(e.target.value)}
                  className="w-full cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none transition-colors focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                >
                  <option value="" disabled>Select new status...</option>
                  <optgroup label="Year Levels">
                    {YEAR_LEVELS.map(y => <option key={y} value={y}>{y.charAt(0).toUpperCase() + y.slice(1)}</option>)}
                  </optgroup>
                  <optgroup label="Other Statuses">
                    {STATUS_GROUPS.filter(g => g.value && g.value !== 'enrolled').map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 p-4 px-6">
              <button
                onClick={() => setShowBulkModal(false)}
                disabled={isUpdatingBulk}
                className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={!newBulkStatus || isUpdatingBulk}
                className="cursor-pointer rounded-md bg-[#1b4d5c] px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#153c48] disabled:opacity-50"
              >
                {isUpdatingBulk ? "Updating..." : "Confirm Update"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}