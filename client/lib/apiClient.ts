import axios from "axios";
import { API_BASE_URL, API_BASE_ERROR } from "./apiBase";

const STORAGE_KEY = "auth";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      if (API_BASE_ERROR) return null; // Preview without a valid development API: never call anything
      const auth = localStorage.getItem(STORAGE_KEY);
      if (!auth) return null;

      const { refreshToken, user } = JSON.parse(auth);
      if (!refreshToken) return null;

      const { data } = await axios.post(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        { refreshToken },
      );

      const newAccessToken: string = data.data.accessToken;
      const newRefreshToken: string = data.data.refreshToken;

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        }),
      );

      const { store } = await import("@/store");
      const { setTokens } = await import("@/store/authSlice");
      store.dispatch(
        setTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        }),
      );

      return newAccessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

apiClient.interceptors.request.use(
  (config) => {
    // Preview deployment with a missing/invalid/production API URL: refuse the request instead of contacting the wrong server.
    if (API_BASE_ERROR) return Promise.reject(new Error(API_BASE_ERROR));
    if (typeof window !== "undefined") {
      try {
        const auth = localStorage.getItem(STORAGE_KEY);

        if (auth) {
          const { accessToken } = JSON.parse(auth);

          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        }
      } catch (error) {
        console.error("Failed to read auth from localStorage", error);
      }
      // Lets the server tie a sign-in to this browser's anonymous visit history (Live Monitoring). Present only after analytics consent.
      try {
        const vid = localStorage.getItem("av_vid");
        if (vid && /^[A-Za-z0-9_-]{20,64}$/.test(vid)) config.headers["X-Visitor-Id"] = vid;
      } catch {
        /* storage blocked */
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const hadAuthHeader = Boolean(originalRequest?.headers?.Authorization);
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");

    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      hadAuthHeader &&
      !isRefreshCall &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      }

      // Background probes (e.g. the public header checking Business Admin access) must never sign the person out or navigate away.
      if ((originalRequest as { skipAuthRedirect?: boolean }).skipAuthRedirect) return Promise.reject(error);

      // The local dev sandbox login (dev only, 8-hour token, no refresh token): send an expired sandbox session back to the
      // sandbox sign-in page; the normal /login cannot sign that account in.
      let isDevSandbox = false;
      try {
        isDevSandbox = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")?.user?.email === "adaption.test@localhost.test";
      } catch {
        /* unreadable storage: treat as a normal session */
      }

      const { store } = await import("@/store");
      const { logout } = await import("@/store/authSlice");
      store.dispatch(logout());

      const signIn = isDevSandbox ? "/dev-adaption-login" : "/login";
      if (!window.location.pathname.startsWith(signIn)) {
        window.location.href = signIn;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
