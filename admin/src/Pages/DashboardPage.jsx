"use client";

import { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import DashboardHeader from "@/own_components/DashboardHeader";
import useAdminProfile from "@/hooks/admin";
import ProtectedRoute from "@/lib/ProtectedRoute";

// Pages
import DashboardHome from "./DashboardHome";
import AddNewTreatMents from "./services/AddNewTreatMents";
import AllSessions from "./sessions/AllSessions";
import SessionDetails from "./sessions/SessionDetails";
import AllUsers from "./users/AllUsers";
import AllServices from "./services/AllServices";
import AllBlogCategories from "./Blogs/blogs-categories/AllBlogCategories";
import AllDoctors from "./users/AllDoctors";
import AllNotifications from "./Notifications/AllNotifications";
import AllClinic from "./clinic/AllClinic";
import BlogManagement from "./Blogs/Blog/AllBlogs";
import AdminProfile from "./users/AdminProfile";
import ConfigSettings from "./settings/ConfigSettings";

// Icons
import {
  Stethoscope,
  Menu,
  ChevronDown,
  ChevronRight,
  Circle,
  Settings,
  LogOut,
} from "lucide-react";

// Constants
import { menuSections, ADMIN_WEB_NAME } from "@/context/ui.constant";

const DashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAdminProfile();

  const [expandedSections, setExpandedSections] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActive = (path) =>
    location.pathname.toLowerCase() === path.toLowerCase();

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-800">
      {/* Logo / Header */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <Stethoscope className="w-6 h-6 text-gray-800 dark:text-gray-200" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {ADMIN_WEB_NAME}
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Physio | Osteo | Chiro
          </p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-6">
        <nav className="space-y-1.5">
          {menuSections.map((section, idx) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.title];
            const isActiveSection = section.singleItem
              ? isActive(section.to)
              : section.items?.some((item) => isActive(item.to));

            if (section.singleItem) {
              return (
                <button
                  key={idx}
                  onClick={() => handleNavigation(section.to)}
                  className={`
                    flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActiveSection
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                        : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.label || section.title}</span>
                </button>
              );
            }

            return (
              <Collapsible
                key={idx}
                open={isExpanded}
                onOpenChange={() => toggleSection(section.title)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={`
                      flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${
                        isActiveSection
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                          : isExpanded
                          ? "bg-gray-50 dark:bg-gray-900/60 text-gray-900 dark:text-gray-100"
                          : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{section.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="transition-all">
                  <div className="ml-4 mt-1.5 space-y-1 border-l border-gray-200 dark:border-gray-800 pl-4">
                    {section.items?.map((item, itemIdx) => {
                      const isItemActive = isActive(item.to);
                      return (
                        <button
                          key={itemIdx}
                          onClick={() => handleNavigation(item.to)}
                          className={`
                            flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm transition-colors
                            ${
                              isItemActive
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-100"
                            }
                          `}
                        >
                          <Circle
                            className={`w-1.5 h-1.5 ${
                              isItemActive
                                ? "fill-gray-900 dark:fill-white"
                                : "fill-gray-400 dark:fill-gray-600"
                            }`}
                          />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer / Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div
          onClick={() => handleNavigation("/dashboard/profile")}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gradient-to-br dark:from-gray-700 dark:to-gray-900 flex items-center justify-center text-gray-800 dark:text-white font-semibold ring-1 ring-gray-400 dark:ring-gray-700">
            {profile?.name?.charAt(0) || "D"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {profile?.name || "Dr. Rajneesh"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-500 truncate">
              {profile?.email || "doctor@clinic.com"}
            </p>
          </div>
          <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>

        <Button
          variant="ghost"
          onClick={() => console.log("Logout clicked")}
          className="mt-3 w-full justify-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Mobile Hamburger + Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-700 dark:text-gray-300"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 border-r border-gray-200 dark:border-gray-800">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:border-r lg:border-gray-200 dark:lg:border-gray-800 lg:fixed lg:inset-y-0 lg:left-0">
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex-1 lg:ml-72 min-w-0">
        {/* Top Header (desktop) */}
        <div className="hidden lg:block sticky top-0 z-20 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <DashboardHeader />
        </div>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">
          <Routes>
            <Route path="/" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
            <Route path="/add-or-update-treatments" element={<ProtectedRoute><AddNewTreatMents /></ProtectedRoute>} />
            <Route path="/Sessions" element={<ProtectedRoute><AllSessions /></ProtectedRoute>} />
            <Route path="/Users" element={<ProtectedRoute><AllUsers /></ProtectedRoute>} />
            <Route path="/treatments" element={<ProtectedRoute><AllServices /></ProtectedRoute>} />
            <Route path="/blogs-categories" element={<ProtectedRoute><AllBlogCategories /></ProtectedRoute>} />
            <Route path="/all-blogs" element={<ProtectedRoute><BlogManagement /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
            <Route path="/doctor" element={<ProtectedRoute><AllDoctors /></ProtectedRoute>} />
            <Route path="/admin/sessions/:id" element={<ProtectedRoute><SessionDetails /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><AllNotifications /></ProtectedRoute>} />
            <Route path="/web-settings" element={<ProtectedRoute><ConfigSettings /></ProtectedRoute>} />
            <Route path="/all-clinic" element={<AllClinic />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;