import React, { useState, useEffect, useCallback } from "react";

const ADMIN_PASS_KEY = "nx-admin-pass";
const API = (path: string) => `/api/${path}`;

type Section = "dashboard" | "users" | "premium" | "payment" | "pricing" | "broadcast" | "settings";

interface User {
  id: number; email: string; username: string;
  isPremium?: boolean; chatCount?: number;
  registeredAt?: string; lastOnline?: string; suspended?: boolean;
}
interface Payment { id: number; email: string; username?: string; name: string; phone: string; payRef?: string; status: string; createdAt: string; }
interface Config {
  adminPassword?: string; premiumPrice?: number; dailyFreeLimit?: number;
  qrisUrl?: string; danaNumber?: string; danaName?: string;
  siteName?: string; siteLogo?: string;
  pricingDaily?: number; pricingWeekly?: number; pricingMonthly?: number; pricingYearly?: number;
  paymentDana?: boolean; paymentQris?: boolean; paymentTransfer?: boolean;
  broadcastMsg?: string;
}

const S = {
  bg: "#0b0b0f",
  card: "#111118",
  card2: "#16161f",
  border: "#2a2840",
  purple: "#a855f7",
  purpleDim: "rgba(168,85,247,0.15)",
  purpleBorder: "rgba(168,85,247,0.35)",
  text: "#f0eeff",
  muted: "#8b82a8",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
};

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: 16, boxShadow: `0 0 20px rgba(168,85,247,0.05)` }}>
      <div style={{ fontSize: 28, width: 48, height: 48, background: S.purpleDim, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div>
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: color || S.purple }}>{value}</div>
        <div style={{ fontSize: 13, color: S.muted, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function Btn({ children, onClick, color = S.purple, small, disabled, style }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: color === "red" ? "rgba(239,68,68,0.15)" : color === "green" ? "rgba(34,197,94,0.15)" : S.purpleDim,
      border: `1px solid ${color === "red" ? "rgba(239,68,68,0.4)" : color === "green" ? "rgba(34,197,94,0.4)" : S.purpleBorder}`,
      color: color === "red" ? S.red : color === "green" ? S.green : S.purple,
      borderRadius: 8, padding: small ? "5px 12px" : "9px 18px",
      fontSize: small ? 12 : 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, transition: "all .2s", ...style
    }}>{children}</button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 13, color: S.muted, fontWeight: 600 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: S.card2, border: `1px solid ${S.border}`, borderRadius: 8, padding: "10px 14px", color: S.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }} />
    </div>
  );
}

function Toast({ msg, type }: { msg: string; type: "ok" | "err" }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)", border: `1px solid ${type === "ok" ? S.green : S.red}`, color: type === "ok" ? S.green : S.red, padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 9999, backdropFilter: "blur(8px)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
      {type === "ok" ? "✅ " : "❌ "}{msg}
    </div>
  );
}

