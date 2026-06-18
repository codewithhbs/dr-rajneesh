import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, Bell, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const name = user?.name || "Admin";
  const email = user?.email || "admin@clinic.com";
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="ml-auto flex items-center gap-3">
        <Link
          to="/dashboard/notifications"
          className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Link>

        {/* Profile dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-semibold text-white">
              {initial}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 sm:block">{name}</span>
            <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                <p className="truncate text-xs text-gray-500">{email}</p>
              </div>
              <Link
                to="/dashboard/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4 text-gray-400" />
                My Profile
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
