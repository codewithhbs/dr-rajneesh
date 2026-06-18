import { cn } from "./cn";

export default function Textarea({ label, error, className, id, rows = 4, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={cn(
          "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none transition",
          error && "border-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
