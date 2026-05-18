import { createContext, useContext, useEffect, useState } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }

      // Try common routes in case your auth middleware exposes one.
      const candidates = [
        "/auth/me",
        "/user/me",
        "/auth/profile",
      ];

      let data = null;
      for (const route of candidates) {
        try {
          const res = await API.get(route);
          data = res.data?.user || res.data || null;
          if (data) break;
        } catch {
          continue;
        }
      }

      setUser(data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchMe();
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const res = await API.post("/auth/signin", { email, password });
    const token = res.data?.token;
    const returnedUser = res.data?.user || null;

    if (token) localStorage.setItem("token", token);
    if (returnedUser) setUser(returnedUser);

    if (!returnedUser) {
      await fetchMe();
    }

    return res.data;
  };

  const signup = async (name, email, password) => {
    const res = await API.post("/auth/signup", { name, email, password });
    return res.data;
  };

  const logout = async () => {
    try {
      await API.get("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    setUser,
    fetchMe,
    login,
    signup,
    logout,
    isAuthenticated: !!localStorage.getItem("token"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
