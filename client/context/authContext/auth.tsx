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
import axios from "axios";
import { LOCAL_API_ENDPOINT } from "@/constant/url";

type token = string;

interface User {
  _id: string;
  name: string;
  phone: string;

  email?: string;
  aadhhar?: string;
  gender?: string;
  age?: string;
  role: "user" | "admin" | "driver";
  status: "active" | "inactive" | "blocked";

  isGoogleAuth: boolean;
  isPhoneAuth: boolean;
  isLocked: boolean;
  termsAccepted: boolean;

  phoneNumber: {
    isVerified: boolean;
    otp: string | null;
    otpExpiry: string | null;
  };

  emailVerification: {
    isVerified: boolean;
  };

  profileImage: {
    url: string;
    publicId?: string;
  };

  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
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
  const [user, setUser] = useState<User | null>(null);

  const isAuthenticated = token !== null;
  // console.log(token)
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
      }, 5000);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${LOCAL_API_ENDPOINT}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.data.success) {
          setUser(res.data.data);
        }
      } catch (error) {
        console.error("Profile fetch failed", error);
        setToken(null);
      }
    };

    fetchProfile();
  }, [token]);

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
        user,
        setUser,
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
