import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const ADMIN_EMAILS = ["nixxteam@gmail.com", "admin@nixxai.dev", "amabel1234@gmail.com"];

interface UserRow {
  email: string;
  username: string;
  id: number;
  isPremium?: boolean;
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("nx-users-db") ?? "[]") as any[];
      setUsers(stored.map(u => ({ email: u.email, username: u.username, id: u.id })));
    } catch { setUsers([]); }
  }, []);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

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

  return (
    <div style={{ minHeight: "100dvh", background: "#0d0d0f", color: "#f4f4f8", fontFamily: "Inter, sans-serif", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/dashboard" style={{ color: "#a855f7", textDecoration: "none", fontSize: 14 }}>← Dashboard</a>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>🛡️ Admin Panel</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 8, padding: "4px 12px", fontSize: 13, color: "#c084fc" }}>
              {user.email}
            </span>
            <button onClick={logout} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "4px 12px", fontSize: 13, color: "#ef4444", cursor: "pointer" }}>
              Keluar
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: "2rem" }}>
          {[
            { label: "Total User", value: users.length, emoji: "👥" },
            { label: "Total Percakapan", value: chatHistory.length, emoji: "💬" },
            { label: "Total Pesan", value: chatHistory.reduce((s: number, c: any) => s + (c.messages?.length ?? 0), 0), emoji: "📨" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 12, padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>{stat.emoji}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#a855f7", marginTop: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: "#7a7490", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #2a2830", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>👥 Daftar User ({users.length})</h2>
          </div>
          {users.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#7a7490" }}>Belum ada user terdaftar.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2a2830" }}>
                    {["ID", "Username", "Email"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#7a7490", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? "1px solid #2a2830" : "none" }}>
                      <td style={{ padding: "10px 16px", color: "#7a7490" }}>{u.id}</td>
                      <td style={{ padding: "10px 16px", fontWeight: 600 }}>{u.username}</td>
                      <td style={{ padding: "10px 16px", color: "#c0b8d8" }}>{u.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ marginTop: "1.5rem", textAlign: "center", color: "#7a7490", fontSize: 12 }}>
          ⚠️ Data diambil dari localStorage browser — hanya akun di perangkat ini yang tampil.
        </p>
      </div>
    </div>
  );
}
