export type StudentStatus =
  | "1st year"
  | "2nd year"
  | "3rd year"
  | "4th year"
  | "graduate"
  | "dropout"
  | "inactive"
  | "transferred";

const YEAR_STATUSES: StudentStatus[] = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
];

/** Year Level column: only meaningful for actively-enrolled students. */
export function yearLevelLabel(status: StudentStatus): string {
  return YEAR_STATUSES.includes(status) ? status : "—";
}

/** Status badge: color + friendly label for each of the 8 status values. */
export function statusBadge(status: StudentStatus): {
  label: string;
  className: string;
} {
  if (YEAR_STATUSES.includes(status)) {
    return {
      label: "Enrolled",
      className: "bg-green-100 text-green-700",
    };
  }
  switch (status) {
    case "graduate":
      return { label: "Graduated", className: "bg-yellow-100 text-yellow-700" };
    case "dropout":
      return { label: "Dropped", className: "bg-red-100 text-red-700" };
    case "inactive":
      return { label: "Inactive", className: "bg-gray-200 text-gray-700" };
    case "transferred":
      return { label: "Transferred", className: "bg-purple-100 text-purple-700" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-700" };
  }
}

export function isEnrolled(status: StudentStatus): boolean {
  return YEAR_STATUSES.includes(status);
}
