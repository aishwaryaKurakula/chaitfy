import axios from "axios";

function normalizeApiBaseUrl() {
  const envApiUrl = import.meta.env.VITE_API_URL?.trim();

  if (envApiUrl) {
    const withoutTrailingSlash = envApiUrl.replace(/\/$/, "");
    return withoutTrailingSlash.endsWith("/api")
      ? withoutTrailingSlash
      : `${withoutTrailingSlash}/api`;
  }

  if (import.meta.env.MODE === "development") {
    return "http://localhost:3000/api";
  }

  if (!envApiUrl) {
    console.warn(
      "VITE_API_URL is not set. Using frontend origin as API base (this may cause 401 and socket failures in production).",
    );
  }

  return `${window.location.origin}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl();
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

console.info("[CHATIFY] API_BASE_URL:", API_BASE_URL, "BACKEND_ORIGIN:", BACKEND_ORIGIN);

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
