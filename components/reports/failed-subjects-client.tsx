"use client";

import { useMemo, useState } from "react";
import { Home, ChevronRight } from "lucide-react";
import ReportTable from "@/components/reports/report-table";
import ExportButtons from "@/components/reports/export-buttons";
import type { ReportColumn } from "@/lib/export";

export type FailedSubjectRow = {
  id: string;
  student_number: string;
  student_name: string;
  subject_code: string;
  subject_title: string;
  grade: number | null;
  academic_year: string;
  semester: string;
};

export default function FailedSubjectsClient({
  programName,
  allRows,
  academicYears,
}: {
  programName: string;
  allRows: FailedSubjectRow[];
  academicYears: string[];
}) {
  const [ayFilter, setAyFilter] = useState("");

  const filtered = useMemo(() => {
    if (!ayFilter) return allRows;
    return allRows.filter((r) => r.academic_year === ayFilter);
  }, [allRows, ayFilter]);

  const columns: ReportColumn<FailedSubjectRow>[] = [
    { key: "student_number", label: "Student No.", accessor: (r) => r.student_number },
    { key: "name", label: "Name", accessor: (r) => r.student_name },
    { key: "subject_code", label: "Subject Code", accessor: (r) => r.subject_code },
    { key: "subject_title", label: "Subject Title", accessor: (r) => r.subject_title },
    { key: "grade", label: "Grade", accessor: (r) => (r.grade != null ? r.grade.toFixed(2) : "—") },
    { key: "academic_year", label: "Academic Year", accessor: (r) => r.academic_year },
    {
      key: "semester",
      label: "Semester",
      accessor: (r) => (r.semester === "1st" ? "1st Semester" : "2nd Semester"),
    },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-[#f8f9fa] p-8">
      <div className="mb-6 flex flex-none items-center text-sm text-gray-800">
        <Home className="mr-2 h-4 w-4" />
        <ChevronRight className="mx-1 h-4 w-4" />
        <span>Reports</span>
        <ChevronRight className="mx-1 h-4 w-4" />
        <span className="font-medium">Failed Subjects</span>
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
            <label className="mb-1 block text-xs text-gray-500">Academic Year</label>
            <select
              value={ayFilter}
              onChange={(e) => setAyFilter(e.target.value)}
              className="w-40 cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            >
              <option value="">All</option>
              {academicYears.map((ay) => (
                <option key={ay} value={ay}>
                  {ay}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto">
            <ExportButtons
              rows={filtered}
              columns={columns}
              filename="failed-subjects"
              title="Failed Subjects"
              tableId="failed-subjects-table"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ReportTable
            rows={filtered}
            columns={columns}
            tableId="failed-subjects-table"
            emptyMessage="No failed subjects found."
          />
        </div>
      </div>
    </div>
  );
}