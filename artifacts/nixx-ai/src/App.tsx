import { useEffect, useRef, useState, createContext, useContext } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Link, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import ChatPage from "@/pages/chat";
import ProfilePage from "@/pages/profile";
import LandingPage from "@/pages/landing";
import AdminPage from "@/pages/admin";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");

interface ThemeCtx { isDark: boolean; toggle: () => void }
export const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });
export function useTheme() { return useContext(ThemeContext); }

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#7c3aed",
    colorForeground: "#1a1a2e",
    colorMutedForeground: "#8888aa",
    colorDanger: "#ef4444",
    colorBackground: "#ffffff",
    colorInput: "#f0eeff",
    colorInputForeground: "#1a1a2e",
    colorNeutral: "#e8e4ff",
    fontFamily: "Inter, sans-serif",
    borderRadius: "12px",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-white !rounded-none",
    footer: "!shadow-none !border-0 !bg-white !rounded-none",
    headerTitle: "text-gray-900 font-black",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-700 font-semibold",
    formFieldLabel: "text-gray-700 font-semibold",
    footerActionLink: "text-purple-600 font-semibold",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-purple-600",
    formFieldSuccessText: "text-green-600",
    alertText: "text-red-700",
    logoBox: "flex items-center justify-center mb-2",
    logoImage: "w-10 h-10 rounded-xl",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-purple-50",
    formButtonPrimary: "bg-gradient-to-r from-purple-600 to-pink-500 font-bold",
    formFieldInput: "bg-purple-50 border border-purple-200",
    footerAction: "bg-gray-50",
    dividerLine: "bg-gray-200",
    alert: "bg-red-50 border border-red-200",
    otpCodeFieldInput: "bg-purple-50 border border-purple-200",
  },
};

function AuthPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--primary-bg)", padding: "20px", flexDirection: "column", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 42, marginBottom: 6 }}>🧠</div>
        <div style={{ fontSize: "1.7rem", fontWeight: 900, background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Nixx AI</div>
        <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: 4 }}>26 Model AI · Gratis Selamanya ✨</div>
      </div>
      {children}
    </div>
  );
}

function SignInPage() {
  return <AuthPageWrapper><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></AuthPageWrapper>;
}

function SignUpPage() {
  return <AuthPageWrapper><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></AuthPageWrapper>;
}

function LoadingScreen() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--primary-bg)", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 42 }}>🧠</div>
      <div style={{ fontWeight: 900, fontSize: "1.4rem", background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Nixx AI</div>
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  return isSignedIn ? <Redirect to="/chat" /> : <LandingPage />;
}

function ProtectedRoute({ component: Component }: { component: () => React.ReactElement }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  return isSignedIn ? <Component /> : <Redirect to="/sign-in" />;
}

function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const prevRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    return addListener(({ user }) => {
      const id = user?.id ?? null;
      if (prevRef.current !== undefined && prevRef.current !== id) queryClient.clear();
      prevRef.current = id;
    });
  }, [addListener]);
  return null;
}

function AppRoutes() {
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem("nx-theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("nx-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark(v => !v) }}>
      <ClerkProvider
        publishableKey={clerkPubKey}
        proxyUrl={clerkProxyUrl}
        appearance={clerkAppearance}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        localization={{
          signIn: { start: { title: "Masuk ke Nixx AI", subtitle: "Selamat datang kembali! 👋" } },
          signUp: { start: { title: "Buat Akun Nixx AI", subtitle: "Gratis selamanya, mulai sekarang 🚀" } },
        }}
        routerPush={to => setLocation(stripBase(to))}
        routerReplace={to => setLocation(stripBase(to), { replace: true })}
      >
        <QueryClientProvider client={queryClient}>
          <ClerkCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/chat" component={() => <ProtectedRoute component={ChatPage} />} />
            <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
            <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 52 }}>😕</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>Halaman tidak ditemukan</div>
                <Link to="/" style={{ color: "var(--accent)", fontWeight: 600 }}>← Kembali ke beranda</Link>
              </div>
            </Route>
          </Switch>
        </QueryClientProvider>
      </ClerkProvider>
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}
