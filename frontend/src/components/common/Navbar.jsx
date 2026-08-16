import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/logo.png";
import NotificationBell from "./NotificationBell";

const ROLE_LABEL = {
  "job seeker": "Job seeker",
  recruiter: "Recruiter",
  pending: "Choosing role",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  // Role-appropriate links only: a candidate never sees recruiter routes.
  const links =
    user?.role === "job seeker"
      ? [
          { to: "/candidate", label: "Resume" },
          { to: "/candidate/matches", label: "Hiring for your skills" },
        ]
      : user?.role === "recruiter"
        ? [
            { to: "/hr", label: "Post a role" },
            { to: "/hr/matches", label: "Shortlist" },
            { to: "/hr/jobs", label: "My Jobs" },
          ]
        : [];

  return (
    <header className="border-b border-hairline bg-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="" width="20" height="20" />
          <span className="display text-base">Resume Matcher</span>
        </Link>

        {user && (
          <>
            <nav className="hidden items-center gap-6 md:flex">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  className={({ isActive }) =>
                    `border-b-2 pb-0.5 text-sm transition-colors ${
                      isActive
                        ? "border-teal text-teal"
                        : "border-transparent text-muted hover:text-ink"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="hidden text-right sm:block">
                <p className="text-sm leading-tight text-ink">
                  {user.username}
                </p>
                <p className="label leading-tight">
                  {ROLE_LABEL[user.role] ?? user.role}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
