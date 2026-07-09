import { createClient } from "@/lib/supabase/server";
import FailedSubjectsClient, {
  type FailedSubjectRow,
} from "@/components/reports/failed-subjects-client";

export default async function FailedSubjectsPage() {
  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("id, program_name")
    .limit(1)
    .single();

  const { data: rows, error } = await supabase
    .from("student_grades")
    .select(
      "id, grade, semester, students(student_number, first_name, middle_name, last_name), subjects(subject_code, subject_title), academic_years(year_label)"
    )
    .eq("remarks", "failed");

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">Failed to load report data.</p>
          <p className="mt-1 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  type QueryRow = {
    id: string;
    grade: number | null;
    semester: "1st" | "2nd";
    students: {
      student_number: string;
      first_name: string;
      middle_name: string | null;
      last_name: string;
    } | null;
    subjects: { subject_code: string; subject_title: string } | null;
    academic_years: { year_label: string } | null;
  };

  const failedRows: FailedSubjectRow[] = ((rows ?? []) as unknown as QueryRow[])
    .filter((r) => r.students && r.subjects && r.academic_years)
    .map((r) => ({
      id: r.id,
      student_number: r.students!.student_number,
      student_name: `${r.students!.last_name}, ${r.students!.first_name}${
        r.students!.middle_name ? " " + r.students!.middle_name : ""
      }`,
      subject_code: r.subjects!.subject_code,
      subject_title: r.subjects!.subject_title,
      grade: r.grade,
      academic_year: r.academic_years!.year_label,
      semester: r.semester,
    }));

  const academicYears = Array.from(new Set(failedRows.map((r) => r.academic_year))).sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <FailedSubjectsClient
      programName={program?.program_name ?? "BS Tourism Management"}
      allRows={failedRows}
      academicYears={academicYears}
    />
  );
}