import { cn } from "./cn";

export default function Card({ className, children }) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-xl shadow-sm", className)}>
      {children}
    </div>
  );
}