export default function AdminPage() {
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [config, setConfig] = useState<Config>({});
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "premium" | "free">("all");
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const adminPass = typeof window !== "undefined" ? localStorage.getItem(ADMIN_PASS_KEY) || "" : "";

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const callApi = useCallback(async (path: string, opts: RequestInit = {}) => {
    const p = localStorage.getItem(ADMIN_PASS_KEY) || "";
    const headers: any = { "Content-Type": "application/json", "x-admin-pass": p, ...(opts.headers || {}) };
    const res = await fetch(API(path), { ...opts, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  }, []);

  const tryLogin = async () => {
    setLoginError("");
    try {
      await callApi(`admin-stats?pass=${encodeURIComponent(pass)}`);
      localStorage.setItem(ADMIN_PASS_KEY, pass);
      setAuthed(true);
    } catch {
      setLoginError("Password salah atau server error.");
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_PASS_KEY);
    if (stored) {
      callApi(`admin-stats?pass=${encodeURIComponent(stored)}`).then(() => setAuthed(true)).catch(() => {});
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, configData, paymentsData] = await Promise.all([
        callApi("admin-stats").catch(() => ({ users: [] })),
        callApi("admin-config").catch(() => ({ config: {} })),
        callApi("admin-premium").catch(() => ({ payments: [] })),
      ]);
      setUsers(usersData.users || []);
      setConfig(configData.config || {});
      setPayments(paymentsData.payments || []);
    } catch (e: any) { showToast(e.message, "err"); }
    setLoading(false);
  }, [callApi]);

  useEffect(() => { if (authed) loadData(); }, [authed, loadData]);

  const saveConfig = async (updates: Partial<Config>) => {
    try {
      await callApi("admin-config", { method: "POST", body: JSON.stringify(updates) });
      setConfig(prev => ({ ...prev, ...updates }));
      showToast("Pengaturan tersimpan!");
    } catch (e: any) { showToast(e.message, "err"); }
  };

  const handlePremiumAction = async (paymentId: number, action: "approved" | "rejected") => {
    try {
      await callApi("admin-premium", { method: "POST", body: JSON.stringify({ paymentId, action }) });
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: action } : p));
      showToast(action === "approved" ? "Premium diaktifkan!" : "Ditolak.");
      loadData();
    } catch (e: any) { showToast(e.message, "err"); }
  };

  const handleSuspendUser = async (email: string, suspend: boolean) => {
    try {
      await callApi("admin-user-action", { method: "POST", body: JSON.stringify({ email, action: suspend ? "suspend" : "unsuspend" }) });
      setUsers(prev => prev.map(u => u.email === email ? { ...u, suspended: suspend } : u));
      showToast(suspend ? "User disuspend." : "Suspend dicabut.");
    } catch (e: any) { showToast(e.message, "err"); }
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Hapus user ${email}?`)) return;
    try {
      await callApi("admin-user-action", { method: "POST", body: JSON.stringify({ email, action: "delete" }) });
      setUsers(prev => prev.filter(u => u.email !== email));
      showToast("User dihapus.");
    } catch (e: any) { showToast(e.message, "err"); }
  };

  const logout = () => { localStorage.removeItem(ADMIN_PASS_KEY); setAuthed(false); setPass(""); };

  const MENU: { id: Section; icon: string; label: string }[] = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "users", icon: "👥", label: "Users" },
    { id: "premium", icon: "⭐", label: "Premium" },
    { id: "payment", icon: "💳", label: "Payment" },
    { id: "pricing", icon: "💰", label: "Harga Paket" },
    { id: "broadcast", icon: "📢", label: "Broadcast" },
    { id: "settings", icon: "⚙️", label: "Pengaturan" },
  ];

  const totalPremium = users.filter(u => u.isPremium).length;
  const totalFree = users.length - totalPremium;
  const pendingPayments = payments.filter(p => p.status === "pending").length;

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchSearch = !q || u.email.includes(q) || u.username?.toLowerCase().includes(q);
    const matchFilter = userFilter === "all" || (userFilter === "premium" ? u.isPremium : !u.isPremium);
    return matchSearch && matchFilter;
  });

  if (!authed) {
    return (
      <div style={{ minHeight: "100dvh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <style>{`input::placeholder{color:#5a5270} * {box-sizing:border-box}`}</style>
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 20, padding: "2.5rem", width: "100%", maxWidth: 400, boxShadow: `0 0 60px rgba(168,85,247,0.1)` }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🛡️</div>
            <h1 style={{ color: S.text, margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Admin Panel</h1>
            <p style={{ color: S.muted, margin: "8px 0 0", fontSize: 14 }}>Masuk dengan password admin</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Password Admin" value={pass} onChange={setPass} type="password" placeholder="Masukkan password..." />
            {loginError && <p style={{ color: S.red, fontSize: 13, margin: 0 }}>{loginError}</p>}
            <button onClick={tryLogin} onKeyDown={e => e.key === "Enter" && tryLogin()} style={{ background: `linear-gradient(135deg, #7c3aed, #a855f7)`, border: "none", borderRadius: 10, padding: "12px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
              Masuk →
            </button>
            <a href="/dashboard" style={{ color: S.muted, fontSize: 13, textAlign: "center", textDecoration: "none" }}>← Kembali ke Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: S.bg, fontFamily: "Inter, sans-serif", display: "flex", color: S.text }}>
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #5a5270; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #3a3458; border-radius: 4px; }
        @media(max-width:768px) { .adm-sidebar { position: fixed !important; left: -260px !important; transition: left .3s; z-index:100; } .adm-sidebar.open { left: 0 !important; } }
        .menu-item:hover { background: rgba(168,85,247,0.1) !important; }
        .table-row:hover { background: rgba(168,85,247,0.04) !important; }
        .adm-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; }
      `}</style>

      {/* Sidebar */}
      <aside className={`adm-sidebar${sidebarOpen ? " open" : ""}`} style={{ width: 240, background: S.card, borderRight: `1px solid ${S.border}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${S.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,#7c3aed,#a855f7)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Nixx Admin</div>
              <div style={{ fontSize: 11, color: S.muted }}>Panel Kontrol</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "1rem 0.75rem", overflow: "auto" }}>
          {MENU.map(item => (
            <button key={item.id} className="menu-item" onClick={() => setSection(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: "none", background: section === item.id ? S.purpleDim : "transparent", color: section === item.id ? S.purple : S.muted, fontSize: 14, fontWeight: section === item.id ? 700 : 500, cursor: "pointer", textAlign: "left", marginBottom: 4, transition: "all .15s" }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
              {item.id === "premium" && pendingPayments > 0 && (
                <span style={{ marginLeft: "auto", background: S.red, color: "#fff", borderRadius: 20, fontSize: 11, padding: "1px 7px", fontWeight: 700 }}>{pendingPayments}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: "1rem 0.75rem", borderTop: `1px solid ${S.border}` }}>
          <button className="menu-item" onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: "none", background: "rgba(239,68,68,0.08)", color: S.red, fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        {/* Header */}
        <div style={{ background: S.card, borderBottom: `1px solid ${S.border}`, padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen(v => !v)} style={{ background: "none", border: "none", color: S.muted, fontSize: 20, cursor: "pointer", padding: 4 }}>☰</button>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
              {MENU.find(m => m.id === section)?.icon} {MENU.find(m => m.id === section)?.label}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={loadData} style={{ background: S.purpleDim, border: `1px solid ${S.purpleBorder}`, color: S.purple, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        <div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>

          {/* DASHBOARD */}
          {section === "dashboard" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
                <StatCard icon="👥" label="Total User" value={users.length} />
                <StatCard icon="⭐" label="User Premium" value={totalPremium} color={S.yellow} />
                <StatCard icon="🆓" label="User Gratis" value={totalFree} color={S.green} />
                <StatCard icon="⏳" label="Pembayaran Pending" value={pendingPayments} color={pendingPayments > 0 ? S.red : S.green} />
              </div>

              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, color: S.muted, fontWeight: 600 }}>👤 User Terbaru</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                      {["Email", "Username", "Status", "Terdaftar"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, color: S.muted, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 8).map(u => (
                      <tr key={u.email} className="table-row" style={{ borderBottom: `1px solid rgba(42,40,64,0.5)` }}>
                        <td style={{ padding: "10px 12px", fontSize: 13 }}>{u.email}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13 }}>{u.username || "-"}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span className="adm-badge" style={{ background: u.isPremium ? "rgba(234,179,8,0.15)" : "rgba(107,114,128,0.15)", color: u.isPremium ? S.yellow : S.muted }}>
                            {u.isPremium ? "⭐ Premium" : "Gratis"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: S.muted }}>{u.registeredAt ? new Date(u.registeredAt).toLocaleDateString("id") : "-"}</td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: S.muted, fontSize: 13 }}>{loading ? "Memuat..." : "Belum ada user"}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS */}
          {section === "users" && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="🔍 Cari email / username..." style={{ flex: 1, minWidth: 200, background: S.card, border: `1px solid ${S.border}`, borderRadius: 8, padding: "9px 14px", color: S.text, fontSize: 14, outline: "none" }} />
                {(["all", "premium", "free"] as const).map(f => (
                  <button key={f} onClick={() => setUserFilter(f)} style={{ background: userFilter === f ? S.purpleDim : "transparent", border: `1px solid ${userFilter === f ? S.purpleBorder : S.border}`, color: userFilter === f ? S.purple : S.muted, borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {f === "all" ? "Semua" : f === "premium" ? "⭐ Premium" : "Gratis"}
                  </button>
                ))}
              </div>
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${S.border}`, background: S.card2 }}>
                      {["Email", "Username", "Status", "Terdaftar", "Aksi"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 12, color: S.muted, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.email} className="table-row" style={{ borderBottom: `1px solid rgba(42,40,64,0.4)` }}>
                        <td style={{ padding: "10px 14px", fontSize: 13 }}>{u.email}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13 }}>{u.username || "-"}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span className="adm-badge" style={{ background: u.suspended ? "rgba(239,68,68,0.15)" : u.isPremium ? "rgba(234,179,8,0.15)" : "rgba(107,114,128,0.15)", color: u.suspended ? S.red : u.isPremium ? S.yellow : S.muted }}>
                            {u.suspended ? "🚫 Suspend" : u.isPremium ? "⭐ Premium" : "Gratis"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: S.muted }}>{u.registeredAt ? new Date(u.registeredAt).toLocaleDateString("id") : "-"}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Btn small onClick={() => handleSuspendUser(u.email, !u.suspended)} color={u.suspended ? "green" : "red"}>{u.suspended ? "Aktifkan" : "Suspend"}</Btn>
                            <Btn small onClick={() => handleDeleteUser(u.email)} color="red">Hapus</Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: S.muted, fontSize: 13 }}>{loading ? "Memuat..." : "Tidak ada user"}</td></tr>}
                  </tbody>
                </table>
              </div>
              <p style={{ color: S.muted, fontSize: 13, marginTop: 10 }}>Total: {filteredUsers.length} user</p>
            </div>
          )}

          {/* PREMIUM */}
          {section === "premium" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 24 }}>
                <StatCard icon="⏳" label="Pending" value={payments.filter(p => p.status === "pending").length} color={S.yellow} />
                <StatCard icon="✅" label="Approved" value={payments.filter(p => p.status === "approved").length} color={S.green} />
                <StatCard icon="❌" label="Rejected" value={payments.filter(p => p.status === "rejected").length} color={S.red} />
              </div>
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${S.border}`, background: S.card2 }}>
                      {["Nama", "Email", "HP", "Ref", "Status", "Waktu", "Aksi"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 12, color: S.muted, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="table-row" style={{ borderBottom: `1px solid rgba(42,40,64,0.4)` }}>
                        <td style={{ padding: "10px 14px", fontSize: 13 }}>{p.name}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12 }}>{p.email}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12 }}>{p.phone}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: S.muted }}>{p.payRef || "-"}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span className="adm-badge" style={{ background: p.status === "pending" ? "rgba(234,179,8,0.15)" : p.status === "approved" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: p.status === "pending" ? S.yellow : p.status === "approved" ? S.green : S.red }}>
                            {p.status === "pending" ? "⏳ Pending" : p.status === "approved" ? "✅ Approved" : "❌ Rejected"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: S.muted }}>{new Date(p.createdAt).toLocaleDateString("id")}</td>
                        <td style={{ padding: "10px 14px" }}>
                          {p.status === "pending" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <Btn small onClick={() => handlePremiumAction(p.id, "approved")} color="green">✅ Approve</Btn>
                              <Btn small onClick={() => handlePremiumAction(p.id, "rejected")} color="red">❌ Tolak</Btn>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: S.muted, fontSize: 13 }}>{loading ? "Memuat..." : "Belum ada pembayaran"}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAYMENT METHODS */}
          {section === "payment" && (
            <div style={{ maxWidth: 600 }}>
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: "1.5rem", marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>💳 Metode Pembayaran</h3>
                {[
                  { key: "paymentDana", label: "Dana", icon: "💙" },
                  { key: "paymentQris", label: "QRIS", icon: "📱" },
                  { key: "paymentTransfer", label: "Transfer Bank", icon: "🏦" },
                ].map(m => (
                  <div key={m.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${S.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{m.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</span>
                    </div>
                    <button onClick={() => saveConfig({ [m.key]: !(config as any)[m.key] })}
                      style={{ background: (config as any)[m.key] ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.15)", border: `1px solid ${(config as any)[m.key] ? "rgba(34,197,94,0.4)" : S.border}`, color: (config as any)[m.key] ? S.green : S.muted, borderRadius: 20, padding: "5px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      {(config as any)[m.key] ? "✅ Aktif" : "⬜ Nonaktif"}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>📱 QRIS Settings</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Input label="Nama QRIS" value={config.qrisUrl || ""} onChange={(v: string) => setConfig(c => ({ ...c, qrisUrl: v }))} placeholder="Link/URL QRIS..." />
                  <Input label="No. Dana / HP" value={config.danaNumber || ""} onChange={(v: string) => setConfig(c => ({ ...c, danaNumber: v }))} placeholder="08xxxxxxxxxx" />
                  <Input label="Nama Penerima Dana" value={config.danaName || ""} onChange={(v: string) => setConfig(c => ({ ...c, danaName: v }))} placeholder="Nama akun Dana..." />
                  <Btn onClick={() => saveConfig({ qrisUrl: config.qrisUrl, danaNumber: config.danaNumber, danaName: config.danaName })}>💾 Simpan Pengaturan</Btn>
                </div>
              </div>
            </div>
          )}

          {/* PRICING */}
          {section === "pricing" && (
            <div style={{ maxWidth: 500 }}>
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700 }}>💰 Harga Paket Premium</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Input label="Harga Harian (Rp)" type="number" value={config.pricingDaily || ""} onChange={(v: string) => setConfig(c => ({ ...c, pricingDaily: Number(v) }))} placeholder="5000" />
                  <Input label="Harga Mingguan (Rp)" type="number" value={config.pricingWeekly || ""} onChange={(v: string) => setConfig(c => ({ ...c, pricingWeekly: Number(v) }))} placeholder="10000" />
                  <Input label="Harga Bulanan (Rp)" type="number" value={config.pricingMonthly || ""} onChange={(v: string) => setConfig(c => ({ ...c, pricingMonthly: Number(v) }))} placeholder="15000" />
                  <Input label="Harga Tahunan (Rp)" type="number" value={config.pricingYearly || ""} onChange={(v: string) => setConfig(c => ({ ...c, pricingYearly: Number(v) }))} placeholder="100000" />
                  <Btn onClick={() => saveConfig({ pricingDaily: config.pricingDaily, pricingWeekly: config.pricingWeekly, pricingMonthly: config.pricingMonthly, pricingYearly: config.pricingYearly })}>💾 Simpan Harga</Btn>
                </div>
              </div>
            </div>
          )}

          {/* BROADCAST */}
          {section === "broadcast" && (
            <div style={{ maxWidth: 600 }}>
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>📢 Kirim Broadcast</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, color: S.muted, fontWeight: 600, display: "block", marginBottom: 6 }}>Pesan Broadcast</label>
                    <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} rows={5} placeholder="Ketik pesan untuk semua user..."
                      style={{ width: "100%", background: S.card2, border: `1px solid ${S.border}`, borderRadius: 8, padding: "10px 14px", color: S.text, fontSize: 14, outline: "none", resize: "vertical" }} />
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {["🎉 Promo Premium!", "🔧 Maintenance malam ini.", "✨ Fitur baru tersedia!"].map(tmpl => (
                      <button key={tmpl} onClick={() => setBroadcastMsg(tmpl)} style={{ background: S.purpleDim, border: `1px solid ${S.purpleBorder}`, color: S.purple, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>{tmpl}</button>
                    ))}
                  </div>
                  <Btn onClick={async () => {
                    if (!broadcastMsg.trim()) return showToast("Pesan kosong!", "err");
                    await saveConfig({ broadcastMsg: broadcastMsg.trim() });
                    showToast("Broadcast tersimpan! User akan melihat notifikasi.");
                    setBroadcastMsg("");
                  }}>📤 Kirim Broadcast ({users.length} user)</Btn>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {section === "settings" && (
            <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>🌐 Pengaturan Website</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Input label="Nama Website" value={config.siteName || ""} onChange={(v: string) => setConfig(c => ({ ...c, siteName: v }))} placeholder="Nixx AI" />
                  <Input label="Logo URL" value={config.siteLogo || ""} onChange={(v: string) => setConfig(c => ({ ...c, siteLogo: v }))} placeholder="https://..." />
                  <Input label="Limit Chat Gratis/Hari" type="number" value={config.dailyFreeLimit || 20} onChange={(v: string) => setConfig(c => ({ ...c, dailyFreeLimit: Number(v) }))} placeholder="20" />
                  <Btn onClick={() => saveConfig({ siteName: config.siteName, siteLogo: config.siteLogo, dailyFreeLimit: config.dailyFreeLimit })}>💾 Simpan</Btn>
                </div>
              </div>

              <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>🔑 Ganti Password Admin</h3>
                <ChangePassForm onSave={async (cur, nw) => {
                  const res = await callApi("admin-change-pass", { method: "POST", body: JSON.stringify({ currentPass: cur, newPass: nw }) });
                  if (res.ok) { localStorage.setItem(ADMIN_PASS_KEY, nw); showToast("Password diubah!"); }
                  else throw new Error(res.error);
                }} onError={msg => showToast(msg, "err")} />
              </div>
            </div>
          )}

        </div>
      </main>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

function ChangePassForm({ onSave, onError }: { onSave: (cur: string, nw: string) => Promise<void>; onError: (m: string) => void }) {
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [nw2, setNw2] = useState(""); const [loading, setLoading] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input label="Password Lama" value={cur} onChange={setCur} type="password" placeholder="Password saat ini..." />
      <Input label="Password Baru" value={nw} onChange={setNw} type="password" placeholder="Min. 6 karakter..." />
      <Input label="Konfirmasi Password Baru" value={nw2} onChange={setNw2} type="password" placeholder="Ulangi password baru..." />
      <Btn disabled={loading} onClick={async () => {
        if (nw !== nw2) return onError("Password baru tidak cocok!");
        if (nw.length < 6) return onError("Password minimal 6 karakter!");
        setLoading(true);
        try { await onSave(cur, nw); setCur(""); setNw(""); setNw2(""); } catch (e: any) { onError(e.message); }
        setLoading(false);
      }}>{loading ? "Menyimpan..." : "🔑 Ubah Password"}</Btn>
    </div>
  );
}
