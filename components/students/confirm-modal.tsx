"use client";

export default function ConfirmModal({
  message,
  confirmLabel,
  confirmClassName = "bg-[#26718f] hover:bg-[#1e5a73]",
  onConfirm,
  onCancel,
  busy,
}: {
  message: string;
  confirmLabel: string;
  confirmClassName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-[#1b4d5c] p-8 text-center text-white shadow-xl">
        <p className="mb-8 text-lg font-medium leading-relaxed">{message}</p>
        <div className="flex justify-center gap-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="cursor-pointer text-sm font-medium text-gray-300 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`cursor-pointer rounded-md px-8 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${confirmClassName}`}
          >
            {busy ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
