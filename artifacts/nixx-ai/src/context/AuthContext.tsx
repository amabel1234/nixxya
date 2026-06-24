import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ADMIN_EMAILS = ["nixxteam@gmail.com", "admin@nixxai.dev", "amabel1234@gmail.com", "kelaoffc@gmail.com"];
const USERS_KEY = "nx-users-db";
const SESSION_KEY = "nx-session";

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  isPremium: boolean;
  isSuspended: boolean;
  isAdmin: boolean;
  createdAt: string;
  chatCount: number;
}

interface StoredUser {
  id: number;
  email: string;
  username: string;
  password: string;
  isPremium: boolean;
  isSuspended: boolean;
  createdAt: string;
  chatCount: number;
}

interface AuthCtx {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => string | null;
  register: (email: string, username: string, password: string) => string | null;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => string | null;
}

function hashPw(pw: string): string {
  return btoa(unescape(encodeURIComponent(pw + "nx_salt_2025")));
}

function loadUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]"); } catch { return []; }
}
function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const AuthContext = createContext<AuthCtx>({
  user: null, isLoading: true,
  login: () => null, register: () => null,
  logout: () => {}, resetPassword: () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      const users = loadUsers();
      const found = users.find(u => u.email === session);
      if (found) {
        setUser(toAuthUser(found));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  function toAuthUser(u: StoredUser): AuthUser {
    return {
      id: u.id, email: u.email, username: u.username,
      isPremium: u.isPremium ?? false, isSuspended: u.isSuspended ?? false,
      isAdmin: ADMIN_EMAILS.includes(u.email),
      createdAt: u.createdAt, chatCount: u.chatCount ?? 0,
    };
  }

  const login = useCallback((email: string, password: string): string | null => {
    const trimEmail = email.trim().toLowerCase();
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === trimEmail);
    if (!found) return "Email tidak terdaftar.";
    if (found.password !== hashPw(password)) return "Password salah.";
    if (found.isSuspended) return "Akun kamu disuspend. Hubungi admin.";
    localStorage.setItem(SESSION_KEY, found.email);
    setUser(toAuthUser(found));
    return null;
  }, []);

  const register = useCallback((email: string, username: string, password: string): string | null => {
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !username.trim() || !password) return "Semua kolom wajib diisi.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) return "Format email tidak valid.";
    if (username.trim().length < 3) return "Username minimal 3 karakter.";
    if (password.length < 6) return "Password minimal 6 karakter.";
    const users = loadUsers();
    if (users.find(u => u.email.toLowerCase() === trimEmail)) return "Email sudah terdaftar.";
    const newUser: StoredUser = {
      id: Date.now(), email: trimEmail, username: username.trim(),
      password: hashPw(password), isPremium: false, isSuspended: false,
      createdAt: new Date().toISOString().slice(0, 10), chatCount: 0,
    };
    saveUsers([...users, newUser]);
    localStorage.setItem(SESSION_KEY, newUser.email);
    setUser(toAuthUser(newUser));
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const resetPassword = useCallback((email: string, newPassword: string): string | null => {
    const trimEmail = email.trim().toLowerCase();
    if (newPassword.length < 6) return "Password minimal 6 karakter.";
    const users = loadUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === trimEmail);
    if (idx === -1) return "Email tidak terdaftar.";
    users[idx] = { ...users[idx], password: hashPw(newPassword) };
    saveUsers(users);
    return null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
