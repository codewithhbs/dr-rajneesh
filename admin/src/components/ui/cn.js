// Join class names, skipping falsy values. Keeps JSX readable.
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
