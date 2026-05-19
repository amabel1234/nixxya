import { Link } from "wouter";
import { useTheme } from "@/App";

export default function LandingPage() {
  const { isDark, toggle } = useTheme();

  return (
    <div className="nx-landing">
      <button className="nx-theme-toggle" onClick={toggle} aria-label="Toggle tema">
        {isDark ? "☀️" : "🌙"}
      </button>

      <div className="nx-landing-logo">🧠</div>

      <div>
        <div className="nx-landing-title">Nixx AI</div>
        <div style={{ fontSize: "1rem", color: "var(--text-muted)", marginTop: 6, fontWeight: 600 }}>
          26 Model AI · Gratis Selamanya ✨
        </div>
      </div>

      <p className="nx-landing-subtitle">
        Asisten AI terpintar dalam <strong>Bahasa Indonesia</strong>. Belajar, nulis, coding, tanya apa saja
        — didukung 26 model AI terbaik dunia, gratis tanpa batas!
      </p>

      <div className="nx-landing-ctas">
        <Link to="/sign-up" className="nx-cta-primary">
          🚀 Mulai Gratis Sekarang
        </Link>
        <Link to="/sign-in" className="nx-cta-secondary">
          Sudah punya akun? Masuk
        </Link>
      </div>

      <div className="nx-landing-features">
        <div className="nx-feature-card">
          <div className="nx-feature-icon">🤖</div>
          <div className="nx-feature-title">26 Model AI</div>
          <div className="nx-feature-desc">GPT-4o, Llama, Gemini, Grok, dan banyak lagi — semua dalam satu platform</div>
        </div>
        <div className="nx-feature-card">
          <div className="nx-feature-icon">💬</div>
          <div className="nx-feature-title">Bahasa Indonesia</div>
          <div className="nx-feature-desc">AI yang ngerti cara bicara orang Indonesia, santai dan natural</div>
        </div>
        <div className="nx-feature-card">
          <div className="nx-feature-icon">💾</div>
          <div className="nx-feature-title">Riwayat Chat</div>
          <div className="nx-feature-desc">Semua percakapan tersimpan otomatis, bisa dilanjutkan kapan saja</div>
        </div>
        <div className="nx-feature-card">
          <div className="nx-feature-icon">⚡</div>
          <div className="nx-feature-title">Cepat & Gratis</div>
          <div className="nx-feature-desc">Respons instan dari model AI terbaik, tanpa biaya, tanpa kartu kredit</div>
        </div>
      </div>

      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 10 }}>
        Gratis 20 pesan/hari · Tanpa kartu kredit · Mulai dalam 30 detik
      </div>
    </div>
  );
}
