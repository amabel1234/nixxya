import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useUser, Show } from "@clerk/react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: number; clerkId: string; email: string; name: string | null;
  isPremium: boolean; premiumUntil: string | null; isSuspended: boolean;
  lastOnlineAt: string | null; createdAt: string; todayChats: number;
}
interface AdminStats {
  totalUsers: number; premiumUsers: number; freeUsers: number; suspendedUsers: number;
  todayChats: number; totalChats: number; pendingPayments: number;
  totalRevenue: number; todayNewUsers: number; totalPremiumPurchases: number;
}
interface PaymentOrder {
  id: number; clerkId: string; name: string; phone: string;
  amount: number; qrisRef: string | null; status: string;
  createdAt: string; approvedAt: string | null;
}
interface PaymentMethod {
  id: number; name: string; logo: string; qrisLink: string; isActive: boolean; createdAt: string;
}
interface PricingData {
  id: number; daily: number; weekly: number; monthly: number; yearly: number;
  dailyName: string; weeklyName: string; monthlyName: string; yearlyName: string;
}
interface SiteSettingsData {
  id: number; siteName: string; logoUrl: string; bannerUrl: string; themeColor: string; freeLimit: number;
}
interface Toast { id: number; msg: string; type: "success" | "error" | "info"; }

type Section = "dashboard" | "users" | "premium" | "payments" | "methods" | "pricing" | "broadcast" | "settings";

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0b0917",
  sidebar: "#100d1e",
  card: "#16132a",
  cardHover: "#1c1836",
  border: "rgba(124,58,237,0.18)",
  borderBright: "rgba(124,58,237,0.45)",
  primary: "#7c3aed",
  primaryHover: "#6d28d9",
  primaryLight: "rgba(124,58,237,0.12)",
  glow: "0 0 24px rgba(124,58,237,0.28)",
  glowStrong: "0 0 36px rgba(124,58,237,0.45)",
  text: "#e8e3f5",
  textMuted: "#7d749a",
  textSub: "#a89dc4",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  input: "#1e1a36",
};

