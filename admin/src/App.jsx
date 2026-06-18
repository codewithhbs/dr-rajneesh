import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Pages
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import Sessions from "@/pages/sessions/Sessions";
import SessionDetails from "@/pages/sessions/SessionDetails";
import Users from "@/pages/users/Users";
import Doctors from "@/pages/users/Doctors";
import Profile from "@/pages/users/Profile";
//add in this 
import Treatments from "@/pages/treatments/Treatments";
import TreatmentForm from "@/pages/treatments/TreatmentForm";
import Clinics from "@/pages/clinics/Clinics";
import Blogs from "@/pages/blogs/Blogs";
import BlogCategories from "@/pages/blogs/BlogCategories";
import Notifications from "@/pages/notifications/Notifications";
import Popups from "@/pages/popups/Popups";
import NewPopup from "@/pages/popups/NewPopup";
import Settings from "@/pages/settings/Settings";
import ComingSoon from "@/pages/misc/ComingSoon";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/admin/login" element={<Login />} />

      {/* Everything under /dashboard requires auth and uses the layout shell */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Bookings */}
        <Route path="sessions" element={<Sessions />} />
        <Route path="sessions/:id" element={<SessionDetails />} />
        <Route
          path="medicine-booking"
          element={<ComingSoon title="Medicine Bookings" />}
        />

        {/* Coupons */}
        <Route path="sessions-coupons" element={<ComingSoon title="Session Coupons" />} />
        <Route path="product-coupons" element={<ComingSoon title="Product Coupons" />} />

        {/* Treatments / Services */}
        <Route path="treatments" element={<Treatments />} />
        <Route path="treatments/new" element={<TreatmentForm />} />
        <Route path="treatments/edit/:id" element={<TreatmentForm />} />

        {/* People */}
        <Route path="users" element={<Users />} />
        <Route path="doctor" element={<Doctors />} />
        <Route path="profile" element={<Profile />} />

        {/* Popups */}
        <Route path="all-popup" element={<Popups />} />
        <Route path="new-popup" element={<NewPopup />} />

        {/* Clinics */}
        <Route path="all-clinic" element={<Clinics />} />

        {/* Blogs */}
        <Route path="all-blogs" element={<Blogs />} />
        <Route path="blogs-categories" element={<BlogCategories />} />

        {/* Misc */}
        <Route path="notifications" element={<Notifications />} />
        <Route path="web-settings" element={<Settings />} />

        {/* Unknown dashboard path -> home */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Root + catch-all */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
