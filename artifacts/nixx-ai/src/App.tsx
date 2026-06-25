import React, { Suspense, lazy } from "react";
  import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { AuthProvider, useAuth } from "@/context/AuthContext";

  // Eager — halaman utama yang langsung dibutuhkan
  import DashboardPage from "@/pages/DashboardPage";
  import AuthPage from "@/pages/AuthPage";

  // Lazy — jarang diakses, split jadi chunk terpisah
  const LandingPage = lazy(() => import("@/pages/LandingPage"));
  const NotFound    = lazy(() => import("@/pages/not-found"));
  const TermsPage   = lazy(() => import("@/pages/TermsPage"));
  const AdminPage   = lazy(() => import("@/pages/admin"));

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });

  const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

  function PageLoader() {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#0d0d0f",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid rgba(168,85,247,0.2)", borderTopColor: "#a855f7",
          animation: "spin .7s linear infinite",
        }} />
        <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      </div>
    );
  }

  function AppRoutes() {
    const { user } = useAuth();
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/sign-in">
            {user ? <Redirect to="/dashboard" /> : <AuthPage defaultMode="login" />}
          </Route>
          <Route path="/sign-up">
            {user ? <Redirect to="/dashboard" /> : <AuthPage defaultMode="register" />}
          </Route>
          <Route path="/dashboard">
            {user ? <DashboardPage /> : <Redirect to="/sign-in" />}
          </Route>
          <Route path="/admin"><AdminPage /></Route>
          <Route path="/syarat"><TermsPage /></Route>
          <Route path="/terms"><TermsPage /></Route>
          <Route path="/">
            {user ? <Redirect to="/dashboard" /> : <LandingPage />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    );
  }

  export default function App() {
    return (
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <WouterRouter base={basePath}>
            <AppRoutes />
          </WouterRouter>
        </QueryClientProvider>
      </AuthProvider>
    );
  }
  