// ─── Toast system ─────────────────────────────────────────────────────────────
let toastIdCounter = 0;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [, navigate] = useLocation();
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((msg: string, type: Toast["type"] = "success") => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // Check admin access
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { setIsAdmin(false); return; }
    fetch("/api/admin/stats", { credentials: "include" })
      .then(r => { setIsAdmin(r.status !== 403); })
      .catch(() => setIsAdmin(false));
  }, [isLoaded, user]);

  if (!isLoaded || isAdmin === null) {
    return <AdminLoading />;
  }

  if (!user) {
    return <>{(() => { navigate("/sign-in"); return null; })()}</>;
  }

  if (!isAdmin) {
    return <AdminAccessDenied userId={user.id} />;
  }

  const navItems: { key: Section; icon: string; label: string; badge?: string }[] = [
    { key: "dashboard", icon: "📊", label: "Dashboard" },
    { key: "users", icon: "👥", label: "Pengguna" },
    { key: "premium", icon: "⭐", label: "Premium" },
    { key: "payments", icon: "💳", label: "Pembayaran" },
    { key: "methods", icon: "🏦", label: "Metode Bayar" },
    { key: "pricing", icon: "🏷️", label: "Harga Paket" },
    { key: "broadcast", icon: "📣", label: "Broadcast" },
    { key: "settings", icon: "⚙️", label: "Pengaturan" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif", color: C.text }}>
      {/* Toasts */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: "12px 18px", borderRadius: 12, fontSize: 14, fontWeight: 500,
            background: t.type === "success" ? "rgba(16,185,129,0.15)" : t.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
            border: `1px solid ${t.type === "success" ? C.success : t.type === "error" ? C.danger : C.info}40`,
            color: t.type === "success" ? C.success : t.type === "error" ? C.danger : C.info,
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            backdropFilter: "blur(10px)",
            animation: "toastIn 0.3s ease",
            display: "flex", alignItems: "center", gap: 8, minWidth: 240, maxWidth: 340,
          }}>
            {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"} {t.msg}
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside style={{
        width: sidebarCollapsed ? 68 : 240,
        minHeight: "100vh",
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          padding: sidebarCollapsed ? "20px 14px" : "20px 20px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 68,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 4px 12px rgba(124,58,237,0.4)",
          }}>🛡️</div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, lineHeight: 1.2 }}>Admin Panel</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Nixx AI Control</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {navItems.map(item => {
            const active = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  gap: 12, padding: sidebarCollapsed ? "11px 16px" : "11px 14px",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  background: active ? C.primaryLight : "transparent",
                  color: active ? "#c4b5fd" : C.textMuted,
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  marginBottom: 2, transition: "all 0.15s ease",
                  position: "relative",
                  boxShadow: active ? `inset 0 0 0 1px ${C.borderBright}` : "none",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                {active && (
                  <div style={{
                    position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 20, background: C.primary, borderRadius: "0 3px 3px 0",
                  }} />
                )}
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "12px 8px", borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => navigate("/chat")}
            title={sidebarCollapsed ? "Ke Chat" : undefined}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              gap: 12, padding: sidebarCollapsed ? "11px 16px" : "11px 14px",
              borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent", color: C.textMuted, fontSize: 14,
              marginBottom: 4, transition: "all 0.15s ease",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
              whiteSpace: "nowrap", overflow: "hidden",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <span style={{ fontSize: 17 }}>💬</span>
            {!sidebarCollapsed && <span>Ke Chat</span>}
          </button>
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              gap: 12, padding: sidebarCollapsed ? "11px 16px" : "11px 14px",
              borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent", color: C.textMuted, fontSize: 14,
              transition: "all 0.15s ease",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
              whiteSpace: "nowrap", overflow: "hidden",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <span style={{ fontSize: 17 }}>{sidebarCollapsed ? "▶" : "◀"}</span>
            {!sidebarCollapsed && <span>Ciutkan</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{
        marginLeft: sidebarCollapsed ? 68 : 240,
        flex: 1,
        minHeight: "100vh",
        transition: "margin-left 0.25s ease",
        padding: "0",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Top bar */}
        <div style={{
          padding: "16px 28px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: C.sidebar,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>
              {navItems.find(n => n.key === activeSection)?.icon}{" "}
              {navItems.find(n => n.key === activeSection)?.label}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>
              {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
              background: C.primaryLight, color: "#c4b5fd",
              border: `1px solid ${C.borderBright}`,
            }}>
              👤 {user.firstName ?? user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "Admin"}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "28px", flex: 1 }}>
          {activeSection === "dashboard" && <DashboardSection addToast={addToast} />}
          {activeSection === "users" && <UsersSection addToast={addToast} />}
          {activeSection === "premium" && <PremiumSection addToast={addToast} />}
          {activeSection === "payments" && <PaymentsSection addToast={addToast} />}
          {activeSection === "methods" && <MethodsSection addToast={addToast} />}
          {activeSection === "pricing" && <PricingSection addToast={addToast} />}
          {activeSection === "broadcast" && <BroadcastSection addToast={addToast} />}
          {activeSection === "settings" && <SettingsSection addToast={addToast} />}
        </div>
      </main>

      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 6px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(124,58,237,0.5); }
      `}</style>
    </div>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────
function AdminLoading() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛡️</div>
      <div style={{ color: C.textMuted, fontSize: 14 }}>Memuat panel admin...</div>
    </div>
  );
}

// ─── Access Denied ────────────────────────────────────────────────────────────
function AdminAccessDenied({ userId }: { userId?: string }) {
  const [, navigate] = useLocation();
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 10px" }}>Akses Ditolak</h2>
        <p style={{ color: C.textMuted, marginBottom: 20 }}>Kamu tidak memiliki izin untuk mengakses halaman ini.</p>
        {userId && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Clerk User ID kamu:</div>
            <code style={{ fontSize: 13, color: "#c4b5fd", wordBreak: "break-all" }}>{userId}</code>
          </div>
        )}
        <button onClick={() => navigate("/chat")} style={{ padding: "10px 24px", background: C.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          ← Kembali ke Chat
        </button>
      </div>
    </div>
  );
}

// ─── Reusable UI ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = C.primary }: { icon: string; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: C.card, borderRadius: 16, padding: "20px 22px",
      border: `1px solid ${C.border}`,
      boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
      position: "relative", overflow: "hidden",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px rgba(0,0,0,0.4), 0 0 0 1px ${color}30`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)"; }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle, ${color}18, transparent 70%)`, borderRadius: "50%", transform: "translate(20px,-20px)" }} />
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1, marginBottom: 4 }}>
        {typeof value === "number" ? value.toLocaleString("id-ID") : value}
      </div>
      <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color, marginTop: 6, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>{title}</h2>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 13, color: C.textMuted }}>{sub}</p>}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, size = "md", style: extraStyle }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "danger" | "success" | "ghost" | "warning";
  disabled?: boolean; size?: "sm" | "md"; style?: React.CSSProperties;
}) {
  const bg = variant === "primary" ? C.primary : variant === "danger" ? C.danger : variant === "success" ? C.success : variant === "warning" ? C.warning : "rgba(255,255,255,0.07)";
  const col = variant === "ghost" ? C.textMuted : "#fff";
  const pad = size === "sm" ? "6px 12px" : "10px 20px";
  const fs = size === "sm" ? 12 : 14;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: pad, background: disabled ? "rgba(255,255,255,0.05)" : bg,
        color: disabled ? C.textMuted : col, border: "none", borderRadius: 9,
        fontSize: fs, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1, transition: "all 0.15s ease",
        whiteSpace: "nowrap", ...extraStyle,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.15)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = ""; }}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, hint }: {
  label?: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textSub, marginBottom: 6 }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 14px", background: C.input,
          border: `1px solid ${C.border}`, borderRadius: 10, color: C.text,
          fontSize: 14, outline: "none", transition: "border 0.15s",
        }}
        onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = C.primary; }}
        onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = C.border; }}
      />
      {hint && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Badge({ children, color = C.primary }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600,
      background: `${color}20`, color, border: `1px solid ${color}40`,
    }}>
      {children}
    </span>
  );
}

