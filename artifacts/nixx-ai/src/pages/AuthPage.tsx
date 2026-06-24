import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "register" | "forgot" | "reset-success";

export default function AuthPage({ defaultMode }: { defaultMode: "login" | "register" }) {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        window.location.href = "/dashboard";
      } else if (mode === "register") {
        if (password.length < 6) throw new Error("Password minimal 6 karakter");
        await register(email, username, password);
        window.location.href = "/dashboard";
      } else if (mode === "forgot") {
        await resetPassword(email, newPassword);
        setMode("reset-success");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === "login" ? "register" : "login");
    setError("");
    setEmail(""); setUsername(""); setPassword(""); setNewPassword("");
  };

  const goForgot = () => {
    setMode("forgot");
    setError("");
    setPassword(""); setNewPassword("");
  };

  const goLogin = () => {
    setMode("login");
    setError("");
    setPassword(""); setNewPassword("");
  };

  if (mode === "reset-success") {
    return (
      <div className="nx-auth-bg">
        <div className="nx-auth-glow" />
        <div className="nx-auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <h2 className="nx-auth-heading">Password Berhasil Direset!</h2>
          <p className="nx-auth-subtext">Password kamu sudah diperbarui. Silakan masuk dengan password baru.</p>
          <button
            className="nx-auth-submit"
            style={{ marginTop: 24 }}
            onClick={goLogin}
          >
            ✓ Masuk Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nx-auth-bg">
      <div className="nx-auth-glow" />
      <div className="nx-auth-card">
        <div className="nx-auth-logo-wrap">
          <div className="nx-auth-logo-icon">🧠</div>
          <span className="nx-auth-logo-text">Nixx AI</span>
        </div>

        <h2 className="nx-auth-heading">
          {mode === "login" ? "Selamat Datang" : mode === "register" ? "Buat Akun Baru" : "Reset Password"}
        </h2>
        <p className="nx-auth-subtext">
          {mode === "login"
            ? "Masuk untuk mulai chat AI gratis"
            : mode === "register"
            ? "Daftar gratis, langsung bisa pakai!"
            : "Masukkan email & password baru kamu"}
        </p>

        <form onSubmit={handleSubmit} className="nx-auth-form">
          <div className="nx-auth-field">
            <label className="nx-auth-label">Email</label>
            <input
              type="email"
              className="nx-auth-input"
              placeholder="contoh@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode === "register" && (
            <div className="nx-auth-field">
              <label className="nx-auth-label">Username</label>
              <input
                type="text"
                className="nx-auth-input"
                placeholder="Username kamu"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
                autoComplete="username"
              />
            </div>
          )}

          {(mode === "login" || mode === "register") && (
            <div className="nx-auth-field">
              <label className="nx-auth-label">Password</label>
              <div className="nx-auth-pass-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  className="nx-auth-input nx-auth-pass-input"
                  placeholder={mode === "login" ? "Password kamu" : "Min. 6 karakter"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  className="nx-auth-pass-toggle"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}

          {mode === "forgot" && (
            <div className="nx-auth-field">
              <label className="nx-auth-label">Password Baru</label>
              <div className="nx-auth-pass-wrap">
                <input
                  type={showNewPass ? "text" : "password"}
                  className="nx-auth-input nx-auth-pass-input"
                  placeholder="Min. 6 karakter"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="nx-auth-pass-toggle"
                  onClick={() => setShowNewPass(s => !s)}
                  tabIndex={-1}
                >
                  {showNewPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="nx-auth-error">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="nx-auth-submit" disabled={loading}>
            {loading ? (
              <span className="nx-auth-spinner" />
            ) : mode === "login" ? (
              "✓ Masuk"
            ) : mode === "register" ? (
              "✓ Daftar Sekarang"
            ) : (
              "🔑 Reset Password"
            )}
          </button>
        </form>

        {mode === "login" && (
          <div style={{ textAlign: "center", marginTop: 4, marginBottom: 8 }}>
            <button
              className="nx-auth-switch-btn"
              style={{ fontSize: 13, color: "#a78bfa", opacity: 0.8 }}
              onClick={goForgot}
              type="button"
            >
              Lupa password?
            </button>
          </div>
        )}

        {mode !== "forgot" ? (
          <div className="nx-auth-divider">
            <span>{mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}</span>
            <button className="nx-auth-switch-btn" onClick={switchMode}>
              {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
            </button>
          </div>
        ) : (
          <div className="nx-auth-divider">
            <span>Ingat password?</span>
            <button className="nx-auth-switch-btn" onClick={goLogin} type="button">
              Masuk di sini
            </button>
          </div>
        )}

        <a href="/" className="nx-auth-back-link">← Kembali ke beranda</a>
      </div>
    </div>
  );
}
