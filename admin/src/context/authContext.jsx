import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { getToken, setToken, clearToken } from "@/lib/axios";

const AuthContext = createContext(null);

// Convenience hook so pages can do: const { user, logout } = useAuth();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthed, setIsAuthed] = useState(Boolean(getToken()));
  // While true we don't know yet if the stored token is valid -> show a loader.
  const [loading, setLoading] = useState(Boolean(getToken()));

  // Load the admin profile using the saved token (called on first load).
  const loadProfile = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/admin/profile");
      setUser(data.data || data.user || data);
      setIsAuthed(true);
    } catch {
      // Bad / expired token: the axios interceptor already cleared 401s,
      // but clear here too so the state stays consistent.
      clearToken();
      setIsAuthed(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Called by the login page after a successful POST /admin/login.
  const login = (token, userData) => {
    if (token) setToken(token);
    setUser(userData || null);
    setIsAuthed(true);
  };

  const logout = async () => {
    try {
      await api.get("/admin/logout");
    } catch {
      // ignore network errors on logout
    } finally {
      clearToken();
      setUser(null);
      setIsAuthed(false);
      window.location.href = "/admin/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, isAuthed, loading, login, logout, refreshProfile: loadProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};
