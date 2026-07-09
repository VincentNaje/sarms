import { createClient } from "@/lib/supabase/server";
import MasterListClient, { type MasterListRow } from "@/components/reports/master-list-client";

export default async function MasterListPage() {
  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("id, program_name")
    .limit(1)
    .single();

  const { data: rows, error } = await supabase
    .from("students")
    .select("id, student_number, first_name, middle_name, last_name, current_block, status, programs(program_name)")
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

  type QueryRow = {
    id: string;
    student_number: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    current_block: string;
    status: MasterListRow["status"];
    programs: { program_name: string } | null;
  };

  const students: MasterListRow[] = ((rows ?? []) as unknown as QueryRow[]).map((r) => ({
    id: r.id,
    student_number: r.student_number,
    name: `${r.last_name}, ${r.first_name}${r.middle_name ? " " + r.middle_name : ""}`,
    status: r.status,
    block: r.current_block,
    program_name: r.programs?.program_name ?? "—",
  }));

  return (
    <MasterListClient
      programName={program?.program_name ?? "BS Tourism Management"}
      allStudents={students}
    />
  );
}