import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { dashboardPathFor } from "../routes/ProtectedRoute";
import Loader from "../components/common/Loader";
import logo from "../assets/logo.png";

const API_URL = import.meta.env.VITE_API_URL;

export default function LandingPage() {
  const { user, bootstrapping } = useAuth();

  if (bootstrapping) return <Loader label="Loading" />;

  // Already signed in? Skip the pitch.
  if (user) {
    return (
      <Navigate
        to={user.role === "pending" ? "/role" : dashboardPathFor(user.role)}
        replace
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
      <header className="flex h-16 items-center gap-2.5">
        <img src={logo} alt="" width="20" height="20" />
        <span className="display text-base">Resume Matcher</span>
      </header>

      <div className="grid flex-1 items-center gap-16 py-16 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="label">Skills-based hiring</p>

          <h1 className="display mt-4 text-4xl leading-[1.15] sm:text-5xl">
            Match on what people can actually do.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
            Candidates upload a resume and see which companies are hiring for
            their skills. Recruiters post the skills they need and get a ranked
            shortlist. Both sides see the same thing: what matches, what does
            not, and by how much.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {/* Legacy Passport Google OAuth - no longer used after migration to Google Identity Services */}
            {/* A full-page redirect, not an axios call: the OAuth handshake has
                to happen in the browser's top-level navigation. */}
            {/* <a
              href={`${API_URL}/auth/google`}
              className="inline-flex items-center gap-2.5 rounded bg-teal px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-teal-deep"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.92h5.27c-.23 1.37-1.6 4.01-5.27 4.01-3.17 0-5.76-2.62-5.76-5.86s2.59-5.86 5.76-5.86c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.79 3.79 14.7 2.9 12.18 2.9 6.98 2.9 2.77 7.11 2.77 12.3s4.21 9.4 9.41 9.4c5.43 0 9.03-3.82 9.03-9.2 0-.62-.07-1.09-.16-1.4z"
                />
              </svg>
              Continue with Google
            </a> */}

            <Link
              to="/signup"
              className="rounded border border-hairline px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              Sign up
            </Link>

            <Link
              to="/login"
              className="px-2 py-3 text-sm text-teal underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* A quiet, honest illustration of the one idea: the match meter. */}
        <div className="card p-8">
          <p className="label">What a match looks like</p>

          <div className="mt-6 space-y-6">
            {[
              { role: "Backend Engineer", company: "Northwind", pct: 86 },
              { role: "Platform Engineer", company: "Kestrel Labs", pct: 64 },
              { role: "Data Engineer", company: "Meridian", pct: 52 },
            ].map((row) => (
              <div key={row.role}>
                <div className="mb-1.5 flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{row.role}</p>
                    <p className="text-xs text-muted">{row.company}</p>
                  </div>
                  <span className="numeric text-lg text-ink">
                    {row.pct}
                    <span className="ml-0.5 text-xs text-muted">%</span>
                  </span>
                </div>
                <div className="h-1.5 w-full bg-hairline">
                  <div
                    className="h-full animate-meter-fill bg-gold"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 border-t border-hairline pt-4 text-xs leading-relaxed text-muted">
            Scores come from the skills in your resume against the skills in the
            role. Nothing is inferred that is not written down.
          </p>
        </div>
      </div>
    </main>
  );
}
