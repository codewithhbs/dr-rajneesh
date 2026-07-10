import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Stethoscope } from "lucide-react";
import { menuSections, ADMIN_WEB_NAME, ADMIN_TAGLINE } from "@/constants/config";
import { cn } from "@/components/ui/cn";

// Single nav link (used both for top-level links and sub-items).
function NavItem({ to, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-brand-50 text-brand-700"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )
      }
    >
      {Icon ? <Icon className="h-5 w-5 flex-shrink-0" /> : <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />}
      <span>{label}</span>
    </NavLink>
  );
}

// Collapsible group with sub-items.
function NavGroup({ section, onNavigate }) {
  const location = useLocation();
  const groupActive = section.items.some((i) => location.pathname.startsWith(i.to));
  const [open, setOpen] = useState(groupActive);
  const Icon = section.icon;

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
          groupActive ? "text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          {section.title}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 ml-4 space-y-1 border-l border-gray-200 pl-3">
          {section.items.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Stethoscope className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-base font-bold leading-tight text-gray-900">{ADMIN_WEB_NAME}</h1>
          <p className="text-xs text-gray-500">{ADMIN_TAGLINE}</p>
        </div>
      </div>

      {/* Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuSections.map((section) =>
          section.items ? (
            <NavGroup key={section.title} section={section} onNavigate={onNavigate} />
          ) : (
            <NavItem
              key={section.title}
              to={section.to}
              label={section.title}
              icon={section.icon}
              onNavigate={onNavigate}
            />
          )
        )}
      </nav>
    </div>
  );
}
