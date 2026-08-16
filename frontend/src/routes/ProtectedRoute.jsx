import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Loader from "../components/common/Loader";

export const dashboardPathFor = (role) =>
  role === "recruiter" ? "/hr" : "/candidate";

/**
 * Guards a route.
 *  - no session        -> /login
 *  - role "pending"    -> /role  (must choose before anything else works)
 *  - wrong role        -> their own dashboard, rather than a dead end
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, bootstrapping } = useAuth();
  const location = useLocation();

  // Wait for the silent refresh before deciding: redirecting during bootstrap
  // would log out anyone who simply refreshed the page.
  if (bootstrapping) {
    return <Loader label="Restoring your session" />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role === "pending") {
    return <Navigate to="/role" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={dashboardPathFor(user.role)} replace />;
  }

  return children;
}
