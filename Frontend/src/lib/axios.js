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

  return `${window.location.origin}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl();
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

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

export default axiosInstance;
