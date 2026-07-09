import { createClient } from "@/lib/supabase/server";
import SubjectsListClient from "@/components/subjects/subjects-list-client";
import type { SubjectRow } from "@/components/subjects/types";

export default async function SubjectsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subjects")
    .select("id, subject_code, subject_title, lec_units, lab_units, units, category")
    .order("subject_code", { ascending: true });

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">Failed to load subjects.</p>
          <p className="mt-1 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return <SubjectsListClient initialSubjects={(data ?? []) as SubjectRow[]} />;
}