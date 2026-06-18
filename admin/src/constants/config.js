import {
  Home,
  Calendar,
  Pill,
  Ticket,
  Stethoscope,
  Users,
  Megaphone,
  Building2,
  Newspaper,
  Bell,
  Settings,
} from "lucide-react";

// ---------------------------------------------------------------------------
// API base URL.
// Change this in one place (or via a .env -> VITE_API_URL) and the whole app
// (the single axios instance in src/lib/axios.js) follows.
// ---------------------------------------------------------------------------
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:7900/api/v1";

// Key used to persist the admin auth token in localStorage.
export const TOKEN_KEY = "adminToken";

export const ADMIN_WEB_NAME = "Dr. Rajneesh Kant";
export const ADMIN_TAGLINE = "Physio | Osteo | Chiro";

// ---------------------------------------------------------------------------
// Sidebar navigation.
// `to` is the full route. Single links use `to`; groups use `items`.
// Routes here line up 1:1 with the <Route> definitions in App.jsx.
// ---------------------------------------------------------------------------
export const menuSections = [
  { title: "Dashboard", icon: Home, to: "/dashboard" },
  {
    title: "Bookings",
    icon: Calendar,
    items: [
      { to: "/dashboard/sessions", label: "Session Bookings" },
      { to: "/dashboard/medicine-booking", label: "Medicine Bookings" },
    ],
  },
  {
    title: "Coupons",
    icon: Ticket,
    items: [
      { to: "/dashboard/sessions-coupons", label: "Session Coupons" },
      { to: "/dashboard/product-coupons", label: "Product Coupons" },
    ],
  },
  { title: "Treatments", icon: Pill, to: "/dashboard/treatments" },
  { title: "Users", icon: Users, to: "/dashboard/users" },
  { title: "Doctors", icon: Stethoscope, to: "/dashboard/doctor" },
  {
    title: "Popups",
    icon: Megaphone,
    items: [
      { to: "/dashboard/all-popup", label: "All Popups" },
      { to: "/dashboard/new-popup", label: "New Popup" },
    ],
  },
  { title: "Clinics", icon: Building2, to: "/dashboard/all-clinic" },
  {
    title: "Blogs",
    icon: Newspaper,
    items: [
      { to: "/dashboard/all-blogs", label: "All Blogs" },
      { to: "/dashboard/blogs-categories", label: "Blog Categories" },
    ],
  },
  { title: "Notifications", icon: Bell, to: "/dashboard/notifications" },
  { title: "Settings", icon: Settings, to: "/dashboard/web-settings" },
];

// Shared dropdown option lists used across pages.
export const sessionStatusOptions = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Completed",
  "Rescheduled",
  "No-Show",
];

export const prescriptionTypes = [
  "Pre-Treatment",
  "Post-Treatment",
  "Follow-up",
  "Emergency",
];

export const serviceStatusOptions = ["Draft", "Published", "Archived"];
