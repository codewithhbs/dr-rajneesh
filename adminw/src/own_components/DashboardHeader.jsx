import { Bell, LogOut, Moon, Sun, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import adminImg from "../assets/doctor.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAdminProfile from "@/hooks/admin";

const DashboardHeader = () => {
  const { profile, handleLogout } = useAdminProfile();

  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme) {
      const shouldBeDark = savedTheme === "dark";
      setIsDark(shouldBeDark);
      document.documentElement.classList.toggle("dark", shouldBeDark);
    } else {
      setIsDark(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center">
            {/* You can uncomment if you want a title in light mode too */}
            {/* <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 hidden md:block">
              Dashboard
            </h1> */}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="
                p-2 rounded-full 
                bg-gray-100 dark:bg-gray-800 
                hover:bg-gray-200 dark:hover:bg-gray-700 
                transition-colors duration-200
              "
              aria-label="Toggle dark/light mode"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="
                relative p-2 rounded-full 
                bg-gray-100 dark:bg-gray-900 
                hover:bg-gray-200 dark:hover:bg-gray-800 
                transition-colors duration-200
              "
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="
                absolute top-1 right-1 
                w-2.5 h-2.5 bg-red-500 rounded-full 
                border-2 border-white dark:border-gray-950 
                animate-pulse
              " />
            </button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 group focus:outline-none transition-all duration-200">
                  {/* Avatar */}
                  <div className="
                    relative w-10 h-10 sm:w-11 sm:h-11 
                    rounded-full overflow-hidden 
                    ring-1 ring-gray-300 dark:ring-gray-700 
                    group-hover:ring-gray-400 dark:group-hover:ring-gray-500 
                    transition-all
                  ">
                    <img
                      src={adminImg}
                      alt="Admin"
                      className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-300"
                    />
                    <span className="
                      absolute bottom-0 right-0 
                      w-3 h-3 bg-green-500 
                      border-2 border-white dark:border-gray-950 
                      rounded-full
                    " />
                  </div>

                  {/* Name & greeting */}
                  <div className="hidden sm:flex sm:flex-col sm:items-start text-left">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Welcome
                    </span>
                    <span className="
                      text-sm font-medium 
                      text-gray-900 dark:text-gray-200 
                      group-hover:text-gray-700 dark:group-hover:text-white 
                      transition-colors
                    ">
                      {profile?.name || "Admin"}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="
                  w-56 
                  bg-white dark:bg-gray-900 
                  border border-gray-200 dark:border-gray-800 
                  text-gray-900 dark:text-gray-200 
                  rounded-xl shadow-xl dark:shadow-2xl 
                  backdrop-blur-sm
                "
              >
                <DropdownMenuItem
                  onClick={() => (window.location.href = "/dashboard/profile")}
                  className="
                    flex items-center gap-2.5 px-4 py-2.5 
                    text-gray-700 dark:text-gray-300 
                    focus:bg-gray-100 dark:focus:bg-gray-800 
                    focus:text-gray-900 dark:focus:text-white 
                    cursor-pointer transition-colors
                  "
                >
                  <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>Profile</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="
                    flex items-center gap-2.5 px-4 py-2.5 
                    text-red-600 dark:text-red-400 
                    focus:bg-red-50 dark:focus:bg-red-950/60 
                    focus:text-red-700 dark:focus:text-red-300 
                    cursor-pointer transition-colors
                  "
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;