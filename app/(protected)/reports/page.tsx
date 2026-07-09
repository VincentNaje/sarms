import Link from "next/link";
import { Home, ChevronRight, ClipboardList, GraduationCap, XCircle, UserX } from "lucide-react";

const REPORTS = [
  { href: "/reports/master-list", label: "Master List", icon: ClipboardList },
  { href: "/reports/graduating", label: "Graduating Student", icon: GraduationCap },
  { href: "/reports/failed-subjects", label: "Failed Subjects", icon: XCircle },
  { href: "/reports/dropped", label: "Dropped Student", icon: UserX },
];

export default function ReportsHubPage() {
  return (
    <div className="flex h-full w-full flex-col bg-white p-8">
      <div className="mb-16 flex items-center text-sm text-gray-800">
        <Home className="mr-2 h-4 w-4" />
        <ChevronRight className="mx-1 h-4 w-4" />
        <span className="font-medium">Reports</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center -mt-16">
        <h2 className="mb-10 text-lg font-medium text-black">
          Please select a report to generate:
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {REPORTS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex h-36 w-44 flex-col items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white shadow-sm transition-all hover:border-[#1b4d5c] hover:shadow-md"
            >
              <Icon className="h-9 w-9 text-black transition-colors group-hover:text-[#1b4d5c]" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-black">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}