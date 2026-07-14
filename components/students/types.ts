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

/** Philippine-style unit-weighted GWA: Σ(grade × units) / Σ(units). Lower is better. */
export function computeGWA(entries: { grade: number | null; units: number }[]): number | null {
  const valid = entries.filter((e) => e.grade !== null && e.units > 0);
  if (valid.length === 0) return null;
  const weightedSum = valid.reduce((sum, e) => sum + e.grade! * e.units, 0);
  const totalUnits = valid.reduce((sum, e) => sum + e.units, 0);
  return totalUnits > 0 ? weightedSum / totalUnits : null;
}

export function gwaColorClass(gwa: number | null): string {
  if (gwa === null) return "text-gray-400";
  return gwa <= 3.0 ? "text-green-600" : "text-red-600";
}

// Percentage-to-grade equivalence table (Philippine grading system).
// Checked top-down; first matching range wins. Below 75% = Failed (5.0).
const PERCENTAGE_GRADE_TABLE: { min: number; max: number; grade: number }[] = [
  { min: 99, max: 100, grade: 1.0 },
  { min: 98, max: 98, grade: 1.1 },
  { min: 97, max: 97, grade: 1.2 },
  { min: 96, max: 96, grade: 1.3 },
  { min: 95, max: 95, grade: 1.4 },
  { min: 94, max: 94, grade: 1.5 },
  { min: 93, max: 93, grade: 1.6 },
  { min: 92, max: 92, grade: 1.7 },
  { min: 91, max: 91, grade: 1.8 },
  { min: 90, max: 90, grade: 1.9 },
  { min: 89, max: 89, grade: 2.0 },
  { min: 88, max: 88, grade: 2.1 },
  { min: 87, max: 87, grade: 2.2 },
  { min: 86, max: 86, grade: 2.3 },
  { min: 85, max: 85, grade: 2.4 },
  { min: 84, max: 84, grade: 2.5 },
  { min: 82, max: 83, grade: 2.6 },
  { min: 80, max: 81, grade: 2.7 },
  { min: 78, max: 79, grade: 2.8 },
  { min: 76, max: 77, grade: 2.9 },
  { min: 75, max: 75, grade: 3.0 },
];

/** Converts a percentage score (0-100) into its Philippine grade-scale equivalent. */
export function percentageToGrade(pct: number): number {
  if (pct >= 75 && pct <= 100) {
    const match = PERCENTAGE_GRADE_TABLE.find((r) => pct >= r.min && pct <= r.max);
    if (match) return match.grade;
  }
  return 5.0; // Below 75% = Failed, same flat grade regardless of exact score
}

export function gradeToPercentageString(grade: number): string {
  const entry = PERCENTAGE_GRADE_TABLE.find((row) => row.grade === grade);
  
  if (entry) {
    return entry.max.toString();
  }
  return grade.toFixed(2); 
}

export function getCurrentAcademicTerm() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 = January, 7 = August, 11 = December

  // If the current month is August (7) through December (11)
  if (currentMonth >= 7) {
    return {
      ayLabel: `${currentYear}-${currentYear + 1}`,
      semester: "1st" as const,
    };
  } 
  // If the current month is January (0) through July (6)
  else {
    return {
      ayLabel: `${currentYear - 1}-${currentYear}`,
      semester: "2nd" as const,
    };
  }
}