import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Masukkan email kamu."); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 500));
    setLoading(false);

    try {
      const users: any[] = JSON.parse(localStorage.getItem("nx-users-db") ?? "[]");
      const found = users.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found) { setError("Email tidak terdaftar."); return; }
      setStep("reset");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPw || !confirmPw) { setError("Isi semua kolom."); return; }
    if (newPw !== confirmPw) { setError("Password tidak cocok."); return; }
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 400));
    const err = resetPassword(email.trim().toLowerCase(), newPw);
    setLoading(false);
    if (err) { setError(err); return; }
    setStep("done");
  };

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,.3) 0%,transparent 70%)", top: -80, left: -80, pointerEvents: "none" }} />

      <div style={S.card}>
        <div style={S.logoWrap}>
          <img src="https://iili.io/f7nDq8X.jpg" alt="Nixx AI" style={S.logo} onError={e => (e.currentTarget.style.display = "none")} />
          <div style={S.brand}>Nixx AI</div>
        </div>

        {/* ── Step 1: Masukkan email ── */}
        {step === "email" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔑</div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 16, marginBottom: 4 }}>Lupa Password?</div>
              <div style={{ color: "#9CA3AF", fontSize: 13 }}>Masukkan email yang kamu daftarkan.</div>
            </div>
            <form onSubmit={handleEmailStep} style={S.form}>
              <div style={S.field}>
                <label style={S.label}>Email</label>
                <input style={S.input} type="email" placeholder="email@kamu.com"
                  value={email} onChange={e => { setEmail(e.target.value); setError(""); }} autoFocus />
              </div>
              {error && <div style={S.errorBox}>⚠️ {error}</div>}
              <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Mencari..." : "Lanjut →"}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: Buat password baru ── */}
        {step === "reset" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 16, marginBottom: 4 }}>Buat Password Baru</div>
              <div style={{ color: "#9CA3AF", fontSize: 13 }}>untuk <strong style={{ color: "#C4B5FD" }}>{email}</strong></div>
            </div>
            <form onSubmit={handleReset} style={S.form}>
              <div style={S.field}>
                <label style={S.label}>Password Baru</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...S.input, paddingRight: 42 }} type={showPw ? "text" : "password"}
                    placeholder="minimal 6 karakter" value={newPw}
                    onChange={e => { setNewPw(e.target.value); setError(""); }} autoFocus />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={S.eyeBtn}>
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div style={S.field}>
                <label style={S.label}>Konfirmasi Password</label>
                <input style={S.input} type={showPw ? "text" : "password"}
                  placeholder="ketik ulang password" value={confirmPw}
                  onChange={e => { setConfirmPw(e.target.value); setError(""); }} />
              </div>
              {error && <div style={S.errorBox}>⚠️ {error}</div>}
              <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Menyimpan..." : "💾 Simpan Password Baru"}
              </button>
              <button type="button" onClick={() => { setStep("email"); setError(""); }}
                style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: "4px 0", textAlign: "center" as const }}>
                ← Kembali
              </button>
            </form>
          </>
        )}

        {/* ── Step 3: Berhasil ── */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, color: "#fff", fontSize: 17, marginBottom: 8 }}>Password Berhasil Diubah!</div>
            <div style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 24 }}>Sekarang kamu bisa login dengan password baru.</div>
            <a href="/sign-in" style={{
              display: "block", background: "linear-gradient(135deg,#7C3AED,#A855F7)",
              color: "#fff", borderRadius: 12, padding: "12px", fontWeight: 700,
              fontSize: 14, textDecoration: "none", textAlign: "center" as const,
            }}>
              🚀 Masuk Sekarang
            </a>
          </div>
        )}

        {step !== "done" && (
          <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 20, marginBottom: 0 }}>
            Ingat password?{" "}
            <a href="/sign-in" style={{ color: "#A78BFA", textDecoration: "none", fontWeight: 600 }}>Masuk →</a>
          </p>
        )}
      </div>
    </div>
  );
}

const CSS = `
  @keyframes nx-fadein { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
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
    animation: "nx-fadein .4s ease", position: "relative" as const, zIndex: 1,
  },
  logoWrap: { textAlign: "center" as const, marginBottom: 8 },
  logo: { width: 52, height: 52, borderRadius: "50%", objectFit: "cover" as const, marginBottom: 8, border: "2px solid rgba(124,58,237,.4)" },
  brand: { fontSize: "1.5rem", fontWeight: 900, background: "linear-gradient(135deg,#a78bfa,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 16 },
  form: { display: "flex", flexDirection: "column" as const, gap: 14 },
  field: { display: "flex", flexDirection: "column" as const, gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "#C4B5FD" },
  input: {
    background: "rgba(255,255,255,.06)", border: "1px solid rgba(124,58,237,.3)",
    borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none",
    fontFamily: "inherit", width: "100%",
  } as React.CSSProperties,
  eyeBtn: {
    position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 2,
  },
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
};
