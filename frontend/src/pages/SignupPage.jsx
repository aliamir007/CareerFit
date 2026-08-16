import { Link, Navigate, useNavigate } from "react-router-dom";
import SignupForm from "../components/auth/SignupForm";
import Loader from "../components/common/Loader";
import { useAuth } from "../contexts/AuthContext";
import { dashboardPathFor } from "../routes/ProtectedRoute";
import logo from "../assets/logo.png";

export default function SignupPage() {
  const { user, bootstrapping } = useAuth();
  const navigate = useNavigate();

  if (bootstrapping) return <Loader label="Loading" />;

  if (user) {
    return (
      <Navigate
        to={user.role === "pending" ? "/role" : dashboardPathFor(user.role)}
        replace
      />
    );
  }

  // Registration always lands on role selection: the API returns role "pending"
  // and every protected route bounces a pending user back here anyway.
  const handleSuccess = () => navigate("/role", { replace: true });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Link to="/" className="mb-10 flex items-center gap-2.5">
        <img src={logo} alt="" width="20" height="20" />
        <span className="display text-base">Resume Matcher</span>
      </Link>

      <h1 className="display text-2xl">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        You will choose how you use it on the next step.
      </p>

      <div className="mt-8">
        <SignupForm onSuccess={handleSuccess} />
      </div>

      <p className="mt-8 text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="text-teal underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
