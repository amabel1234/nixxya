import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const ADMIN_EMAILS = ["nixxteam@gmail.com", "admin@nixxai.dev", "amabel1234@gmail.com", "kelaoffc@gmail.com"];

interface UserRow {
  email: string;
  username: string;
  id: number;
  isPremium?: boolean;
  createdAt?: string;
}

function loadUsers(): UserRow[] {
  try {
    return JSON.parse(localStorage.getItem("nx-users-db") ?? "[]") as UserRow[];
  } catch { return []; }
}

function saveUsers(users: UserRow[]) {
  localStorage.setItem("nx-users-db", JSON.stringify(users));
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { setUsers(loadUsers()); }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  const togglePremium = (id: number) => {
    const updated = users.map(u =>
      u.id === id ? { ...u, isPremium: !u.isPremium } : u
    );
    setUsers(updated);
    saveUsers(updated);
    const target = updated.find(u => u.id === id);
    showToast(
      target?.isPremium
        ? `✅ ${target.username} sekarang PREMIUM`
        : `🔓 ${target?.username} kembali ke FREE`,
      true
    );
  };

  const deleteUser = (id: number) => {
    const target = users.find(u => u.id === id);
    if (!confirm(`Hapus user "${target?.username}"? Aksi ini tidak bisa dibatalkan.`)) return;
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    saveUsers(updated);
    showToast(`🗑️ User ${target?.username} dihapus`, true);
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0d0d0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#f0eeff", textAlign: "center" }}>
          <p style={{ marginBottom: 16 }}>⚠️ Kamu harus login dulu.</p>
          <a href="/sign-in" style={{ color: "#a855f7" }}>← Login</a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0d0d0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#f0eeff", textAlign: "center" }}>
          <p style={{ fontSize: 40 }}>🚫</p>
          <p style={{ marginBottom: 8 }}>Akses ditolak. Kamu bukan admin.</p>
          <a href="/dashboard" style={{ color: "#a855f7" }}>← Kembali ke Dashboard</a>
        </div>
      </div>
    );
  }

  const chatHistory = (() => {
    try { return JSON.parse(localStorage.getItem("nx-chat-history") ?? "[]") as any[]; } catch { return []; }
  })();

  const premiumCount = users.filter(u => u.isPremium).length;
  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const cardStyle: React.CSSProperties = {
    background: "#1a1a1e",
    border: "1px solid #2a2830",
    borderRadius: 12,
    padding: "1.25rem",
    textAlign: "center",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#0d0d0f", color: "#f4f4f8", fontFamily: "Inter, sans-serif", padding: "2rem 1rem" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.ok ? "#1a2e1a" : "#2e1a1a",
          border: `1px solid ${toast.ok ? "#22c55e" : "#ef4444"}`,
          borderRadius: 10, padding: "10px 18px",
          color: toast.ok ? "#22c55e" : "#ef4444",
          fontSize: 14, fontWeight: 600,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          animation: "fadein .2s",
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes fadein { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }
        .adm-btn { cursor:pointer; border:none; border-radius:8px; padding:5px 14px; font-size:13px; font-weight:600; transition:.15s; }
        .adm-btn:hover { filter:brightness(1.2); }
        .adm-row:hover { background: rgba(168,85,247,0.05) !important; }
        .adm-search { background:#1a1a1e; border:1px solid #2a2830; border-radius:8px; padding:8px 14px; color:#f4f4f8; font-size:14px; outline:none; width:100%; max-width:320px; }
        .adm-search:focus { border-color:#a855f7; }
        .prem-badge { background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; border-radius:6px; padding:2px 10px; font-size:11px; font-weight:700; }
        .free-badge { background:#2a2830; color:#7a7490; border-radius:6px; padding:2px 10px; font-size:11px; font-weight:600; }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/dashboard" style={{ color: "#a855f7", textDecoration: "none", fontSize: 14 }}>← Dashboard</a>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>🛡️ Admin Panel</h1>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, padding: "4px 12px", fontSize: 13, color: "#c084fc" }}>
              {user.email}
            </span>
            <button onClick={logout} className="adm-btn" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              Keluar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: "2rem" }}>
          {[
            { label: "Total User", value: users.length, emoji: "👥" },
            { label: "User Premium", value: premiumCount, emoji: "⭐" },
            { label: "User Free", value: users.length - premiumCount, emoji: "🆓" },
            { label: "Total Chat", value: chatHistory.length, emoji: "💬" },
            { label: "Total Pesan", value: chatHistory.reduce((s: number, c: any) => s + (c.messages?.length ?? 0), 0), emoji: "📨" },
          ].map(stat => (
            <div key={stat.label} style={cardStyle}>
              <div style={{ fontSize: 26 }}>{stat.emoji}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#a855f7", marginTop: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#7a7490", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* User Table */}
        <div style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #2a2830", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>👥 Daftar User ({users.length})</h2>
            <input
              className="adm-search"
              placeholder="🔍 Cari username / email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "#7a7490" }}>
              {search ? "Tidak ada user yang cocok." : "Belum ada user terdaftar."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2a2830", background: "rgba(168,85,247,0.04)" }}>
                    {["ID", "Username", "Email", "Status", "Set Premium", "Hapus"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#7a7490", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id} className="adm-row" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #2a2830" : "none", transition: ".15s" }}>
                      <td style={{ padding: "10px 14px", color: "#7a7490", fontSize: 12 }}>{u.id}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 700 }}>{u.username}</td>
                      <td style={{ padding: "10px 14px", color: "#c0b8d8", fontSize: 13 }}>{u.email}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {u.isPremium
                          ? <span className="prem-badge">⭐ PREMIUM</span>
                          : <span className="free-badge">FREE</span>}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <button
                          className="adm-btn"
                          onClick={() => togglePremium(u.id)}
                          style={{
                            background: u.isPremium
                              ? "rgba(239,68,68,0.12)"
                              : "rgba(245,158,11,0.15)",
                            border: u.isPremium
                              ? "1px solid rgba(239,68,68,0.35)"
                              : "1px solid rgba(245,158,11,0.4)",
                            color: u.isPremium ? "#ef4444" : "#f59e0b",
                          }}
                        >
                          {u.isPremium ? "🔓 Cabut" : "⭐ Set Premium"}
                        </button>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <button
                          className="adm-btn"
                          onClick={() => deleteUser(u.id)}
                          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ marginTop: "1.5rem", textAlign: "center", color: "#7a7490", fontSize: 12 }}>
          ⚠️ Data diambil dari localStorage browser — hanya akun yang pernah login di perangkat ini yang tampil.
        </p>
      </div>
    </div>
  );
}
