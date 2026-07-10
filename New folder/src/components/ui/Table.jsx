import { cn } from "./cn";

// Thin wrappers so every table looks the same and stays scrollable on mobile.
export function Table({ children, className }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-left text-sm", className)}>{children}</table>
    </div>
  );
}

export function THead({ children }) {
  return (
    <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
      {children}
    </thead>
  );
}

export function TR({ children, className, ...props }) {
  return (
    <tr className={cn("border-b border-gray-100 last:border-0", className)} {...props}>
      {children}
    </tr>
  );
}

export function TH({ children, className }) {
  return <th className={cn("px-4 py-3 font-medium", className)}>{children}</th>;
}

export function TD({ children, className }) {
  return <td className={cn("px-4 py-3 align-middle text-gray-700", className)}>{children}</td>;
}
