import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, {
  setAccessToken,
  setAuthFailureHandler,
  getErrorMessage,
} from "../api/axiosInstance";

import { googleLogout } from "@react-oauth/google";
const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `bootstrapping` gates the router: until the silent refresh settles we do not
  // know whether there is a session, and rendering routes early would bounce a
  // logged-in user to /login on every page load.
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSession = () => {
    setAccessToken(null);
    setUser(null);
  };

  const fetchMe = async () => {
    const res = await api.get("/api/v1/user/me");
    const me = res.data?.data;
    setUser(me);
    return me;
  };

  // Restores the session from the httpOnly refresh cookie on a cold load, so a
  // browser refresh does not force a re-login.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const res = await api.post("/api/v1/user/refresh-token");
        const token = res.data?.data?.accessToken;
        if (!token) throw new Error("No access token returned");
        setAccessToken(token);
        if (!cancelled) await fetchMe();
      } catch {
        // No cookie, or it is expired/revoked. This is the normal path for a
        // first-time visitor, so it is not an error worth showing.
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // The axios interceptor calls this when a refresh fails mid-session.
  useEffect(() => {
    setAuthFailureHandler(() => {
      clearSession();
      setSessionExpired(true);
    });
  }, []);

  const login = async ({ identifier, password }) => {
    // The backend takes either email or username; it looks up with $or on both.
    const isEmail = identifier.includes("@");
    const payload = isEmail
      ? { email: identifier, password }
      : { username: identifier, password };

    const res = await api.post("/api/v1/user/login", payload);
    setAccessToken(res.data?.data?.accessToken);
    setSessionExpired(false);
    return fetchMe();
  };

  const register = async ({ email, username, password }) => {
    const res = await api.post("/api/v1/user/register", {
      email,
      username,
      password,
    });
    setAccessToken(res.data?.data?.accessToken);
    setSessionExpired(false);
    // Register returns the user directly; role is "pending" at this point.
    const created = res.data?.data?.user;
    setUser(created);
    return created;
  };

  // Legacy Passport Google OAuth - no longer used after migration to Google Identity Services
  // Used by the Google callback page, which receives the access token in the
  // query string (the refresh token arrives separately as an httpOnly cookie).
  // const adoptAccessToken = async (token) => {
  //   setAccessToken(token);
  //   setSessionExpired(false);
  //   return fetchMe();
  // };

  const chooseRole = async (role) => {
    // Must be exactly "job seeker" (with the space) or "recruiter" — the User
    // schema enum rejects anything else.
    await api.post("/api/v1/user/role", { role });
    const updated = await fetchMe();
    return updated;
  };

  const logout = async () => {
    try {
      await api.post("/api/v1/user/logout");
    } catch {
      // Even if the call fails, drop local state: staying "logged in" in the UI
      // after the user asked to leave is worse than a failed server call.
    } finally {
      googleLogout();
      clearSession();
    }
  };

  const googleLogin = async (credential) => {
    const res = await api.post("/api/v1/user/google-login", {
      credential,
    });

    setAccessToken(res.data?.data?.accessToken);
    setSessionExpired(false);
    return fetchMe();
  };

  const value = useMemo(
    () => ({
      user,
      bootstrapping,
      sessionExpired,
      dismissSessionExpired: () => setSessionExpired(false),
      isAuthenticated: Boolean(user),
      login,
      googleLogin,
      register,
      // Legacy Passport Google OAuth - no longer used after migration to Google Identity Services
      // adoptAccessToken,
      chooseRole,
      logout,
      refreshUser: fetchMe,
    }),
    [user, bootstrapping, sessionExpired],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { getErrorMessage };
