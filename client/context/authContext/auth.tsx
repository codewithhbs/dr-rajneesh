"use client";
import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
  useContext,
} from "react";
import Cookies from "js-cookie";

type token = string;

interface AuthContextType {
  token: string | null;
  setToken: Dispatch<SetStateAction<token | null>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<token | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isAuthenticated = token !== null;

  useEffect(() => {
    try {
      const cookieToken = Cookies.get("token");
      if (cookieToken) {
        setToken(cookieToken);
      }
    } catch (error) {
      console.error("Failed to load token from cookie", error);
      setToken(null);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 5000)
    }
  }, []);


  useEffect(() => {
    if (token) {
      Cookies.set("token", token, { expires: 7 }); 
    } else {
      Cookies.remove("token");
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        loading,
        setLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
