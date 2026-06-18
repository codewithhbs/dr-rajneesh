// Multi-select rendered as a scrollable list of checkboxes.
// `options` = [{ value, label }]. `value` = array of selected values.
export default function CheckboxGroup({ label, options = [], value = [], onChange }) {
  const toggle = (v) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-300 p-2">
        {options.length === 0 ? (
          <p className="px-1 py-2 text-sm text-gray-400">No options available</p>
        ) : (
          options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              {opt.label}
            </label>
          ))
        )}
      </div>
    </div>
  );
}
