"use client";

import { FileText, FileSpreadsheet, Printer } from "lucide-react";
import { exportToExcel, exportToPDF, printReport, type ReportColumn } from "@/lib/export";

export default function ExportButtons<T>({
  rows,
  columns,
  filename,
  title,
  tableId,
}: {
  rows: T[];
  columns: ReportColumn<T>[];
  filename: string;
  title: string;
  tableId: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => exportToPDF(rows, columns, filename, title)}
        disabled={rows.length === 0}
        className="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FileText className="h-3.5 w-3.5" />
        PDF
      </button>
      <button
        type="button"
        onClick={() => exportToExcel(rows, columns, filename)}
        disabled={rows.length === 0}
        className="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Excel
      </button>
      <button
        type="button"
        onClick={() => printReport(tableId)}
        disabled={rows.length === 0}
        className="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Printer className="h-3.5 w-3.5" />
        Print
      </button>
    </div>
  );
}