import { useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { useTheme } from "@/App";
import { useGetMe, useGetUsage } from "@workspace/api-client-react";

export default function ProfilePage() {
  const { isDark, toggle } = useTheme();
  const [, navigate] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  const { data: me } = useGetMe();
  const { data: usage } = useGetUsage();

  return (
    <div className="nx-profile-page">
      <button className="nx-menu-toggle" onClick={() => navigate("/chat")} style={{ left: 14, top: 14 }}>←</button>
      <button className="nx-theme-toggle" onClick={toggle}>{isDark ? "☀️" : "🌙"}</button>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ fontWeight: 900, fontSize: "1.4rem", color: "var(--text-primary)", marginBottom: 20 }}>Profil Saya</div>

        <div className="nx-profile-card">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Avatar" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-color)" }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "white", fontWeight: 900 }}>
                {(me?.name ?? me?.email ?? "U")[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="nx-profile-name">{me?.name ?? user?.fullName ?? "Pengguna"}</div>
              <div className="nx-profile-email">{me?.email ?? user?.primaryEmailAddress?.emailAddress}</div>
            </div>
          </div>
        </div>

        <div className="nx-profile-card">
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 14 }}>Penggunaan Hari Ini</div>
          {usage && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>Pesan terkirim</span>
                <span style={{ fontWeight: 700, color: "var(--accent)" }}>{usage.used} / {usage.limit}</span>
              </div>
              <div style={{ background: "var(--secondary-bg)", borderRadius: 8, height: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--gradient)", width: `${Math.min(100, (usage.used / usage.limit) * 100)}%`, transition: "width 0.4s ease", borderRadius: 8 }} />
              </div>
            </>
          )}
        </div>

        {user?.id && (
          <div className="nx-profile-card">
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 10 }}>🔑 User ID</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--secondary-bg)", border: "1.5px solid var(--border-color)", borderRadius: 10, padding: "10px 12px" }}>
              <code style={{ flex: 1, fontSize: "0.78rem", color: "var(--text-primary)", wordBreak: "break-all", fontFamily: "monospace" }}>{user.id}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(user.id); alert("User ID disalin!"); }}
                style={{ flexShrink: 0, background: "var(--gradient)", color: "white", border: "none", borderRadius: 7, padding: "6px 10px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
              >Salin</button>
            </div>
          </div>
        )}

        <div className="nx-profile-card">
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 14 }}>Akun</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => navigate("/chat")}
              style={{ background: "var(--secondary-bg)", border: "1.5px solid var(--border-color)", borderRadius: 10, padding: "11px 16px", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer", textAlign: "left" }}
            >
              💬 Kembali ke Chat
            </button>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              style={{ background: "#fff1f0", border: "1.5px solid var(--danger-color)", borderRadius: 10, padding: "11px 16px", fontSize: "0.88rem", fontWeight: 600, color: "var(--danger-color)", cursor: "pointer", textAlign: "left" }}
            >
              🚪 Keluar dari Akun
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
