import React, { useState } from "react";
  import { useAuth } from "@/context/AuthContext";

  const USERS_KEY = "nx-users-db";
  const SESSION_KEY = "nx-session-user";

  const inp: React.CSSProperties = {
    padding: "10px 12px", border: "1.5px solid rgba(168,85,247,0.3)", borderRadius: 10,
    background: "#0d0d0f", color: "#f0e6ff", fontSize: "0.875rem", fontFamily: "inherit",
    outline: "none", width: "100%", boxSizing: "border-box",
  };
  const btnPrimary: React.CSSProperties = {
    padding: "11px", background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none",
    borderRadius: 10, color: "#fff", fontSize: "0.875rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", width: "100%",
  };

  function Msg({ m }: { m: { type: "ok" | "err"; text: string } }) {
    const err = m.type === "err";
    return (
      <div style={{
        padding: "8px 12px", borderRadius: 8, fontSize: "0.82rem",
        background: err ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
        border: `1px solid ${err ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
        color: err ? "#f87171" : "#34d399",
      }}>{err ? "⚠️ " : "✅ "}{m.text}</div>
    );
  }

  export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [uname, setUname] = useState(user?.username ?? "");
    const [cur, setCur]     = useState("");
    const [nw, setNw]       = useState("");
    const [cnf, setCnf]     = useState("");
    const [pm, setPm]       = useState<{ type: "ok" | "err"; text: string } | null>(null);
    const [wm, setWm]       = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const saveProfile = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      try {
        const us: any[] = JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
        const i = us.findIndex((u) => u.id === user.id);
        if (i < 0) { setPm({ type: "err", text: "User tidak ditemukan." }); return; }
        us[i].username = uname.trim() || us[i].username;
        localStorage.setItem(USERS_KEY, JSON.stringify(us));
        localStorage.setItem(SESSION_KEY, JSON.stringify({ ...user, username: us[i].username }));
        setPm({ type: "ok", text: "Username berhasil diperbarui." });
      } catch { setPm({ type: "err", text: "Gagal memperbarui." }); }
    };

    const changePw = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      if (nw.length < 6) { setWm({ type: "err", text: "Password minimal 6 karakter." }); return; }
      if (nw !== cnf) { setWm({ type: "err", text: "Konfirmasi tidak cocok." }); return; }
      try {
        const us: any[] = JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
        const i = us.findIndex((u) => u.id === user.id);
        if (i < 0) { setWm({ type: "err", text: "User tidak ditemukan." }); return; }
        if (us[i].password !== cur) { setWm({ type: "err", text: "Password saat ini salah." }); return; }
        us[i].password = nw;
        localStorage.setItem(USERS_KEY, JSON.stringify(us));
        setCur(""); setNw(""); setCnf("");
        setWm({ type: "ok", text: "Password berhasil diganti." });
      } catch { setWm({ type: "err", text: "Gagal mengganti password." }); }
    };

    const av = (user?.username ?? user?.email ?? "?").charAt(0).toUpperCase();

    return (
      <div style={{ minHeight: "100dvh", background: "#0d0d0f", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "32px 16px" }}>
        <div style={{ width: "100%", maxWidth: 480, background: "#18181b", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 16, borderBottom: "1px solid rgba(168,85,247,0.1)" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {av}
            </div>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f0e6ff" }}>{user?.username}</div>
              <div style={{ fontSize: "0.82rem", color: "rgba(168,85,247,0.7)", marginTop: 3 }}>{user?.email}</div>
            </div>
          </div>

          <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(168,85,247,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ubah Username</div>
            <input value={uname} onChange={(e) => setUname(e.target.value)} placeholder="Username baru" style={inp} />
            {pm && <Msg m={pm} />}
            <button type="submit" style={btnPrimary}>Simpan Username</button>
          </form>

          <form onSubmit={changePw} style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 16, borderTop: "1px solid rgba(168,85,247,0.1)" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(168,85,247,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ganti Password</div>
            <input type="password" value={cur}  onChange={(e) => setCur(e.target.value)}  placeholder="Password saat ini"              style={inp} />
            <input type="password" value={nw}   onChange={(e) => setNw(e.target.value)}   placeholder="Password baru (min. 6 karakter)"  style={inp} />
            <input type="password" value={cnf}  onChange={(e) => setCnf(e.target.value)}  placeholder="Konfirmasi password baru"          style={inp} />
            {wm && <Msg m={wm} />}
            <button type="submit" style={btnPrimary}>Ganti Password</button>
          </form>

          <div style={{ display: "flex", gap: 8, paddingTop: 16, borderTop: "1px solid rgba(168,85,247,0.1)" }}>
            <button onClick={() => window.history.back()} style={{ flex: 1, padding: "10px", border: "1.5px solid rgba(168,85,247,0.3)", borderRadius: 10, color: "rgba(168,85,247,0.8)", background: "transparent", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              ← Kembali
            </button>
            <button onClick={logout} style={{ flex: 1, padding: "10px", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#f87171", background: "transparent", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              🚪 Keluar
            </button>
          </div>
        </div>
      </div>
    );
  }
  