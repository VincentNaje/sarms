import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReactNode } from "react";

export type ReportColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  accessor: (row: T) => string | number;
};

export function exportToExcel<T>(
  rows: T[],
  columns: ReportColumn<T>[],
  filename: string
) {
  const data = rows.map((row) => {
    const record: Record<string, string | number> = {};
    columns.forEach((col) => {
      record[col.label] = col.accessor(row);
    });
    return record;
  });
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF<T>(
  rows: T[],
  columns: ReportColumn<T>[],
  filename: string,
  title: string
) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 21);

  autoTable(doc, {
    startY: 26,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => String(c.accessor(row)))),
    headStyles: { fillColor: [27, 77, 92] },
    styles: { fontSize: 8 },
  });

  doc.save(`${filename}.pdf`);
}

export function printReport(elementId: string) {
  const printContents = document.getElementById(elementId)?.outerHTML;
  if (!printContents) return;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Print Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
          th { background: #1b4d5c; color: white; }
        </style>
      </head>
      <body>${printContents}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}