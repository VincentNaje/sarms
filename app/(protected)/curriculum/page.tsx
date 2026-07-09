import { createClient } from "@/lib/supabase/server";
import CurriculumClient from "@/components/curriculum/curriculum-client";
import type { CurriculumEntry, SubjectOption } from "@/components/curriculum/types";

export default async function CurriculumPage() {
  const supabase = await createClient();

  const { data: programs, error: programsError } = await supabase
    .from("programs")
    .select("id, program_name")
    .limit(1)
    .single();

  if (programsError || !programs) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">Failed to load program.</p>
          <p className="mt-1 text-sm">
            {programsError?.message ?? "No program found — seed the programs table first."}
          </p>
        </div>
      </div>
    );
  }

  const [{ data: curriculumRows, error: curriculumError }, { data: subjectRows, error: subjectsError }] =
    await Promise.all([
      supabase
        .from("curriculum")
        .select("id, year_level, semester, subjects(id, subject_code, subject_title, units)")
        .eq("program_id", programs.id),
      supabase
        .from("subjects")
        .select("id, subject_code, subject_title, units")
        .order("subject_code"),
    ]);

  if (curriculumError || subjectsError) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">Failed to load curriculum.</p>
          <p className="mt-1 text-sm">
            {curriculumError?.message || subjectsError?.message}
          </p>
        </div>
      </div>
    );
  }

  type CurriculumQueryRow = {
    id: string;
    year_level: number;
    semester: "1st" | "2nd";
    subjects: { id: string; subject_code: string; subject_title: string; units: number } | null;
  };

  const entries: CurriculumEntry[] = ((curriculumRows ?? []) as unknown as CurriculumQueryRow[])
    .filter((r) => r.subjects !== null)
    .map((r) => ({
      curriculumId: r.id,
      subjectId: r.subjects!.id,
      subjectCode: r.subjects!.subject_code,
      subjectTitle: r.subjects!.subject_title,
      units: r.subjects!.units,
      yearLevel: r.year_level,
      semester: r.semester,
    }));

  return (
    <CurriculumClient
      programId={programs.id}
      programName={programs.program_name}
      initialEntries={entries}
      initialSubjects={(subjectRows ?? []) as SubjectOption[]}
    />
  );
}