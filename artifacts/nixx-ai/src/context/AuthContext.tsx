import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "nx-auth-token";
const AUTH_TIMEOUT_MS = 6000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) { setIsLoading(false); return; }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${stored}` },
      signal: controller.signal,
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((u: AuthUser) => { setToken(stored); setUser(u); })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => { clearTimeout(timer); setIsLoading(false); });

    return () => { clearTimeout(timer); controller.abort(); };
  }, []);

  const login = async (email: string, password: string) => {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Login gagal"); }
    const { token: t, user: u } = await r.json();
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t); setUser(u);
  };

  const register = async (email: string, username: string, password: string) => {
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Registrasi gagal"); }
    const { token: t, user: u } = await r.json();
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t); setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null); setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
