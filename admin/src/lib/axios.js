import axios from "axios";
import { API_URL, TOKEN_KEY } from "@/constants/config";

// ---------------------------------------------------------------------------
// ONE axios instance for the whole app.
// Import this everywhere instead of the bare `axios` package:
//
//   import api from "@/lib/axios";
//   const { data } = await api.get("/admin/profile");
//
// It already knows the base URL, sends the auth token, and handles 401s.
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // also supports cookie-based backends
});

// Small helpers so token handling lives in exactly one place.
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Request: attach the bearer token (if we have one) to every call.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: if the server says we're unauthorized, drop the token and
// bounce the user back to the login screen.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      if (!window.location.pathname.startsWith("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
