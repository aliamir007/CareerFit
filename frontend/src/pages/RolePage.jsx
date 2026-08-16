import { Navigate, useNavigate } from "react-router-dom";
import RoleSelector from "../components/auth/RoleSelector";
import Loader from "../components/common/Loader";
import { useAuth } from "../contexts/AuthContext";
import { dashboardPathFor } from "../routes/ProtectedRoute";
import logo from "../assets/logo.png";

/**
 * Step 2 of signup, and the landing spot for any user whose role is still
 * "pending" (including first-time Google sign-ins).
 */
export default function RolePage() {
  const { user, bootstrapping } = useAuth();
  const navigate = useNavigate();

  if (bootstrapping) return <Loader label="Loading" />;

  if (!user) return <Navigate to="/login" replace />;

  // Role already chosen — nothing to do here.
  if (user.role !== "pending") {
    return <Navigate to={dashboardPathFor(user.role)} replace />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-10 flex items-center gap-2.5">
        <img src={logo} alt="" width="20" height="20" />
        <span className="display text-base">Resume Matcher</span>
      </div>

      <RoleSelector
        onDone={(updated) =>
          navigate(dashboardPathFor(updated.role), { replace: true })
        }
      />
    </main>
  );
}
