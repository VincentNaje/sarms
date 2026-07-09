"use client";

import { useMemo, useState } from "react";
import { Home, ChevronRight, Filter } from "lucide-react";
import ReportTable from "@/components/reports/report-table";
import ExportButtons from "@/components/reports/export-buttons";
import { statusBadge, yearLevelLabel, type StudentStatus } from "@/lib/status";
import type { ReportColumn } from "@/lib/export";

export type MasterListRow = {
  id: string;
  student_number: string;
  name: string;
  status: StudentStatus;
  block: string;
  program_name: string;
};

const YEAR_LEVELS = ["1st year", "2nd year", "3rd year", "4th year"] as const;
const STATUS_GROUPS = [
  { value: "", label: "All" },
  { value: "enrolled", label: "Enrolled" },
  { value: "graduate", label: "Graduated" },
  { value: "dropout", label: "Dropped" },
  { value: "inactive", label: "Inactive" },
  { value: "transferred", label: "Transferred" },
] as const;

export default function MasterListClient({
  programName,
  allStudents,
}: {
  programName: string;
  allStudents: MasterListRow[];
}) {
  const [yearFilter, setYearFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", block: "", status: "" });

  const filtered = useMemo(() => {
    return allStudents.filter((s) => {
      if (appliedFilters.year && s.status !== appliedFilters.year) return false;
      if (appliedFilters.block && s.block !== appliedFilters.block) return false;
      if (appliedFilters.status) {
        if (appliedFilters.status === "enrolled") {
          if (!(YEAR_LEVELS as readonly string[]).includes(s.status)) return false;
        } else if (s.status !== appliedFilters.status) {
          return false;
        }
      }
      return true;
    });
  }, [allStudents, appliedFilters]);

  const blocks = useMemo(
    () => Array.from(new Set(allStudents.map((s) => s.block))).sort(),
    [allStudents]
  );

  const columns: ReportColumn<MasterListRow>[] = [
    { key: "student_number", label: "Student No.", accessor: (r) => r.student_number },
    { key: "name", label: "Name", accessor: (r) => r.name },
    { key: "year_level", label: "Year Level", accessor: (r) => yearLevelLabel(r.status) },
    { key: "block", label: "Block", accessor: (r) => r.block },
    {
      key: "status",
      label: "Status",
      accessor: (r) => statusBadge(r.status).label,
      render: (r) => {
        const badge = statusBadge(r.status);
        return (
          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-[#f8f9fa] p-8">
      <div className="mb-6 flex flex-none items-center text-sm text-gray-800">
        <Home className="mr-2 h-4 w-4" />
        <ChevronRight className="mx-1 h-4 w-4" />
        <span>Reports</span>
        <ChevronRight className="mx-1 h-4 w-4" />
        <span className="font-medium">Master List</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-none flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Program</label>
            <select
              value={programName}
              disabled
              className="w-48 cursor-not-allowed rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 outline-none"
            >
              <option>{programName}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Year Level</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-36 cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            >
              <option value="">All</option>
              {YEAR_LEVELS.map((y) => (
                <option key={y} value={y}>
                  {y.charAt(0).toUpperCase() + y.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Block</label>
            <select
              value={blockFilter}
              onChange={(e) => setBlockFilter(e.target.value)}
              className="w-28 cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            >
              <option value="">All</option>
              {blocks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36 cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            >
              {STATUS_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setAppliedFilters({ year: yearFilter, block: blockFilter, status: statusFilter })}
            className="flex cursor-pointer items-center gap-1.5 rounded-md bg-[#1b4d5c] px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#153c48]"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>

          <div className="ml-auto">
            <ExportButtons
              rows={filtered}
              columns={columns}
              filename="master-list"
              title="Master List"
              tableId="master-list-table"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ReportTable rows={filtered} columns={columns} tableId="master-list-table" />
        </div>
      </div>
    </div>
  );
}