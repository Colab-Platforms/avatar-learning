import axios from "axios";

const STORAGE_KEY = "auth";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
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

      const { store } = await import("@/store");
      const { logout } = await import("@/store/authSlice");
      store.dispatch(logout());

      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
