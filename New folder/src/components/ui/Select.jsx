import { cn } from "./cn";

// `options` can be ["A","B"] or [{ value, label }].
export default function Select({ label, options = [], className, id, placeholder, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none transition",
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const value = typeof opt === "object" ? opt.value : opt;
          const text = typeof opt === "object" ? opt.label : opt;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </div>
  );
}
