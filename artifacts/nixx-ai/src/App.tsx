import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import ChatPage from "@/pages/chat";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";

// ─── Theme Context ─────────────────────────────────────────────────────────
interface ThemeCtx { isDark: boolean; toggle: () => void; }
export const ThemeContext = createContext<ThemeCtx>({ isDark: true, toggle: () => {} });
export function useTheme() { return useContext(ThemeContext); }

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("nx-theme") !== "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("nx-theme", isDark ? "dark" : "light");
  }, [isDark]);
  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark(v => !v) }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Simple Auth Context (localStorage-based) ──────────────────────────────
export interface NixxUser { name: string; email: string; avatar: string; }
interface AuthCtx {
  user: NixxUser | null;
  isLoaded: boolean;
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signUp: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
}

export const AuthContext = createContext<AuthCtx>({
  user: null, isLoaded: false,
  signIn: () => ({ ok: false }),
  signUp: () => ({ ok: false }),
  signOut: () => {},
});
export function useAuth() { return useContext(AuthContext); }

const USERS_KEY = "nixx-users";
const SESSION_KEY = "nixx-session";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NixxUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) setUser(JSON.parse(session));
    } catch { /* noop */ }
    setIsLoaded(true);
  }, []);

  const signUp = (name: string, email: string, password: string) => {
    if (!name.trim() || !email.trim() || !password.trim()) return { ok: false, error: "Semua field harus diisi!" };
    if (password.length < 6) return { ok: false, error: "Password minimal 6 karakter!" };
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
      if (users[email.toLowerCase()]) return { ok: false, error: "Email sudah terdaftar!" };
      const avatar = email[0].toUpperCase();
      users[email.toLowerCase()] = { name, email, password, avatar };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      const newUser = { name, email, avatar };
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return { ok: true };
    } catch { return { ok: false, error: "Terjadi kesalahan, coba lagi!" }; }
  };

  const signIn = (email: string, password: string) => {
    if (!email.trim() || !password.trim()) return { ok: false, error: "Email dan password wajib diisi!" };
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
      const u = users[email.toLowerCase()];
      if (!u) return { ok: false, error: "Email tidak ditemukan!" };
      if (u.password !== password) return { ok: false, error: "Password salah!" };
      const loggedIn = { name: u.name, email: u.email, avatar: u.avatar };
      localStorage.setItem(SESSION_KEY, JSON.stringify(loggedIn));
      setUser(loggedIn);
      return { ok: true };
    } catch { return { ok: false, error: "Terjadi kesalahan, coba lagi!" }; }
  };

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoaded, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Route Guards ──────────────────────────────────────────────────────────
const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  const { user, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (user) return <Redirect to="/chat" />;
  return <HomePage />;
}

function ChatRoute() {
  const { user, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!user) return <Redirect to="/sign-in" />;
  return <ChatPage />;
}

function SignInRoute() {
  const { user, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (user) return <Redirect to="/chat" />;
  return <SignInPage />;
}

function SignUpRoute() {
  const { user, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (user) return <Redirect to="/chat" />;
  return <SignUpPage />;
}

// ─── App ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in" component={SignInRoute} />
          <Route path="/sign-in/*?" component={SignInRoute} />
          <Route path="/sign-up" component={SignUpRoute} />
          <Route path="/sign-up/*?" component={SignUpRoute} />
          <Route path="/chat" component={ChatRoute} />
          <Route path="/chat/:id" component={ChatRoute} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </WouterRouter>
  );
}
