"use client";

import { Home, ChevronRight } from "lucide-react";
import ReportTable from "@/components/reports/report-table";
import ExportButtons from "@/components/reports/export-buttons";
import type { ReportColumn } from "@/lib/export";

export type SimpleStudentRow = {
  id: string;
  student_number: string;
  name: string;
  block: string;
  remarks: string | null;
};

export default function SimpleStudentReportClient({
  breadcrumbLabel,
  programName,
  students,
  filename,
  title,
  emptyMessage,
  statusColumnLabel,
  statusValue,
}: {
  breadcrumbLabel: string;
  programName: string;
  students: SimpleStudentRow[];
  filename: string;
  title: string;
  emptyMessage: string;
  statusColumnLabel: string;
  statusValue: string;
}) {
  const columns: ReportColumn<SimpleStudentRow>[] = [
    { key: "student_number", label: "Student No.", accessor: (r) => r.student_number },
    { key: "name", label: "Name", accessor: (r) => r.name },
    { key: "block", label: "Block", accessor: (r) => r.block },
    { key: "status", label: statusColumnLabel, accessor: () => statusValue },
    { key: "remarks", label: "Remarks", accessor: (r) => r.remarks ?? "—" },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-[#f8f9fa] p-8">
      <div className="mb-6 flex flex-none items-center text-sm text-gray-800">
        <Home className="mr-2 h-4 w-4" />
        <ChevronRight className="mx-1 h-4 w-4" />
        <span>Reports</span>
        <ChevronRight className="mx-1 h-4 w-4" />
        <span className="font-medium">{breadcrumbLabel}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-none flex-wrap items-end justify-between gap-3">
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

          <ExportButtons
            rows={students}
            columns={columns}
            filename={filename}
            title={title}
            tableId={`${filename}-table`}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ReportTable
            rows={students}
            columns={columns}
            tableId={`${filename}-table`}
            emptyMessage={emptyMessage}
          />
        </div>
      </div>
    </div>
  );
}