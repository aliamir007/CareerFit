import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./components/common/Toast";
import ProtectedRoute from "./routes/ProtectedRoute";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import RolePage from "./pages/RolePage";
// Legacy Passport Google OAuth - no longer used after migration to Google Identity Services
// import AuthCallbackPage from "./pages/AuthCallbackPage";
import CandidateDashboard from "./pages/CandidateDashboard";
import JobResultsPage from "./pages/JobResultsPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import HRDashboard from "./pages/HRDashboard";
import HRMatchesPage from "./pages/HRMatchesPage";
import HRJobsPage from "./pages/HRJobsPage";

// The landing, auth and callback screens carry their own layout; the signed-in
// app gets the shared chrome.
// Legacy Passport Google OAuth - no longer used after migration to Google Identity Services
// const BARE_ROUTES = ["/", "/login", "/signup", "/role", "/auth/callback"];
const BARE_ROUTES = ["/", "/login", "/signup", "/role"];

function Shell({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const bare = BARE_ROUTES.includes(pathname);

  if (bare) return children;

  return (
    <div className="flex min-h-screen flex-col">
      {user && <Navbar />}
      {children}
      <Footer />
    </div>
  );
}

function AppRoutes() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/role" element={<RolePage />} />
        {/* Legacy Passport Google OAuth - no longer used after migration to Google Identity Services */}
        {/* <Route path="/auth/callback" element={<AuthCallbackPage />} /> */}

        <Route
          path="/candidate"
          element={
            <ProtectedRoute requiredRole="job seeker">
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/matches"
          element={
            <ProtectedRoute requiredRole="job seeker">
              <JobResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/jobs/:jobId"
          element={
            <ProtectedRoute requiredRole="job seeker">
              <JobDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <HRDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/matches"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <HRMatchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/jobs"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <HRJobsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
