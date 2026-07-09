import { Home, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NewStudentForm from "@/components/students/new-student-form";

export default async function NewStudentPage() {
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from("programs")
    .select("id, program_code, program_name");

  return (
    <div className="flex h-full w-full flex-col bg-[#f8f9fa] p-8">
      <div className="mb-8 flex items-center text-sm text-gray-800">
        <Home className="mr-2 h-4 w-4" />
        <ChevronRight className="mx-1 h-4 w-4" />
        <span>Student</span>
        <ChevronRight className="mx-1 h-4 w-4" />
        <span className="font-medium">Add New Student</span>
      </div>
      <NewStudentForm programs={programs ?? []} />
    </div>
  );
}
