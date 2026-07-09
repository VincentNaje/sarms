import type { LucideIcon } from "lucide-react";

type Variant = "blue" | "green" | "red" | "yellow";

const VARIANT_STYLES: Record<Variant, { border: string; iconBg: string }> = {
  blue: { border: "border-sky-300", iconBg: "bg-sky-500" },
  green: { border: "border-green-300", iconBg: "bg-green-500" },
  red: { border: "border-red-300", iconBg: "bg-red-500" },
  yellow: { border: "border-yellow-300", iconBg: "bg-yellow-500" },
};

export default function StatCard({
  icon: Icon,
  value,
  label,
  variant,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  variant: Variant;
}) {
  const styles = VARIANT_STYLES[variant];
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm ${styles.border}`}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${styles.iconBg}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <div className="text-lg font-semibold text-gray-800">
          {value.toString().padStart(4, "0")}
        </div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}
