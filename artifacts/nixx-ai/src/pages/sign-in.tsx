import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

export default function SignInPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Isi email dan password dulu."); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 400));
    const err = login(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    navigate("/");
  };

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Background orbs */}
      <div style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,.35) 0%,transparent 70%)", top: -100, left: -80, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(236,72,153,.22) 0%,transparent 70%)", bottom: -60, right: -60, pointerEvents: "none" }} />

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoWrap}>
          <img src="https://iili.io/f7nDq8X.jpg" alt="Nixx AI" style={S.logo} onError={e => (e.currentTarget.style.display = "none")} />
          <div style={S.brand}>Nixx AI</div>
          <div style={S.sub}>Masuk ke akunmu</div>
        </div>

        <form onSubmit={handleSubmit} style={S.form}>
          {/* Email */}
          <div style={S.field}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" placeholder="email@kamu.com" value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              autoComplete="email" autoFocus />
          </div>

          {/* Password */}
          <div style={S.field}>
            <label style={S.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...S.input, paddingRight: 42 }} type={showPw ? "text" : "password"}
                placeholder="••••••••" value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(v => !v)} style={S.eyeBtn}>
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Lupa password */}
          <div style={{ textAlign: "right", marginTop: -4, marginBottom: 4 }}>
            <a href="/forgot-password" style={S.link}>Lupa password?</a>
          </div>

          {/* Error */}
          {error && (
            <div style={S.errorBox}>⚠️ {error}</div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? <span style={S.spinner}>⏳</span> : "🚀 Masuk"}
          </button>
        </form>

        {/* Divider */}
        <div style={S.divider}><span>atau</span></div>

        {/* Daftar */}
        <p style={{ textAlign: "center", fontSize: 14, color: "#9CA3AF", margin: 0 }}>
          Belum punya akun?{" "}
          <a href="/sign-up" style={{ ...S.link, fontWeight: 700 }}>Daftar gratis →</a>
        </p>
      </div>
    </div>
  );
}

const CSS = `
  @keyframes nx-fadein { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  @keyframes nx-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const S = {
  page: {
    minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg,#0a0a0f 0%,#0f0a1a 50%,#0a0a0f 100%)",
    padding: 16, position: "relative" as const, overflow: "hidden",
    fontFamily: "Inter,-apple-system,sans-serif",
  },
  card: {
    background: "rgba(255,255,255,.04)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(124,58,237,.25)", borderRadius: 20,
    padding: "32px 28px", width: "100%", maxWidth: 400,
    boxShadow: "0 0 60px rgba(124,58,237,.12), 0 8px 32px rgba(0,0,0,.4)",
    animation: "nx-fadein .4s ease",
    position: "relative" as const, zIndex: 1,
  },
  logoWrap: { textAlign: "center" as const, marginBottom: 28 },
  logo: { width: 60, height: 60, borderRadius: "50%", objectFit: "cover" as const, marginBottom: 10, border: "2px solid rgba(124,58,237,.4)" },
  brand: { fontSize: "1.7rem", fontWeight: 900, background: "linear-gradient(135deg,#a78bfa,#f472b6,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  sub: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  form: { display: "flex", flexDirection: "column" as const, gap: 14 },
  field: { display: "flex", flexDirection: "column" as const, gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "#C4B5FD", letterSpacing: "0.04em" },
  input: {
    background: "rgba(255,255,255,.06)", border: "1px solid rgba(124,58,237,.3)",
    borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none",
    fontFamily: "inherit", width: "100%", transition: "border-color .2s",
  } as React.CSSProperties,
  eyeBtn: {
    position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 2,
  },
  link: { color: "#A78BFA", textDecoration: "none", fontSize: 13 },
  errorBox: {
    background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)",
    borderRadius: 10, padding: "10px 14px", color: "#FCA5A5", fontSize: 13,
  },
  btn: {
    background: "linear-gradient(135deg,#7C3AED,#A855F7,#EC4899)",
    color: "#fff", border: "none", borderRadius: 12, padding: "13px",
    fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    boxShadow: "0 4px 20px rgba(124,58,237,.4)",
  } as React.CSSProperties,
  spinner: { display: "inline-block", animation: "nx-spin 1s linear infinite" },
  divider: {
    textAlign: "center" as const, color: "#4B5563", fontSize: 12,
    margin: "20px 0 16px", position: "relative" as const,
  } as React.CSSProperties,
};
