import React, { createContext, useContext, useState, ReactNode } from "react";

  export interface AuthUser {
    id: number;
    email: string;
    username: string;
  }

  interface StoredUser {
    id: number;
    email: string;
    username: string;
    password: string;
  }

  interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, username: string, password: string) => Promise<void>;
    resetPassword: (email: string, newPassword: string) => Promise<void>;
    logout: () => void;
  }

  const AuthContext = createContext<AuthContextType | null>(null);

  const USERS_KEY = "nx-users-db";
  const SESSION_KEY = "nx-session-user";

  let _idCounter = 0;

  function getStoredUsers(): StoredUser[] {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]"); } catch { return []; }
  }
  function saveUsers(users: StoredUser[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  // Baca localStorage sekali saat modul diload — tidak perlu useEffect
  function readSession(): AuthUser | null {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? (JSON.parse(s) as AuthUser) : null;
    } catch { return null; }
  }

  export function AuthProvider({ children }: { children: ReactNode }) {
    // Inisialisasi SYNCHRONOUS — tidak ada delay, tidak ada spinner palsu
    const [user, setUser] = useState<AuthUser | null>(readSession);
    const [token] = useState<string | null>(() => readSession() ? "local-token" : null);

    const login = async (email: string, password: string) => {
      const users = getStoredUsers();
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!found) throw new Error("Email atau password salah. Belum punya akun? Silakan daftar dulu.");
      const authUser: AuthUser = { id: found.id, email: found.email, username: found.username };
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      setUser(authUser);
    };

    const register = async (email: string, username: string, password: string) => {
      const users = getStoredUsers();
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
        throw new Error("Email sudah terdaftar. Silakan masuk atau gunakan email lain.");
      _idCounter = _idCounter || Date.now();
      const newUser: StoredUser = { id: ++_idCounter, email: email.trim().toLowerCase(), username: username.trim(), password };
      users.push(newUser);
      saveUsers(users);
      const authUser: AuthUser = { id: newUser.id, email: newUser.email, username: newUser.username };
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      setUser(authUser);
    };

    const resetPassword = async (email: string, newPassword: string) => {
      const users = getStoredUsers();
      const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (idx === -1) throw new Error("Email tidak ditemukan. Pastikan email sudah terdaftar.");
      if (newPassword.length < 6) throw new Error("Password baru minimal 6 karakter.");
      users[idx].password = newPassword;
      saveUsers(users);
    };

    const logout = () => {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
      window.location.href = "/";
    };

    return (
      <AuthContext.Provider value={{ user, token, isLoading: false, login, register, resetPassword, logout }}>
        {children}
      </AuthContext.Provider>
    );
  }

  export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
  }
  