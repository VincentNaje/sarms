import { Users, UserCheck, UserX, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/stat-card";
import StudentSearchTable, {
  ViewAllLink,
  type DashboardStudentRow,
} from "@/components/student-search-table";
import DashboardSearchBar from "@/components/dashboard-search-bar";
import { type StudentStatus } from "@/lib/status";

const TABLE_LIMIT = 10;
const ENROLLED_STATUSES: StudentStatus[] = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  // Lightweight count-only queries -- these must reflect ALL students,
  // not just the 10 shown in the table, and stay cheap even at scale
  // (head: true means Postgres never sends row data, just the count).
  const [totalRes, enrolledRes, droppedRes, graduatedRes] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .in("status", ENROLLED_STATUSES),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "dropout"),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "graduate"),
  ]);

  const countError =
    totalRes.error || enrolledRes.error || droppedRes.error || graduatedRes.error;

  // The actual table data: capped at TABLE_LIMIT, with an optional
  // server-side search across the full table (not just this page).
  let listQuery = supabase
    .from("students")
    .select(
      "id, first_name, middle_name, last_name, current_block, status, programs(program_name)"
    );

  if (q && q.trim()) {
    const term = q.trim();
    listQuery = listQuery.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,student_number.ilike.%${term}%`
    );
  }

  const { data: rows, error: listError } = await listQuery
    .order("created_at", { ascending: false })
    .limit(TABLE_LIMIT);

  if (countError || listError) {
    return (
      <main className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">Failed to load dashboard data.</p>
          <p className="mt-1 text-sm">
            {countError?.message || listError?.message}
          </p>
        </div>
      </main>
    );
  }

  type StudentQueryRow = {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    current_block: string;
    status: StudentStatus;
    programs: { program_name: string } | null;
  };

  const students: DashboardStudentRow[] = (
    (rows ?? []) as unknown as StudentQueryRow[]
  ).map((r) => ({
    id: r.id,
    name: `${r.last_name}, ${r.first_name}${
      r.middle_name ? " " + r.middle_name : ""
    }`,
    program: r.programs?.program_name ?? "—",
    status: r.status,
    block: r.current_block,
  }));

  const total = totalRes.count ?? 0;
  const enrolled = enrolledRes.count ?? 0;
  const dropped = droppedRes.count ?? 0;
  const graduated = graduatedRes.count ?? 0;

  return (
    <main className="p-8">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-lg font-semibold text-gray-800">Dashboard</h1>

        <div className="mb-6 grid grid-cols-4 gap-4">
          <StatCard icon={Users} value={total} label="Total Student" variant="blue" />
          <StatCard
            icon={UserCheck}
            value={enrolled}
            label="Officially Enrolled"
            variant="green"
          />
          <StatCard icon={UserX} value={dropped} label="Dropped" variant="red" />
          <StatCard
            icon={GraduationCap}
            value={graduated}
            label="Graduated"
            variant="yellow"
          />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {q ? `Search results for "${q}"` : "10 most recently added students"}
          </p>
          <div className="flex items-center gap-4">
            <DashboardSearchBar />
            <ViewAllLink />
          </div>
        </div>

        <StudentSearchTable students={students} />
      </div>
    </main>
  );
}