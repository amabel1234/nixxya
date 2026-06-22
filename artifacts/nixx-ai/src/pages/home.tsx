import React, { useState } from "react";
import { Show } from "@clerk/react";
import { Redirect, useLocation } from "wouter";
import { useTheme } from "@/App";

const SUGGESTIONS = [
  "✍️ Bantu nulis essay atau artikel yang menarik",
  "💡 Jelaskan konsep yang susah dengan cara mudah",
  "🐍 Ajarkan cara coding Python yang menguntungkan",
  "🤝 Bantu buat bisnis online dengan mudah",
];

export default function HomePage() {
  const [, navigate] = useLocation();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [inputVal, setInputVal] = useState("");

  const goLogin = () => navigate("/sign-in");
  const goSignup = () => navigate("/sign-up");

  return (
    <>
      <Show when="signed-in">
        <Redirect to="/chat" />
      </Show>

      <Show when="signed-out">
        <button className="nx-menu-toggle" onClick={goLogin} aria-label="Masuk">
          ☰
        </button>
        <button className="nx-theme-toggle" onClick={toggleTheme} aria-label="Toggle tema">
          {isDark ? "☀️" : "🌙"}
        </button>

        <div className="nx-main">
          <header className="nx-header">
            <div className="nx-logo-container">
              <img
                src="https://iili.io/f7nDq8X.jpg"
                alt="Nixx AI"
                className="nx-logo-img"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="nx-logo-text">
                <div className="nx-logo">Nixx AI</div>
                <div className="nx-tagline">Asisten AI gratis untuk semua</div>
              </div>
            </div>
          </header>

          <div className="nx-chat-container">
            <div className="nx-welcome">
              <div className="nx-welcome-icon">🧠</div>
              <div>
                <div className="nx-welcome-title">
                  Halo! Ada yang bisa <span>dibantu?</span>
                </div>
              </div>
              <p className="nx-welcome-desc">
                Pilih salah satu pertanyaan di bawah atau ketik sendiri
              </p>
              <div className="nx-welcome-features">
                {SUGGESTIONS.map((s) => (
                  <div key={s} className="nx-welcome-feature nx-welcome-feature--btn" onClick={goSignup}>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="nx-input-area" onClick={goSignup}>
            <div className="nx-input-row">
              <input
                className="nx-input"
                placeholder="Ketik pesan Anda di sini..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                readOnly
              />
              <button className="nx-send-btn" onClick={goSignup}>
                ➤ KIRIM
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
