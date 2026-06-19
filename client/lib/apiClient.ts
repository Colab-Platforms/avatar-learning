import axios from "axios";

const STORAGE_KEY = "auth";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
});

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
  (error) => Promise.reject(error)
);

export default apiClient;