function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: 48, borderRadius: 10, background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
        }} />
      ))}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardSection({ addToast }: { addToast: (m: string, t?: Toast["type"]) => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/stats", { credentials: "include" });
      if (r.ok) setStats(await r.json());
    } catch { addToast("Gagal memuat statistik", "error"); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const cards = stats ? [
    { icon: "👥", label: "Total Pengguna", value: stats.totalUsers, sub: `+${stats.todayNewUsers} hari ini`, color: C.primary },
    { icon: "⭐", label: "Pengguna Premium", value: stats.premiumUsers, sub: `${stats.totalPremiumPurchases} total pembelian`, color: "#f59e0b" },
    { icon: "🆓", label: "Pengguna Gratis", value: stats.freeUsers, color: C.info },
    { icon: "💬", label: "Chat Hari Ini", value: stats.todayChats, sub: `${stats.totalChats.toLocaleString("id-ID")} total`, color: C.success },
    { icon: "💰", label: "Total Pendapatan", value: `Rp${stats.totalRevenue.toLocaleString("id-ID")}`, color: "#10b981" },
    { icon: "⏳", label: "Pembayaran Pending", value: stats.pendingPayments, sub: stats.pendingPayments > 0 ? "Perlu ditinjau!" : "Semua bersih", color: stats.pendingPayments > 0 ? C.warning : C.success },
    { icon: "🚫", label: "Akun Suspended", value: stats.suspendedUsers, color: C.danger },
    { icon: "📅", label: "User Baru Hari Ini", value: stats.todayNewUsers, color: "#a855f7" },
  ] : [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <SectionTitle title="Dashboard" sub="Ringkasan statistik platform Nixx AI" />
        <Btn onClick={load} variant="ghost" size="sm">🔄 Refresh</Btn>
      </div>
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: 110, borderRadius: 16, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 16 }}>
          {cards.map((c, i) => <StatCard key={i} {...c} />)}
        </div>
      )}
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────
function UsersSection({ addToast }: { addToast: (m: string, t?: Toast["type"]) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter !== "all") params.set("filter", filter);
      const r = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      if (r.ok) setUsers(await r.json());
    } catch { addToast("Gagal memuat data pengguna", "error"); }
    finally { setLoading(false); }
  }, [search, filter, addToast]);

  useEffect(() => { load(); }, [load]);

  const action = async (id: string, endpoint: string, method = "POST", body?: object) => {
    setProcessing(id + endpoint);
    try {
      const r = await fetch(`/api/admin/users/${id}/${endpoint}`, {
        method, credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!r.ok) throw new Error("Gagal");
      addToast("Berhasil!", "success");
      load();
    } catch { addToast("Operasi gagal", "error"); }
    finally { setProcessing(null); }
  };

  const filters = [
    { val: "all", label: "Semua" },
    { val: "premium", label: "⭐ Premium" },
    { val: "free", label: "🆓 Gratis" },
    { val: "suspended", label: "🚫 Suspended" },
  ];

  return (
    <div>
      <SectionTitle title="Manajemen Pengguna" sub={`${users.length} pengguna ditemukan`} />
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Cari nama, email, atau UID..."
          style={{ flex: 1, minWidth: 220, padding: "10px 14px", background: C.input, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none" }}
          onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = C.primary; }}
          onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = C.border; }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {filters.map(f => (
            <button key={f.val} onClick={() => setFilter(f.val)} style={{
              padding: "8px 14px", borderRadius: 9, border: `1px solid ${filter === f.val ? C.primary : C.border}`,
              background: filter === f.val ? C.primaryLight : "transparent", color: filter === f.val ? "#c4b5fd" : C.textMuted,
              fontSize: 13, fontWeight: filter === f.val ? 600 : 400, cursor: "pointer",
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSkeleton rows={5} /> : (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Pengguna", "UID", "Status", "Chat Hari Ini", "Daftar", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: C.textMuted, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Tidak ada pengguna ditemukan</td></tr>
                ) : users.map(u => (
                  <tr key={u.clerkId} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, transition: "background 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{u.name ?? "Tanpa Nama"}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <code style={{ fontSize: 11, color: C.textMuted, background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4 }}>
                        {u.clerkId.slice(0, 16)}...
                      </code>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {u.isPremium && <Badge color={C.warning}>⭐ Premium</Badge>}
                        {u.isSuspended && <Badge color={C.danger}>🚫 Suspended</Badge>}
                        {!u.isPremium && !u.isSuspended && <Badge color={C.textMuted}>🆓 Gratis</Badge>}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: u.todayChats >= 18 ? C.warning : C.text }}>{u.todayChats}</span>
                      <span style={{ fontSize: 12, color: C.textMuted }}>/20</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>
                      {new Date(u.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Btn size="sm" variant="ghost" disabled={!!processing} onClick={() => action(u.clerkId, "reset-limit")}>🔄</Btn>
                        {u.isSuspended
                          ? <Btn size="sm" variant="success" disabled={!!processing} onClick={() => action(u.clerkId, "unsuspend")}>✅</Btn>
                          : <Btn size="sm" variant="warning" disabled={!!processing} onClick={() => action(u.clerkId, "suspend")}>🚫</Btn>
                        }
                        {u.isPremium
                          ? <Btn size="sm" variant="ghost" disabled={!!processing} onClick={() => action(u.clerkId, "revoke-premium")}>⬇️</Btn>
                          : <Btn size="sm" variant="primary" disabled={!!processing} onClick={() => action(u.clerkId, "set-premium", "POST", { days: 30 })}>⭐</Btn>
                        }
                        <Btn size="sm" variant="danger" disabled={!!processing} onClick={() => { if (confirm(`Hapus ${u.email}?`)) action(u.clerkId, "", "DELETE"); }}>🗑️</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Premium ──────────────────────────────────────────────────────────────────
function PremiumSection({ addToast }: { addToast: (m: string, t?: Toast["type"]) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/users?filter=premium", { credentials: "include" });
      if (r.ok) setUsers(await r.json());
    } catch { addToast("Gagal memuat", "error"); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const revoke = async (clerkId: string, name: string) => {
    if (!confirm(`Cabut premium ${name}?`)) return;
    setProcessing(clerkId);
    try {
      const r = await fetch(`/api/admin/users/${clerkId}/revoke-premium`, { method: "POST", credentials: "include" });
      if (!r.ok) throw new Error();
      addToast("Premium dicabut", "success");
      load();
    } catch { addToast("Gagal", "error"); }
    finally { setProcessing(null); }
  };

  return (
    <div>
      <SectionTitle title="Pengguna Premium" sub={`${users.length} pengguna aktif premium`} />
      {loading ? <LoadingSkeleton /> : (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Pengguna", "Email", "Premium Hingga", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: C.textMuted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Belum ada pengguna premium</td></tr>
                ) : users.map(u => (
                  <tr key={u.clerkId} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: C.text }}>{u.name ?? "Tanpa Nama"}</div>
                    </td>
                    <td style={{ padding: "12px 16px", color: C.textMuted, fontSize: 13 }}>{u.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {u.premiumUntil ? (
                        <Badge color={new Date(u.premiumUntil) > new Date() ? C.success : C.danger}>
                          {new Date(u.premiumUntil).toLocaleDateString("id-ID")}
                        </Badge>
                      ) : <Badge color={C.warning}>Selamanya</Badge>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Btn size="sm" variant="danger" disabled={processing === u.clerkId} onClick={() => revoke(u.clerkId, u.name ?? u.email)}>
                        Cabut Premium
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payments ─────────────────────────────────────────────────────────────────
function PaymentsSection({ addToast }: { addToast: (m: string, t?: Toast["type"]) => void }) {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/payments", { credentials: "include" });
      if (r.ok) setOrders(await r.json());
    } catch { addToast("Gagal memuat pembayaran", "error"); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: number, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      const r = await fetch(`/api/admin/payments/${id}/${action}`, { method: "POST", credentials: "include" });
      if (!r.ok) throw new Error();
      addToast(action === "approve" ? "Pembayaran disetujui! User diupgrade ke Premium." : "Pembayaran ditolak.", action === "approve" ? "success" : "error");
      load();
    } catch { addToast("Operasi gagal", "error"); }
    finally { setProcessing(null); }
  };

  const statusBadge = (s: string) => {
    if (s === "approved") return <Badge color={C.success}>✅ Disetujui</Badge>;
    if (s === "rejected") return <Badge color={C.danger}>❌ Ditolak</Badge>;
    return <Badge color={C.warning}>⏳ Menunggu</Badge>;
  };

  const pending = orders.filter(o => o.status === "pending");
  const others = orders.filter(o => o.status !== "pending");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <SectionTitle title="Manajemen Pembayaran" sub={`${pending.length} menunggu persetujuan`} />
        <Btn onClick={load} variant="ghost" size="sm">🔄 Refresh</Btn>
      </div>
      {loading ? <LoadingSkeleton /> : (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["ID", "Nama", "No HP", "Jumlah", "Ref QRIS", "Status", "Tanggal", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: C.textMuted, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Belum ada pembayaran</td></tr>
                ) : [...pending, ...others].map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    <td style={{ padding: "12px 16px", color: C.textMuted, fontSize: 13 }}>#{p.id}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: C.text, fontSize: 14 }}>{p.name}</td>
                    <td style={{ padding: "12px 16px", color: C.textMuted, fontSize: 13 }}>{p.phone}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: C.success }}>Rp{Number(p.amount).toLocaleString("id-ID")}</td>
                    <td style={{ padding: "12px 16px", color: C.textMuted, fontSize: 12 }}>{p.qrisRef ?? "-"}</td>
                    <td style={{ padding: "12px 16px" }}>{statusBadge(p.status)}</td>
                    <td style={{ padding: "12px 16px", color: C.textMuted, fontSize: 12, whiteSpace: "nowrap" }}>
                      {new Date(p.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {p.status === "pending" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn size="sm" variant="success" disabled={processing === p.id} onClick={() => act(p.id, "approve")}>✅ Setujui</Btn>
                          <Btn size="sm" variant="danger" disabled={processing === p.id} onClick={() => act(p.id, "reject")}>❌ Tolak</Btn>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payment Methods ──────────────────────────────────────────────────────────
function MethodsSection({ addToast }: { addToast: (m: string, t?: Toast["type"]) => void }) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({ name: "", logo: "", qrisLink: "", isActive: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/payment-methods", { credentials: "include" });
      if (r.ok) setMethods(await r.json());
    } catch { addToast("Gagal memuat", "error"); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (m: PaymentMethod) => {
    setEditing(m);
    setForm({ name: m.name, logo: m.logo, qrisLink: m.qrisLink, isActive: m.isActive });
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", logo: "", qrisLink: "", isActive: true });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) { addToast("Nama wajib diisi", "error"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/payment-methods/${editing.id}` : "/api/admin/payment-methods";
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      addToast(editing ? "Metode diperbarui!" : "Metode ditambahkan!", "success");
      setShowForm(false);
      load();
    } catch { addToast("Gagal menyimpan", "error"); }
    finally { setSaving(false); }
  };

  const del = async (id: number, name: string) => {
    if (!confirm(`Hapus ${name}?`)) return;
    try {
      await fetch(`/api/admin/payment-methods/${id}`, { method: "DELETE", credentials: "include" });
      addToast("Metode dihapus", "success");
      load();
    } catch { addToast("Gagal menghapus", "error"); }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <SectionTitle title="Metode Pembayaran" sub="Kelola QRIS, Dana, Transfer Bank" />
        <Btn onClick={openNew}>+ Tambah Metode</Btn>
      </div>

      {showForm && (
        <div style={{ background: C.card, border: `1px solid ${C.borderBright}`, borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: C.glow }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: C.text }}>{editing ? "Edit Metode" : "Tambah Metode Baru"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Nama Metode *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Contoh: QRIS BCA" />
            <Input label="URL Logo (opsional)" value={form.logo} onChange={v => setForm(f => ({ ...f, logo: v }))} placeholder="https://..." />
          </div>
          <Input label="Link QRIS / Instruksi Bayar" value={form.qrisLink} onChange={v => setForm(f => ({ ...f, qrisLink: v }))} placeholder="https://qris.id/... atau nomor rekening" />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <button
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: form.isActive ? C.primary : "rgba(255,255,255,0.1)",
                position: "relative", transition: "background 0.2s",
              }}
            >
              <div style={{
                position: "absolute", top: 3, left: form.isActive ? 22 : 3,
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s",
              }} />
            </button>
            <span style={{ fontSize: 13, color: C.textSub }}>Aktif</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={save} disabled={saving}>{saving ? "Menyimpan..." : "💾 Simpan"}</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Batal</Btn>
          </div>
        </div>
      )}

      {loading ? <LoadingSkeleton rows={3} /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {methods.length === 0 ? (
            <div style={{ gridColumn: "1/-1", padding: 40, textAlign: "center", color: C.textMuted, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
              Belum ada metode pembayaran. Klik "+ Tambah Metode".
            </div>
          ) : methods.map(m => (
            <div key={m.id} style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${m.isActive ? C.borderBright : C.border}`, boxShadow: m.isActive ? C.glow : "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {m.logo ? <img src={m.logo} alt={m.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏦</div>}
                  <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{m.name}</span>
                </div>
                <Badge color={m.isActive ? C.success : C.textMuted}>{m.isActive ? "Aktif" : "Nonaktif"}</Badge>
              </div>
              {m.qrisLink && <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.qrisLink}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="ghost" onClick={() => openEdit(m)}>✏️ Edit</Btn>
                <Btn size="sm" variant="danger" onClick={() => del(m.id, m.name)}>🗑️ Hapus</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function PricingSection({ addToast }: { addToast: (m: string, t?: Toast["type"]) => void }) {
  const [data, setData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ daily: 5000, weekly: 25000, monthly: 79000, yearly: 699000, dailyName: "Paket Harian", weeklyName: "Paket Mingguan", monthlyName: "Paket Bulanan", yearlyName: "Paket Tahunan" });

  useEffect(() => {
    fetch("/api/admin/pricing", { credentials: "include" })
      .then(r => r.json())
      .then((d: PricingData) => { setData(d); setForm({ daily: d.daily, weekly: d.weekly, monthly: d.monthly, yearly: d.yearly, dailyName: d.dailyName, weeklyName: d.weeklyName, monthlyName: d.monthlyName, yearlyName: d.yearlyName }); })
      .catch(() => addToast("Gagal memuat harga", "error"))
      .finally(() => setLoading(false));
  }, [addToast]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/pricing", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      addToast("Harga berhasil diperbarui! ✅", "success");
    } catch { addToast("Gagal menyimpan", "error"); }
    finally { setSaving(false); }
  };

  const packages = [
    { key: "daily" as const, nameKey: "dailyName" as const, icon: "☀️", duration: "Hari", color: "#06b6d4" },
    { key: "weekly" as const, nameKey: "weeklyName" as const, icon: "📅", duration: "Minggu", color: "#8b5cf6" },
    { key: "monthly" as const, nameKey: "monthlyName" as const, icon: "🌙", duration: "Bulan", color: C.primary },
    { key: "yearly" as const, nameKey: "yearlyName" as const, icon: "⭐", duration: "Tahun", color: "#f59e0b" },
  ];

  return (
    <div>
      <SectionTitle title="Pengaturan Harga Paket" sub="Atur harga premium untuk setiap periode" />
      {loading ? <LoadingSkeleton rows={4} /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20, marginBottom: 28 }}>
            {packages.map(p => (
              <div key={p.key} style={{ background: C.card, borderRadius: 16, padding: 22, border: `1px solid ${C.border}`, boxShadow: `0 4px 20px rgba(0,0,0,0.2)`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -10, right: -10, fontSize: 60, opacity: 0.08 }}>{p.icon}</div>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{p.icon}</div>
                <input
                  value={form[p.nameKey]}
                  onChange={e => setForm(f => ({ ...f, [p.nameKey]: e.target.value }))}
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${C.border}`, color: C.text, fontSize: 15, fontWeight: 700, padding: "4px 0", marginBottom: 12, outline: "none" }}
                  placeholder={`Nama paket ${p.duration.toLowerCase()}`}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: C.textMuted, fontSize: 14, fontWeight: 600 }}>Rp</span>
                  <input
                    type="number"
                    value={form[p.key]}
                    onChange={e => setForm(f => ({ ...f, [p.key]: Number(e.target.value) }))}
                    style={{ flex: 1, background: C.input, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 20, fontWeight: 800, padding: "8px 12px", outline: "none" }}
                    onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = p.color; }}
                    onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = C.border; }}
                  />
                </div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 8 }}>
                  = {(form[p.key] / (p.key === "daily" ? 1 : p.key === "weekly" ? 7 : p.key === "monthly" ? 30 : 365)).toLocaleString("id-ID", { maximumFractionDigits: 0 })} / hari
                </div>
              </div>
            ))}
          </div>
          <Btn onClick={save} disabled={saving} style={{ minWidth: 180 }}>
            {saving ? "Menyimpan..." : "💾 Simpan Semua Harga"}
          </Btn>
        </>
      )}
    </div>
  );
}

// ─── Broadcast ────────────────────────────────────────────────────────────────
function BroadcastSection({ addToast }: { addToast: (m: string, t?: Toast["type"]) => void }) {
  const [msg, setMsg] = useState("");
  const [type, setType] = useState("announcement");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!msg.trim()) { addToast("Pesan tidak boleh kosong", "error"); return; }
    setSending(true);
    try {
      const r = await fetch("/api/admin/broadcast", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, type }) });
      if (!r.ok) throw new Error();
      const d = await r.json() as { sent: number };
      addToast(`Broadcast terkirim ke ${d.sent} pengguna! 🎉`, "success");
      setMsg("");
    } catch { addToast("Gagal mengirim broadcast", "error"); }
    finally { setSending(false); }
  };

  const types = [
    { val: "announcement", label: "📢 Pengumuman", color: C.info },
    { val: "promo", label: "🎉 Promo Premium", color: C.warning },
    { val: "maintenance", label: "🔧 Maintenance", color: C.danger },
  ];

  return (
    <div>
      <SectionTitle title="Broadcast Pesan" sub="Kirim notifikasi ke semua pengguna via Telegram" />
      <div style={{ background: C.card, borderRadius: 16, padding: 28, border: `1px solid ${C.border}`, maxWidth: 620 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textSub, marginBottom: 10 }}>Tipe Pesan</label>
          <div style={{ display: "flex", gap: 10 }}>
            {types.map(t => (
              <button key={t.val} onClick={() => setType(t.val)} style={{
                padding: "8px 14px", borderRadius: 9, border: `1px solid ${type === t.val ? t.color : C.border}`,
                background: type === t.val ? `${t.color}18` : "transparent", color: type === t.val ? t.color : C.textMuted,
                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>Isi Pesan *</label>
          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="Tulis pesan broadcast di sini..."
            rows={6}
            style={{ width: "100%", background: C.input, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: "12px 14px", resize: "vertical", outline: "none", fontFamily: "inherit" }}
            onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = C.primary; }}
            onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = C.border; }}
          />
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{msg.length} karakter</div>
        </div>

        <div style={{ background: `${C.info}12`, border: `1px solid ${C.info}30`, borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 13, color: `${C.info}cc` }}>
          ℹ️ Pesan akan dikirim via <strong>Telegram Bot</strong> ke channel yang terkonfigurasi.
        </div>

        <Btn onClick={send} disabled={sending || !msg.trim()} style={{ minWidth: 160 }}>
          {sending ? "⏳ Mengirim..." : "📣 Kirim Broadcast"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsSection({ addToast }: { addToast: (m: string, t?: Toast["type"]) => void }) {
  const [data, setData] = useState<SiteSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ siteName: "Nixx AI", logoUrl: "", bannerUrl: "", themeColor: "#7c3aed", freeLimit: "20" });

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then(r => r.json())
      .then((d: SiteSettingsData) => { setData(d); setForm({ siteName: d.siteName, logoUrl: d.logoUrl, bannerUrl: d.bannerUrl, themeColor: d.themeColor, freeLimit: String(d.freeLimit) }); })
      .catch(() => addToast("Gagal memuat pengaturan", "error"))
      .finally(() => setLoading(false));
  }, [addToast]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, freeLimit: Number(form.freeLimit) }) });
      if (!r.ok) throw new Error();
      addToast("Pengaturan berhasil disimpan! ✅", "success");
    } catch { addToast("Gagal menyimpan", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <SectionTitle title="Pengaturan Website" sub="Konfigurasi tampilan dan batas fitur" />
      {loading ? <LoadingSkeleton rows={5} /> : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, maxWidth: 800 }}>
          <div>
            <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: C.text }}>🌐 Info Website</h3>
              <Input label="Nama Website" value={form.siteName} onChange={v => setForm(f => ({ ...f, siteName: v }))} placeholder="Nixx AI" />
              <Input label="URL Logo" value={form.logoUrl} onChange={v => setForm(f => ({ ...f, logoUrl: v }))} placeholder="https://..." />
              <Input label="URL Banner" value={form.bannerUrl} onChange={v => setForm(f => ({ ...f, bannerUrl: v }))} placeholder="https://..." />
            </div>
            <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: C.text }}>🎨 Tema</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>Warna Tema Utama</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input type="color" value={form.themeColor} onChange={e => setForm(f => ({ ...f, themeColor: e.target.value }))} style={{ width: 44, height: 44, border: "none", borderRadius: 8, cursor: "pointer", background: "none" }} />
                  <input value={form.themeColor} onChange={e => setForm(f => ({ ...f, themeColor: e.target.value }))} style={{ flex: 1, background: C.input, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, padding: "10px 12px", outline: "none" }} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: C.text }}>⚡ Batas Chat Gratis</h3>
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: C.text, lineHeight: 1, marginBottom: 8 }}>{form.freeLimit}</div>
                <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 24 }}>pesan per hari (user gratis)</div>
                <input
                  type="range"
                  min={1} max={100}
                  value={Number(form.freeLimit)}
                  onChange={e => setForm(f => ({ ...f, freeLimit: e.target.value }))}
                  style={{ width: "100%", accentColor: C.primary }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                  <span>1</span><span>50</span><span>100</span>
                </div>
              </div>
              <Input type="number" label="Atau ketik manual" value={form.freeLimit} onChange={v => setForm(f => ({ ...f, freeLimit: v }))} hint="Nilai antara 1-100" />
            </div>

            <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: C.text }}>👁️ Preview</h3>
              <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <div style={{ background: form.themeColor + "22", padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontWeight: 700, color: form.themeColor }}>{form.siteName}</div>
                </div>
                <div style={{ padding: "12px 16px", fontSize: 13, color: C.textMuted }}>
                  Free limit: <strong style={{ color: form.themeColor }}>{form.freeLimit}</strong> pesan/hari
                </div>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <Btn onClick={save} disabled={saving} style={{ minWidth: 200 }}>
              {saving ? "Menyimpan..." : "💾 Simpan Pengaturan"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
