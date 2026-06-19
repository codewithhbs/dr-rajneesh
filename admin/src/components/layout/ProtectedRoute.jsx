import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/authContext";
import Spinner from "@/components/ui/Spinner";

// Wrap any route that requires login. While we verify the stored token we show
// a spinner; if there's no valid session we redirect to /admin/login and
// remember where the user was trying to go.
export default function ProtectedRoute({ children }) {
  const { isAuthed, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Verifying session..." />
      </div>
    );
  }

  if (!isAuthed) {
    const from = location.pathname + location.search;
    return <Navigate to="/admin/login" replace state={{ from }} />;
  }

  return children;
}
