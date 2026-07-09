export interface CurriculumEntry {
  curriculumId: string;
  subjectId: string;
  subjectCode: string;
  subjectTitle: string;
  units: number;
  yearLevel: number;
  semester: "1st" | "2nd";
}

export interface SubjectOption {
  id: string;
  subject_code: string;
  subject_title: string;
  units: number;
}

export const YEAR_LEVELS = [1, 2, 3, 4] as const;
export const SEMESTERS = ["1st", "2nd"] as const;

export function yearLabel(year: number): string {
  const labels: Record<number, string> = {
    1: "1st Year",
    2: "2nd Year",
    3: "3rd Year",
    4: "4th Year",
  };
  return labels[year] ?? `Year ${year}`;
}

export function semesterLabel(semester: string): string {
  return semester === "1st" ? "1st Semester" : "2nd Semester";
}