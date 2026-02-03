
import {
  Home,
  Calendar,
  Tag,
  Building,
  FileText,
  User2,
  StethoscopeIcon,
  TrafficCone,
  Bell,
  Settings,
} from "lucide-react";

export const ADMIN_WEB_NAME = "Dr. Rajneesh Kant";

export const menuSections = [
  {
    title: "Dashboard",
    icon: Home,
    singleItem: true,
    to: "/dashboard",
    label: "Dashboard",
  },
  {
    title: "Bookings",
    icon: Calendar,
    items: [
     { to: "/dashboard/Sessions", label: "Sessions Booking" },
     { to: "/dashboard/medicine-booking", label: "medicine Booking" }
    ],
  },
  {
    title: "Coupons",
    icon: Tag,
    items: [
      { to: "/dashboard/sessions-coupons", label: "Sessions Coupons" },
      { to: "/dashboard/product-coupons", label: "Product Coupons" },
    ],
  },
  {
    title: "Treatments",
    icon: TrafficCone,
    singleItem: true,
    to: "/dashboard/treatments",
    label: "Treatments",
  },
  {
    title: "Users",
    icon: User2,
    singleItem: true,
    to: "/dashboard/users",
    label: "Users",
  },
  {
    title: "Doctor",
    icon: StethoscopeIcon,
    singleItem: true,
    to: "/dashboard/doctor",
    label: "Doctors",
  },
  {
    title: "Notifications",
    icon: Bell,
    singleItem: true,
    to: "/dashboard/notifications",
    label: "Notifications",
  },
  {
    title: "Clinic",
    icon: Building,
    singleItem: true,
    to: "/dashboard/all-clinic",
    label: "Clinic",
  },
  {
    title: "Blogs",
    icon: FileText,
    items: [
      { to: "/dashboard/all-blogs", label: "All Blogs" },
      { to: "/dashboard/blogs-categories", label: "Blog Categories" },
    ],
  },
   {
    title: "Settings",
    icon: Settings,
    items: [
      { to: "/dashboard/web-settings", label: "Web Settings" },
    ],
  },
];
