import { Home, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import StudentListClient from "@/components/students/student-list-client";
import type { StudentRow } from "@/components/students/types";

export default async function StudentListPage() {
  const supabase = await createClient();

  const [{ data: studentRows }, { data: programRows }] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, student_number, first_name, middle_name, last_name, suffix, sex, program_id, current_block, status, academic_adviser, remarks, programs(program_name)"
      )
      .order("last_name", { ascending: true }),
    supabase.from("programs").select("id, program_code, program_name"),
  ]);

  type StudentQueryRow = Omit<StudentRow, "program_name"> & {
    programs: { program_name: string } | null;
  };

  const students: StudentRow[] = ((studentRows ?? []) as unknown as StudentQueryRow[]).map(
    (r) => ({
      id: r.id,
      student_number: r.student_number,
      first_name: r.first_name,
      middle_name: r.middle_name,
      last_name: r.last_name,
      suffix: r.suffix,
      sex: r.sex,
      program_id: r.program_id,
      program_name: r.programs?.program_name ?? "—",
      current_block: r.current_block,
      status: r.status,
      academic_adviser: r.academic_adviser,
      remarks: r.remarks,
    })
  );

  return (
    <div className="flex h-full w-full flex-col bg-[#f8f9fa]">
      <div className="flex items-center px-8 pt-6 text-sm text-gray-800">
        <Home className="mr-2 h-4 w-4" />
        <ChevronRight className="mx-1 h-4 w-4" />
        <span>Student</span>
        <ChevronRight className="mx-1 h-4 w-4" />
        <span className="font-medium">View Student Records</span>
      </div>
      <StudentListClient initialStudents={students} programs={programRows ?? []} />
    </div>
  );
}
