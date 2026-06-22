import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import ChatPage from "@/pages/chat";
import AdminPage from "@/pages/admin";

// ─── Theme Context ───────────────────────────────────────────────────────────
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

// ─── Clerk Setup ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "bottom" as const,
  },
  variables: {
    colorPrimary: "#7c3aed",
    colorForeground: "#1a1625",
    colorMutedForeground: "#6b7280",
    colorDanger: "#ef4444",
    colorBackground: "#ffffff",
    colorInput: "#ede9fe",
    colorInputForeground: "#1a1625",
    colorNeutral: "#ddd6fe",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl shadow-violet-500/10 border border-violet-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-bold text-2xl",
    headerSubtitle: "text-gray-500 text-sm",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",
    formFieldLabel: "text-gray-700 font-medium text-sm",
    footerActionLink: "text-violet-600 hover:text-violet-700 font-medium",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400 text-xs uppercase tracking-wider",
    identityPreviewEditButton: "text-violet-600",
    formFieldSuccessText: "text-green-600",
    alertText: "text-red-600",
    logoBox: "mb-2",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50 text-gray-700",
    formButtonPrimary: "bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm transition-colors",
    formFieldInput: "border border-violet-200 focus:border-violet-500 focus:ring-violet-500 bg-violet-50/50",
    footerAction: "border-t border-gray-100",
    dividerLine: "bg-gray-200",
    alert: "border border-red-200 bg-red-50",
    otpCodeFieldInput: "border border-violet-200 focus:border-violet-500",
    formFieldRow: "gap-2",
    main: "gap-5",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950">
      <div className="hidden lg:flex flex-col justify-between p-12 w-[45%] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-800/20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <img src={`${basePath}/logo.svg`} alt="Nixx AI" className="w-10 h-10" />
            <span className="text-2xl font-bold tracking-tight">Nixx AI</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">Chat with 26 AI<br/>Personas</h1>
          <p className="text-violet-200 text-lg leading-relaxed max-w-sm">From GPT-4o to Llama 4, from DeepSeek to Gemini — all in one place.</p>
        </div>
        <div className="relative z-10 space-y-4">
          {["GPT-4o", "DeepSeek V3", "Gemini 2.5", "Llama 4", "Grok 4"].map((m) => (
            <div key={m} className="flex items-center gap-3 text-violet-200">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-sm">{m}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <img src={`${basePath}/logo.svg`} alt="Nixx AI" className="w-8 h-8" />
            <span className="text-xl font-bold text-white">Nixx AI</span>
          </div>
          <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        </div>
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950">
      <div className="hidden lg:flex flex-col justify-between p-12 w-[45%] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-800/20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <img src={`${basePath}/logo.svg`} alt="Nixx AI" className="w-10 h-10" />
            <span className="text-2xl font-bold tracking-tight">Nixx AI</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">Start chatting with<br/>AI today</h1>
          <p className="text-violet-200 text-lg leading-relaxed max-w-sm">Create your free account and get access to 26 AI models instantly.</p>
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <p className="text-sm text-violet-200 mb-1">Free to start</p>
          <p className="text-2xl font-bold text-white">26 AI Models</p>
          <p className="text-sm text-violet-300 mt-1">Including GPT, Claude, Gemini, Llama & more</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <img src={`${basePath}/logo.svg`} alt="Nixx AI" className="w-8 h-8" />
            <span className="text-xl font-bold text-white">Nixx AI</span>
          </div>
          <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        </div>
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) qc.clear();
      prevUserIdRef.current = userId;
    });
    return unsub;
  }, [addListener, qc]);
  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/chat" /></Show>
      <Show when="signed-out"><HomePage /></Show>
    </>
  );
}

function ChatRoute() {
  return (
    <>
      <Show when="signed-in"><ChatPage /></Show>
      <Show when="signed-out"><Redirect to="/" /></Show>
    </>
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
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to your Nixx AI account" } },
        signUp: { start: { title: "Create your account", subtitle: "Join Nixx AI and chat with 26 AI models" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/chat" component={ChatRoute} />
            <Route path="/chat/:id" component={ChatRoute} />
            <Route path="/admin" component={AdminPage} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ThemeProvider>
        <ClerkProviderWithRoutes />
      </ThemeProvider>
    </WouterRouter>
  );
}

export default App;
