"use client";

import { useState } from "react";
import { X } from "lucide-react";
import ConfirmModal from "@/components/students/confirm-modal";
import { CATEGORY_OPTIONS, type SubjectCategory, type SubjectRow } from "./types";

type FormState = {
  subject_code: string;
  subject_title: string;
  category: SubjectCategory | "";
  lec_units: string;
  lab_units: string;
};

type FieldKey = keyof FormState;
const REQUIRED_FIELDS: FieldKey[] = ["subject_code", "subject_title", "category"];

function toForm(subject?: SubjectRow | null): FormState {
  return {
    subject_code: subject?.subject_code ?? "",
    subject_title: subject?.subject_title ?? "",
    category: subject?.category ?? "",
    lec_units: subject ? String(subject.lec_units) : "",
    lab_units: subject ? String(subject.lab_units) : "0",
  };
}

export default function SubjectFormModal({
  subject,
  onClose,
  onSave,
}: {
  subject?: SubjectRow | null;
  onClose: () => void;
  onSave: (payload: {
    subject_code: string;
    subject_title: string;
    category: SubjectCategory;
    lec_units: number;
    lab_units: number;
  }) => Promise<{ error?: string }>;
}) {
  const isEdit = !!subject;
  const [form, setForm] = useState<FormState>(() => toForm(subject));
  const [errors, setErrors] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends FieldKey>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  }

  const lec = parseFloat(form.lec_units) || 0;
  const lab = parseFloat(form.lab_units) || 0;
  const computedUnits = lec + lab;

  function validate(): boolean {
    const next: Partial<Record<FieldKey, boolean>> = {};
    for (const field of REQUIRED_FIELDS) {
      if (!form[field] || !String(form[field]).trim()) next[field] = true;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
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

    const result = await onSave({
      subject_code: form.subject_code.trim(),
      subject_title: form.subject_title.trim(),
      category: form.category as SubjectCategory,
      lec_units: lec,
      lab_units: lab,
    });

    setSaving(false);
    setShowConfirm(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  }

  function inputClass(field: FieldKey) {
    const base =
      "w-full rounded-md border px-3 py-2 text-sm text-black outline-none focus:ring-1 transition-colors";
    return errors[field]
      ? `${base} border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-400`
      : `${base} border-gray-300 focus:border-gray-500 focus:ring-gray-500`;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-[#FFFFFF] shadow-2xl">
          <div className="flex items-center justify-between p-6 pb-0">
            <h3 className="text-lg font-semibold text-black">
              {isEdit ? "Edit Subject" : "Add Subject"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close subject form"
              className="cursor-pointer rounded-full p-1.5 text-black/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleReviewClick} className="space-y-4 p-6">
            {error && (
              <p role="alert" className="text-sm text-red-300">
                ⚠ {error}
              </p>
            )}

            <div>
              <label className="mb-1 flex items-center gap-1 text-sm text-black/90">
                Code
                <span className="text-red-300">*</span>
                {errors.subject_code && (
                  <span className="ml-1 text-xs font-normal text-red-300">
                    Required
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder="e.g. THC 1"
                value={form.subject_code}
                onChange={(e) => update("subject_code", e.target.value)}
                className={inputClass("subject_code")}
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 text-sm text-black/90">
                Title
                <span className="text-red-300">*</span>
                {errors.subject_title && (
                  <span className="ml-1 text-xs font-normal text-red-300">
                    Required
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder="e.g. Philippine Culture and Tourism Geography"
                value={form.subject_title}
                onChange={(e) => update("subject_title", e.target.value)}
                className={inputClass("subject_title")}
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 text-sm text-black/90">
                Category
                <span className="text-red-300">*</span>
                {errors.category && (
                  <span className="ml-1 text-xs font-normal text-red-300">
                    Required
                  </span>
                )}
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className={inputClass("category") + " cursor-pointer"}
              >
                <option value="">Select category...</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm text-black/90">Lec</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.lec_units}
                  onChange={(e) => update("lec_units", e.target.value)}
                  className={inputClass("lec_units")}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-black/90">Lab</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.lab_units}
                  onChange={(e) => update("lab_units", e.target.value)}
                  className={inputClass("lab_units")}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-black/90">Units</label>
                <input
                  type="text"
                  value={computedUnits}
                  disabled
                  title="Units is calculated automatically as Lec + Lab"
                  className="w-full cursor-not-allowed rounded-md border border-black/20 bg-black/10 px-3 py-2 text-sm text-black/70 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-6 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer text-sm font-medium text-black/70 hover:text-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-md bg-sky-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-600"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          message={
            isEdit
              ? "Is the subject information correct? This will update the existing record."
              : "Do you want to add this subject? Please double-check the details before confirming."
          }
          confirmLabel={isEdit ? "Confirm & Update" : "Confirm & Add"}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirm(false)}
          busy={saving}
        />
      )}
    </>
  );
}