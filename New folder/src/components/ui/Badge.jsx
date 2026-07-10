import { cn } from "./cn";

// Colored status pill. `tone` maps a status string to a color set.
const tones = {
  gray: "bg-gray-100 text-gray-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  yellow: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
};

// Best-guess color from a free-text status.
export function toneForStatus(status = "") {
  const s = String(status).toLowerCase();
  if (["published", "active", "confirmed", "completed", "verified"].some((k) => s.includes(k)))
    return "green";
  if (["pending", "draft", "rescheduled", "hide"].some((k) => s.includes(k))) return "yellow";
  if (["cancelled", "archived", "no-show", "inactive", "blocked"].some((k) => s.includes(k)))
    return "red";
  return "gray";
}

export default function Badge({ tone = "gray", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone] || tones.gray,
        className
      )}
    >
      {children}
    </span>
  );
}
