import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, createContext, useContext } from "react";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import PremiumPage from "@/pages/premium";
import PaymentPage from "@/pages/payment";
import PricingPage from "@/pages/pricing";
import StatisticsPage from "@/pages/statistics";
import BroadcastPage from "@/pages/broadcast";
import SettingsPage from "@/pages/settings";
import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";

const queryClient = new QueryClient();

interface AdminUser { email: string; name: string; }
interface AuthCtx {
  admin: AdminUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthCtx>({
  admin: null, login: () => false, logout: () => {}
});
export const useAuth = () => useContext(AuthContext);

export interface ToastMsg { id: number; message: string; type: "success"|"error"|"info"; }
interface ToastCtx { showToast: (msg: string, type?: ToastMsg["type"]) => void; }
export const ToastContext = createContext<ToastCtx>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

const ADMIN_CREDENTIALS = { email: "admin@unixsmm.biz.id", password: "Admin@Unix2024" };

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    try { return JSON.parse(localStorage.getItem("unix-admin-session") || "null"); } catch { return null; }
  });
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const login = (email: string, password: string) => {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const user = { email, name: "Super Admin" };
      setAdmin(user);
      localStorage.setItem("unix-admin-session", JSON.stringify(user));
      return true;
    }
    return false;
  };
  const logout = () => {
    setAdmin(null);
    localStorage.removeItem("unix-admin-session");
  };
  const showToast = (message: string, type: ToastMsg["type"] = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout }}>
      <ToastContext.Provider value={{ showToast }}>
        {children}
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
          {toasts.map(t => <Toast key={t.id} toast={t} />)}
        </div>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { admin } = useAuth();
  if (!admin) return <Redirect to="/login" />;
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Component />
      </main>
    </div>
  );
}

function Router() {
  const { admin } = useAuth();
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={() => <Redirect to={admin ? "/dashboard" : "/login"} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UsersPage} />} />
      <Route path="/premium" component={() => <ProtectedRoute component={PremiumPage} />} />
      <Route path="/payment" component={() => <ProtectedRoute component={PaymentPage} />} />
      <Route path="/pricing" component={() => <ProtectedRoute component={PricingPage} />} />
      <Route path="/statistics" component={() => <ProtectedRoute component={StatisticsPage} />} />
      <Route path="/broadcast" component={() => <ProtectedRoute component={BroadcastPage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}
