import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  // Failing loudly beats silently calling the wrong origin.
  throw new Error(
    "VITE_API_URL is not set. Copy frontend/.env.example to frontend/.env.",
  );
}

const api = axios.create({
  baseURL,
  // Required for the httpOnly refresh cookie to travel with requests.
  withCredentials: true,
  timeout: 20000,
});

// The access token lives in memory only, never localStorage: a 15-minute token
// in localStorage is readable by any XSS on the page. AuthContext owns it and
// pushes it here.
let accessToken = null;
let onAuthFailure = () => {};

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const setAuthFailureHandler = (handler) => {
  onAuthFailure = handler;
};

// Matching and upload legitimately take a while (PDF parse + Gemini calls), so
// they opt out of the default timeout rather than us raising it globally and
// letting genuinely hung requests hang around.
export const LONG_RUNNING_TIMEOUT = 120000;

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

const REFRESH_PATH = "/api/v1/user/refresh-token";

// A single in-flight refresh shared by every 401 that arrives at once, so a
// dashboard firing three requests triggers one refresh, not three.
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = api
      .post(REFRESH_PATH)
      .then((res) => {
        const token = res.data?.data?.accessToken;
        if (!token) throw new Error("No access token in refresh response");
        accessToken = token;
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    const isRefreshCall = original?.url?.includes(REFRESH_PATH);

    // One retry only. Without the _retry flag a persistently-401 endpoint would
    // refresh-and-retry forever.
    if (status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        // Refresh failed: the session is genuinely gone. Surface it rather than
        // swallowing it, so the user gets a clean re-login instead of a page
        // that quietly does nothing.
        accessToken = null;
        onAuthFailure();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Pulls the human-readable message out of a backend error.
 * The API returns { success, statusCode, message, errors } — we show `message`
 * verbatim rather than paraphrasing it into something vaguer.
 */
export const getErrorMessage = (error, fallback = "Something went wrong.") => {
  if (error?.code === "ECONNABORTED") {
    return "That took longer than expected. Please try again.";
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message === "Network Error") {
    return "Cannot reach the server. Check that the backend is running.";
  }
  return error?.message || fallback;
};

export default api;
