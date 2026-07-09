import Link from "next/link";
import { Home, ChevronRight, Users, UserPlus } from "lucide-react";

export default function StudentsHubPage() {
  return (
    <div className="flex h-full w-full flex-col bg-white p-8">
      <div className="mb-20 flex items-center text-sm text-gray-800">
        <Home className="mr-2 h-4 w-4" />
        <ChevronRight className="mx-1 h-4 w-4" />
        <span className="font-medium">Student</span>
      </div>

      <div className="-mt-20 flex flex-1 flex-col items-center justify-center">
        <h2 className="mb-12 text-lg font-medium text-black">
          Please select action you want to do:
        </h2>

        <div className="flex items-center gap-8">
          <Link
            href="/students/list"
            className="group flex h-56 w-56 flex-col items-center justify-center rounded-xl border border-gray-300 bg-white shadow-sm transition-all hover:border-[#1b4d5c] hover:shadow-md"
          >
            <div className="mb-4 text-black transition-colors group-hover:text-[#1b4d5c]">
              <Users className="h-16 w-16" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-semibold text-black">
              View Student List
            </span>
          </Link>

          <Link
            href="/students/new"
            className="group flex h-56 w-56 flex-col items-center justify-center rounded-xl border border-gray-300 bg-white shadow-sm transition-all hover:border-[#1b4d5c] hover:shadow-md"
          >
            <div className="mb-4 text-black transition-colors group-hover:text-[#1b4d5c]">
              <UserPlus className="h-16 w-16" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-semibold text-black">
              Add New Student
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
