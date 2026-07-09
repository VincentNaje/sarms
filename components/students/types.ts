import type { StudentStatus } from "@/lib/status";

export type { StudentStatus };

export interface Program {
  id: string;
  program_code: string;
  program_name: string;
}

export interface AcademicYear {
  id: string;
  year_label: string;
}

export interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
}

export interface Subject {
  id: string;
  subject_code: string;
  subject_title: string;
  lec_units: number;
  lab_units: number;
  units: number;
  category: string;
}

export interface StudentRow {
  id: string;
  student_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  sex: "Male" | "Female" | null;
  program_id: string;
  program_name: string;
  current_block: string;
  status: StudentStatus;
  academic_adviser: string | null;
  remarks: string | null;
}

export interface CurriculumSubject {
  subject_id: string;
  subject_code: string;
  subject_title: string;
  units: number;
  year_level: number;
  semester: "1st" | "2nd";
}

export interface GradeRow {
  id: string;
  subject_id: string;
  subject_code: string;
  subject_title: string;
  units: number;
  instructor_id: string | null;
  instructor_name: string | null;
  grade: number | null;
  remarks: "pass" | "failed" | "inc" | "drop";
  is_retake: boolean;
}

export const STATUS_OPTIONS: StudentStatus[] = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
  "graduate",
  "dropout",
  "inactive",
  "transferred",
];

export const REMARKS_OPTIONS = ["pass", "failed", "inc", "drop"] as const;

/** Auto-computes the Remarks badge from a numeric grade, PH grading scale (1.00 best - 5.00 worst). */
export function computeRemarks(grade: number | null): "pass" | "failed" {
  if (grade === null || Number.isNaN(grade)) return "failed";
  return grade <= 3.0 ? "pass" : "failed";
}

export function remarksBadge(remarks: string): { label: string; className: string } {
  switch (remarks) {
    case "pass":
      return { label: "Passed", className: "bg-green-50 text-green-600" };
    case "failed":
      return { label: "Failed", className: "bg-red-50 text-red-600" };
    case "inc":
      return { label: "INC", className: "bg-yellow-50 text-yellow-700" };
    case "drop":
      return { label: "Dropped", className: "bg-gray-100 text-gray-600" };
    default:
      return { label: remarks, className: "bg-gray-100 text-gray-600" };
  }
}

/** Derives the numeric year level (1-4) from status, when applicable. */
export function statusToYearLevel(status: StudentStatus): number | null {
  const map: Record<string, number> = {
    "1st year": 1,
    "2nd year": 2,
    "3rd year": 3,
    "4th year": 4,
  };
  return map[status] ?? null;
}
