import { cn } from "./cn";

// Centered loading spinner. Use inside a relative/flex container.
export default function Spinner({ className, label = "Loading..." }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-gray-500", className)}>
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
      {label && <p className="mt-3 text-sm">{label}</p>}
    </div>
  );
}
