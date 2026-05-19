import React from "react";
import { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut, ClerkLoading, ClerkLoaded } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

if (!PUBLISHABLE_KEY) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");

const appearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#a855f7",
    colorBackground: "hsl(248, 30%, 6%)",
    colorInputBackground: "hsl(248, 25%, 15%)",
    colorText: "hsl(0, 0%, 97%)",
    colorTextSecondary: "hsl(248, 15%, 55%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    card: "!shadow-none !border-0",
    formButtonPrimary: "font-semibold",
    // Sembunyikan loading spinner bawaan Clerk — kita punya sendiri
    spinner: "hidden",
  },
};

// Skeleton saat Clerk JS masih loading
function ClerkSkeleton() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "hsl(248, 30%, 6%)",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "3px solid rgba(168,85,247,0.2)",
          borderTopColor: "#a855f7",
          animation: "spin .7s linear infinite",
        }}
      />
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <p style={{ color: "rgba(168,85,247,0.7)", fontSize: 14, margin: 0 }}>Memuat...</p>
    </div>
  );
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-dvh items-center justify-center relative overflow-hidden px-4"
      style={{ background: "hsl(248, 30%, 6%)" }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #a855f7, #7c3aed, transparent)" }}
      />
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/">
        <>
          <SignedIn><Redirect to="/dashboard" /></SignedIn>
          <SignedOut><LandingPage /></SignedOut>
        </>
      </Route>
      <Route path="/sign-in">
        <AuthWrapper>
          <ClerkLoading><ClerkSkeleton /></ClerkLoading>
          <ClerkLoaded>
            <SignIn
              routing="path"
              path={`${basePath}/sign-in`}
              signUpUrl={`${basePath}/sign-up`}
              fallbackRedirectUrl={`${basePath}/dashboard`}
            />
          </ClerkLoaded>
        </AuthWrapper>
      </Route>
      <Route path="/sign-up">
        <AuthWrapper>
          <ClerkLoading><ClerkSkeleton /></ClerkLoading>
          <ClerkLoaded>
            <SignUp
              routing="path"
              path={`${basePath}/sign-up`}
              signInUrl={`${basePath}/sign-in`}
              fallbackRedirectUrl={`${basePath}/dashboard`}
            />
          </ClerkLoaded>
        </AuthWrapper>
      </Route>
      <Route path="/dashboard">
        <>
          <SignedIn><DashboardPage /></SignedIn>
          <SignedOut><Redirect to="/" /></SignedOut>
        </>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={appearance}
    >
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={basePath}>
          <ClerkLoading><ClerkSkeleton /></ClerkLoading>
          <ClerkLoaded>
            <AppRoutes />
          </ClerkLoaded>
        </WouterRouter>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
