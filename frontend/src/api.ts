import axios, { type InternalAxiosRequestConfig } from "axios";
import { ACCESS_TOKEN } from "./constants";

const api = axios.create({
  // VITE CHANGE: Use import.meta.env instead of process.env
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 1000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(ACCESS_TOKEN);

    // Ensure headers exist before we try to modify them
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  },
);

export default api;
