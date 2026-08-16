import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import Loader from "../components/common/Loader";
import { InlineError } from "../components/common/States";
import { useAuth } from "../contexts/AuthContext";
import { dashboardPathFor } from "../routes/ProtectedRoute";
import logo from "../assets/logo.png";

const API_URL = import.meta.env.VITE_API_URL;

// Legacy Passport Google OAuth - no longer used after migration to Google Identity Services
// The OAuth callback redirects here with ?error=... when the handshake fails.
// const OAUTH_ERRORS = {
//   google_auth_failed:
//     "Google sign-in did not complete. Try again, or use your email and password.",
//   google_not_configured:
//     "Google sign-in is not configured on this server. Use your email and password.",
//   server_error: "Something went wrong on our end during Google sign-in.",
// };

export default function LoginPage() {
  const { user, bootstrapping, sessionExpired, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Legacy Passport Google OAuth - no longer used after migration to Google Identity Services
  // const [oauthError, setOauthError] = useState("");

  // useEffect(() => {
  //   const code = params.get("error");
  //   if (code) {
  //     setOauthError(OAUTH_ERRORS[code] ?? "Sign-in failed. Please try again.");
  //   }
  // }, [params]);

  if (bootstrapping) return <Loader label="Loading" />;

  if (user) {
    return (
      <Navigate
        to={user.role === "pending" ? "/role" : dashboardPathFor(user.role)}
        replace
      />
    );
  }

  const handleSuccess = (me) => {
    dismissSessionExpired();
    // Role is decided before anything else: a "pending" user has no dashboard.
    navigate(me.role === "pending" ? "/role" : dashboardPathFor(me.role), {
      replace: true,
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Link to="/" className="mb-10 flex items-center gap-2.5">
        <img src={logo} alt="" width="20" height="20" />
        <span className="display text-base">Resume Matcher</span>
      </Link>

      <h1 className="display text-2xl">Log in</h1>
      <p className="mt-2 text-sm text-muted">
        Pick up where you left off.
      </p>

      {sessionExpired && (
        <div className="mt-6">
          <InlineError message="Your session expired. Log in again to continue." />
        </div>
      )}

      {/* Legacy Passport Google OAuth - no longer used after migration to Google Identity Services */}
      {/* {oauthError && (
        <div className="mt-6">
          <InlineError message={oauthError} />
        </div>
      )} */}

      <div className="mt-8">
        <LoginForm onSuccess={handleSuccess} />
      </div>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-hairline" />
        <span className="text-xs text-muted">or</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      {/* Legacy Passport Google OAuth - no longer used after migration to Google Identity Services */}
      {/* <a
        href={`${API_URL}/auth/google`}
        className="flex items-center justify-center gap-2.5 rounded border border-hairline px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M21.35 11.1h-9.17v2.92h5.27c-.23 1.37-1.6 4.01-5.27 4.01-3.17 0-5.76-2.62-5.76-5.86s2.59-5.86 5.76-5.86c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.79 3.79 14.7 2.9 12.18 2.9 6.98 2.9 2.77 7.11 2.77 12.3s4.21 9.4 9.41 9.4c5.43 0 9.03-3.82 9.03-9.2 0-.62-.07-1.09-.16-1.4z"
          />
        </svg>
        Continue with Google
      </a> */}

      <p className="mt-8 text-sm text-muted">
        No account?{" "}
        <Link to="/signup" className="text-teal underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
