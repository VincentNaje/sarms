import { createClient } from "@/lib/supabase/server";
import SimpleStudentReportClient, {
  type SimpleStudentRow,
} from "@/components/reports/simple-student-report-client";

export default async function GraduatingReportPage() {
  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("id, program_name")
    .limit(1)
    .single();

  const { data: rows, error } = await supabase
    .from("students")
    .select("id, student_number, first_name, middle_name, last_name, current_block, remarks")
    .eq("status", "graduate")
    .order("last_name", { ascending: true });

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

  const students: SimpleStudentRow[] = (rows ?? []).map((r) => ({
    id: r.id,
    student_number: r.student_number,
    name: `${r.last_name}, ${r.first_name}${r.middle_name ? " " + r.middle_name : ""}`,
    block: r.current_block,
    remarks: r.remarks,
  }));

  return (
    <SimpleStudentReportClient
      breadcrumbLabel="Graduating Student"
      programName={program?.program_name ?? "BS Tourism Management"}
      students={students}
      filename="graduating-students"
      title="Graduating Students"
      emptyMessage="No students are currently marked as graduated."
      statusColumnLabel="Status"
      statusValue="Graduated"
    />
  );
}