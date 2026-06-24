import React, { useState, useEffect, createContext, useContext } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import ChatPage from "@/pages/chat";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import ForgotPasswordPage from "@/pages/forgot-password";
import AdminPage from "@/pages/admin";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

interface ThemeCtx {
  isDark: boolean;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("nx-theme") === "dark");

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) html.setAttribute("data-theme", "dark");
    else html.removeAttribute("data-theme");
    localStorage.setItem("nx-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark(v => !v) }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* Guard: redirect ke /sign-in kalau belum login */
function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) navigate("/sign-in");
  }, [user, isLoading, navigate]);

  if (isLoading) return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
      <div style={{ fontSize: 36, animation: "nx-spin 1s linear infinite" }}>⏳</div>
      <style>{"@keyframes nx-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}"}</style>
    </div>
  );
  if (!user) return null;
  return <Component />;
}

/* Guard: redirect ke / kalau sudah login */
function PublicOnlyRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && user) navigate("/");
  }, [user, isLoading, navigate]);

  if (isLoading) return null;
  if (user) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">{() => <PrivateRoute component={ChatPage} />}</Route>
      <Route path="/admin">{() => <PrivateRoute component={AdminPage} />}</Route>
      <Route path="/sign-in">{() => <PublicOnlyRoute component={SignInPage} />}</Route>
      <Route path="/sign-up">{() => <PublicOnlyRoute component={SignUpPage} />}</Route>
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
