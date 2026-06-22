import React, { useState, useEffect, createContext, useContext, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/home";
import ChatPage from "@/pages/chat";
import PremiumPage from "@/pages/premium";
import AdminPage from "@/pages/admin";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

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
    colorForeground: "#1e1b4b",
    colorMutedForeground: "#6b7280",
    colorDanger: "#dc2626",
    colorBackground: "#f8f7ff",
    colorInput: "#f3f0ff",
    colorInputForeground: "#1e1b4b",
    colorNeutral: "#ede9fe",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-purple-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-purple-900 font-bold",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",
    formFieldLabel: "text-gray-700 font-medium",
    footerActionLink: "text-purple-600 hover:text-purple-700 font-medium",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-purple-600",
    formFieldSuccessText: "text-green-600",
    alertText: "text-red-600",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-10 rounded-full",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-purple-50 rounded-lg",
    formButtonPrimary: "bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold",
    formFieldInput: "border border-purple-200 rounded-lg bg-purple-50 text-gray-900 focus:ring-2 focus:ring-purple-400",
    footerAction: "bg-gray-50",
    dividerLine: "bg-gray-200",
    alert: "rounded-lg",
    otpCodeFieldInput: "border border-purple-200 rounded-lg",
    formFieldRow: "gap-3",
    main: "gap-4",
  },
};

interface ThemeCtx {
  isDark: boolean;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) html.setAttribute("data-theme", "dark");
    else html.removeAttribute("data-theme");
    if (isDark) localStorage.setItem("nx-theme", "dark"); else localStorage.removeItem("nx-theme");
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark((v) => !v) }}>
      {children}
    </ThemeContext.Provider>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/premium" component={PremiumPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: { title: "Masuk ke Nixx AI", subtitle: "Chat dengan 26 model AI pilihan" },
        },
        signUp: {
          start: { title: "Daftar Nixx AI", subtitle: "Gratis — 20 pesan per hari" },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ThemeProvider>
          <Router />
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
