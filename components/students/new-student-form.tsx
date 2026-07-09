"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "./confirm-modal";
import { STATUS_OPTIONS } from "./types";
import type { Program } from "./types";

type FormState = {
  student_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  sex: string;
  program_id: string;
  current_block: string;
  status: string;
  academic_adviser: string;
  remarks: string;
};

// Fields that must not be empty before we let the Dean proceed.
const REQUIRED_FIELDS: (keyof FormState)[] = [
  "student_number",
  "first_name",
  "last_name",
  "program_id",
];

export default function NewStudentForm({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState<FormState>({
    student_number: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    sex: "",
    program_id: programs[0]?.id ?? "",
    current_block: "A",
    status: "1st year",
    academic_adviser: "",
    remarks: "",
  });

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: false }));
    }
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof FormState, boolean>> = {};
    for (const field of REQUIRED_FIELDS) {
      if (!form[field] || !form[field].trim()) {
        nextErrors[field] = true;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleReviewClick(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setShowConfirm(true);
  }

  async function handleConfirmSave() {
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("students").insert({
      student_number: form.student_number,
      first_name: form.first_name,
      middle_name: form.middle_name || null,
      last_name: form.last_name,
      suffix: form.suffix || null,
      sex: form.sex || null,
      program_id: form.program_id,
      current_block: form.current_block,
      status: form.status,
      academic_adviser: form.academic_adviser || null,
      remarks: form.remarks || null,
    });

    setSaving(false);
    setShowConfirm(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.push("/students/list");
  }

  function inputClass(field: keyof FormState) {
    const base =
      "w-full rounded-md border px-3 py-2 text-sm text-black outline-none focus:ring-1 transition-colors";
    return errors[field]
      ? `${base} border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-400`
      : `${base} border-gray-300 focus:border-gray-500 focus:ring-gray-500`;
  }

  function Label({
    field,
    children,
    required,
  }: {
    field: keyof FormState;
    children: React.ReactNode;
    required?: boolean;
  }) {
    return (
      <label className="mb-1 block text-sm text-gray-700">
        {children}
        {required && <span className="ml-0.5 text-red-500">*</span>}
        {errors[field] && (
          <span className="ml-2 text-xs font-normal text-red-500">Required</span>
        )}
      </label>
    );
  }

  return (
    <>
      <form
        onSubmit={handleReviewClick}
        className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
      >
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            ⚠ {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label field="student_number" required>
              Student No.
            </Label>
            <input
              type="text"
              placeholder="e.g. 2026-0001"
              value={form.student_number}
              onChange={(e) => update("student_number", e.target.value)}
              className={inputClass("student_number")}
            />
          </div>
          <div>
            <Label field="sex">Sex</Label>
            <select
              value={form.sex}
              onChange={(e) => update("sex", e.target.value)}
              className={inputClass("sex") + " cursor-pointer"}
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div>
            <Label field="first_name" required>
              First Name
            </Label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => update("first_name", e.target.value)}
              className={inputClass("first_name")}
            />
          </div>
          <div>
            <Label field="middle_name">Middle Name</Label>
            <input
              type="text"
              value={form.middle_name}
              onChange={(e) => update("middle_name", e.target.value)}
              className={inputClass("middle_name")}
            />
          </div>
          <div>
            <Label field="last_name" required>
              Last Name
            </Label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => update("last_name", e.target.value)}
              className={inputClass("last_name")}
            />
          </div>
          <div>
            <Label field="suffix">Suffix</Label>
            <input
              type="text"
              value={form.suffix}
              onChange={(e) => update("suffix", e.target.value)}
              className={inputClass("suffix")}
            />
          </div>

          <div>
            <Label field="program_id" required>
              Program
            </Label>
            <select
              value={form.program_id}
              onChange={(e) => update("program_id", e.target.value)}
              className={inputClass("program_id") + " cursor-pointer"}
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.program_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label field="current_block">Block</Label>
            <select
              value={form.current_block}
              onChange={(e) => update("current_block", e.target.value)}
              className={inputClass("current_block") + " cursor-pointer"}
            >
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select>
          </div>
          <div>
            <Label field="status">Status</Label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className={inputClass("status") + " cursor-pointer"}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label field="academic_adviser">Academic Adviser</Label>
            <input
              type="text"
              value={form.academic_adviser}
              onChange={(e) => update("academic_adviser", e.target.value)}
              className={inputClass("academic_adviser")}
            />
          </div>

          <div className="md:col-span-2">
            <Label field="remarks">Remarks</Label>
            <input
              type="text"
              value={form.remarks}
              onChange={(e) => update("remarks", e.target.value)}
              className={inputClass("remarks")}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => router.push("/students")}
            className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-md bg-[#1b4d5c] px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#153c48]"
          >
            Save Student
          </button>
        </div>
      </form>

      {showConfirm && (
        <ConfirmModal
          message={`Add ${form.first_name} ${form.last_name} as a new student? Please double-check the information before confirming.`}
          confirmLabel="Confirm & Save"
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirm(false)}
          busy={saving}
        />
      )}
    </>
  );
}