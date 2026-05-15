import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "yellow" | "blue" | "gray" | "purple";

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-700",
  purple: "bg-purple-100 text-purple-800",
};

export function Badge({ label, variant = "gray" }: { label: string; variant?: BadgeVariant }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variantStyles[variant])}>
      {label}
    </span>
  );
}

export function statusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    Active: "green", Inactive: "gray", Evicted: "red",
    Paid: "green", Partial: "yellow", Late: "red", Missed: "red",
  };
  return map[status] ?? "gray";
}
