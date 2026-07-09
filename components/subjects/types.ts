export type SubjectCategory =
  | "GE"
  | "GEE"
  | "THC"
  | "TPC"
  | "PEC"
  | "CBMEC"
  | "PE"
  | "NSTP";

export const CATEGORY_OPTIONS: SubjectCategory[] = [
  "GE",
  "GEE",
  "THC",
  "TPC",
  "PEC",
  "CBMEC",
  "PE",
  "NSTP",
];

export interface SubjectRow {
  id: string;
  subject_code: string;
  subject_title: string;
  lec_units: number;
  lab_units: number;
  units: number;
  category: SubjectCategory;
}

const CATEGORY_STYLES: Record<SubjectCategory, string> = {
  GE: "bg-blue-50 text-blue-600",
  GEE: "bg-indigo-50 text-indigo-600",
  THC: "bg-teal-50 text-teal-600",
  TPC: "bg-purple-50 text-purple-600",
  PEC: "bg-pink-50 text-pink-600",
  CBMEC: "bg-orange-50 text-orange-600",
  PE: "bg-green-50 text-green-600",
  NSTP: "bg-gray-100 text-gray-600",
};

export function categoryBadgeClass(category: SubjectCategory): string {
  return CATEGORY_STYLES[category] ?? "bg-gray-100 text-gray-600";
}