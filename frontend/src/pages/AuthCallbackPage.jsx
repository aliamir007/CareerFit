import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/common/Loader";
import { ErrorState } from "../components/common/States";
import { useAuth } from "../contexts/AuthContext";
import { dashboardPathFor } from "../routes/ProtectedRoute";
import { getErrorMessage } from "../api/axiosInstance";

/**
 * Where Google sends the user back to. The backend puts the access token (and
 * only the access token — the refresh token arrives as an httpOnly cookie) in
 * the query string.
 */
export default function AuthCallbackPage() {
  const { adoptAccessToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  // StrictMode double-invokes effects in dev; without this the token would be
  // consumed twice.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const oauthError = params.get("error");

    // Strip the token from the URL before anything else, so it does not linger
    // in browser history or get leaked in a referrer header.
    window.history.replaceState({}, document.title, "/auth/callback");

    if (oauthError || !accessToken) {
      navigate("/login?error=google_auth_failed", { replace: true });
      return;
    }

    adoptAccessToken(accessToken)
      .then((me) => {
        // Exactly the same branch as a password login: choose a role first if
        // this is a brand-new Google user.
        navigate(me.role === "pending" ? "/role" : dashboardPathFor(me.role), {
          replace: true,
        });
      })
      .catch((err) => {
        setError(getErrorMessage(err, "We could not complete your sign-in."));
      });
  }, [adoptAccessToken, navigate]);

  if (error) {
    return (
      <main className="mx-auto max-w-md px-6 py-24">
        <ErrorState
          message={error}
          onRetry={() => navigate("/login", { replace: true })}
          retryLabel="Back to log in"
        />
      </main>
    );
  }

  return <Loader label="Signing you in" />;
}
