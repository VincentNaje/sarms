"use client";

import { useMemo, useState } from "react";
import { X, Edit, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "./confirm-modal";
import ProfileInfoTab, { type ProfileDraft } from "./profile-tab";
import AcademicHistoryTab from "./academic-history-tab";
import GradesTab from "./grades-tab";
import type { Program, StudentRow } from "./types";

const TABS = ["Profile Info", "Academic History", "Grades"] as const;
type Tab = (typeof TABS)[number];

function toDraft(student: StudentRow): ProfileDraft {
  return {
    first_name: student.first_name,
    middle_name: student.middle_name,
    last_name: student.last_name,
    suffix: student.suffix,
    sex: student.sex,
    program_id: student.program_id,
    current_block: student.current_block,
    status: student.status,
    academic_adviser: student.academic_adviser,
    remarks: student.remarks,
  };
}

export default function StudentDetailModal({
  student,
  programs,
  onClose,
  onUpdated,
  onDeleted,
}: {
  student: StudentRow;
  programs: Program[];
  onClose: () => void;
  onUpdated: (student: StudentRow) => void;
  onDeleted: (studentId: string) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<Tab>("Profile Info");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(() => toDraft(student));
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("students")
      .update(draft)
      .eq("id", student.id)
      .select("*, programs(program_name)")
      .single();

    setBusy(false);
    setShowSaveConfirm(false);

    if (error || !data) {
      setErrorMessage(error?.message ?? "Failed to save changes.");
      return;
    }

    const updated: StudentRow = {
      ...student,
      ...draft,
      program_name:
        (data as { programs?: { program_name: string } })?.programs?.program_name ??
        student.program_name,
    };
    onUpdated(updated);
    setIsEditing(false);
  }

  async function handleDelete() {
    setBusy(true);
    setErrorMessage(null);

    const { error } = await supabase.from("students").delete().eq("id", student.id);

    setBusy(false);
    setShowDeleteConfirm(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    onDeleted(student.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-[#f8f9fa] p-6">
          <h2 className="text-xl font-bold text-[#1b4d5c]">
            Viewing Record: {student.first_name} {student.last_name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close student record"
            className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative overflow-y-auto p-8">
          {errorMessage && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              ⚠ {errorMessage}
            </p>
          )}

          <div className="relative mb-8 flex justify-center gap-12 border-b border-gray-200 pb-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "text-[#1b4d5c] underline decoration-2 underline-offset-8"
                    : "text-gray-500 hover:text-[#1b4d5c]"
                }`}
              >
                {tab}
              </button>
            ))}

            {activeTab === "Profile Info" && !isEditing && (
              <div className="absolute bottom-2 right-0 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit student profile"
                  className="cursor-pointer text-blue-500 transition-colors hover:text-blue-600"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="Delete student record"
                  className="cursor-pointer text-red-500 transition-colors hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {activeTab === "Profile Info" && (
            <div className="flex flex-col">
              <ProfileInfoTab
                student={student}
                draft={draft}
                setDraft={setDraft}
                programs={programs}
                isEditing={isEditing}
              />

              {isEditing && (
                <div className="mt-12 flex justify-end gap-4 border-t border-gray-100 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(toDraft(student));
                      setIsEditing(false);
                    }}
                    className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSaveConfirm(true)}
                    className="cursor-pointer rounded-md bg-[#1b4d5c] px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#153c48]"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "Academic History" && (
            <AcademicHistoryTab studentId={student.id} />
          )}

          {activeTab === "Grades" && <GradesTab student={student} />}
        </div>
      </div>

      {showSaveConfirm && (
        <ConfirmModal
          message="Save the changes?"
          confirmLabel="Save"
          onConfirm={handleSave}
          onCancel={() => setShowSaveConfirm(false)}
          busy={busy}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          message="Are you sure you want to delete this Student Record? This action cannot be undone."
          confirmLabel="Delete"
          confirmClassName="bg-red-600 hover:bg-red-700"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          busy={busy}
        />
      )}
    </div>
  );
}
