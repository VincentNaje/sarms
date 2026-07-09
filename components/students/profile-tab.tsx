"use client";

import type { Program, StudentRow } from "./types";
import { STATUS_OPTIONS } from "./types";

export type ProfileDraft = Pick<
  StudentRow,
  | "first_name"
  | "middle_name"
  | "last_name"
  | "suffix"
  | "sex"
  | "program_id"
  | "current_block"
  | "status"
  | "academic_adviser"
  | "remarks"
>;

export default function ProfileInfoTab({
  student,
  draft,
  setDraft,
  programs,
  isEditing,
}: {
  student: StudentRow;
  draft: ProfileDraft;
  setDraft: (d: ProfileDraft) => void;
  programs: Program[];
  isEditing: boolean;
}) {
  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-gray-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors";
  const selectClass = inputClass + " cursor-pointer disabled:cursor-not-allowed";

  return (
    <div className="grid grid-cols-1 gap-12 pt-4 md:grid-cols-3">
      {/* Column 1: Personal Information */}
      <div className="space-y-4">
        <h3 className="mb-4 border-b border-gray-200 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Personal Information
        </h3>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Student No.</label>
          <input
            type="text"
            value={student.student_number}
            disabled
            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500 outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">First Name</label>
          <input
            type="text"
            value={draft.first_name}
            disabled={!isEditing}
            onChange={(e) => setDraft({ ...draft, first_name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Middle Name</label>
          <input
            type="text"
            value={draft.middle_name ?? ""}
            disabled={!isEditing}
            onChange={(e) => setDraft({ ...draft, middle_name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Last Name</label>
          <input
            type="text"
            value={draft.last_name}
            disabled={!isEditing}
            onChange={(e) => setDraft({ ...draft, last_name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Suffix</label>
          <input
            type="text"
            value={draft.suffix ?? ""}
            disabled={!isEditing}
            onChange={(e) => setDraft({ ...draft, suffix: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Sex</label>
          <select
            value={draft.sex ?? ""}
            disabled={!isEditing}
            onChange={(e) =>
              setDraft({ ...draft, sex: e.target.value as "Male" | "Female" })
            }
            className={selectClass}
          >
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      {/* Column 2: Academic Information */}
      <div className="space-y-4">
        <h3 className="mb-4 border-b border-gray-200 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Academic Information
        </h3>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Program</label>
          <select
            value={draft.program_id}
            disabled={!isEditing}
            onChange={(e) => setDraft({ ...draft, program_id: e.target.value })}
            className={selectClass}
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.program_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          {/* Status doubles as year-level standing, per schema -- no separate Year Level field */}
          <label className="mb-1 block text-sm text-gray-700">Status</label>
          <select
            value={draft.status}
            disabled={!isEditing}
            onChange={(e) =>
              setDraft({ ...draft, status: e.target.value as ProfileDraft["status"] })
            }
            className={selectClass}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Block</label>
          <select
            value={draft.current_block}
            disabled={!isEditing}
            onChange={(e) => setDraft({ ...draft, current_block: e.target.value })}
            className={selectClass}
          >
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>
        </div>
      </div>

      {/* Column 3: Notes */}
      <div className="space-y-4">
        <h3 className="mb-4 border-b border-gray-200 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Notes
        </h3>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Academic Adviser</label>
          <input
            type="text"
            value={draft.academic_adviser ?? ""}
            disabled={!isEditing}
            onChange={(e) => setDraft({ ...draft, academic_adviser: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Remarks</label>
          <input
            type="text"
            value={draft.remarks ?? ""}
            disabled={!isEditing}
            onChange={(e) => setDraft({ ...draft, remarks: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
