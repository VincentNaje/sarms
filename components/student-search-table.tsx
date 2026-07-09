import Link from "next/link";
import { yearLevelLabel, statusBadge, type StudentStatus } from "@/lib/status";

export type DashboardStudentRow = {
  id: string;
  name: string;
  program: string;
  status: StudentStatus;
  block: string;
};

export default function StudentSearchTable({
  students,
}: {
  students: DashboardStudentRow[];
}) {
  return (
    <div className="overflow-hidden rounded-md bg-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-left text-gray-600">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Program</th>
            <th className="px-4 py-3 font-medium">Year Level</th>
            <th className="px-4 py-3 font-medium">Block</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                No students found.
              </td>
            </tr>
          ) : (
            students.map((s) => {
              const badge = statusBadge(s.status);
              return (
                <tr key={s.id} className="border-b border-gray-200 bg-white/40">
                  <td className="px-4 py-3 text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-800">{s.program}</td>
                  <td className="px-4 py-3 text-gray-800">{yearLevelLabel(s.status)}</td>
                  <td className="px-4 py-3 text-gray-800">{s.block}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ViewAllLink() {
  return (
    <Link
      href="/students/list"
      className="text-sm font-medium text-sky-600 hover:underline"
    >
      View All Students →
    </Link>
  );
}