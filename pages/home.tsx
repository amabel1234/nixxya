import React from "react";
import { Show } from "@clerk/react";
import { Redirect } from "wouter";
import { useLocation } from "wouter";

export default function HomePage() {
  const [, navigate] = useLocation();

  return (
    <>
      <Show when="signed-in">
        <Redirect to="/chat" />
      </Show>

      <Show when="signed-out">
        <div className="nx-page-center">
          <div className="nx-welcome">
            <div className="nx-welcome-icon">🧠</div>
            <div>
              <div className="nx-welcome-title">
                Selamat datang di <span>Nixx AI</span>
              </div>
            </div>
            <p className="nx-welcome-desc">
              Asisten AI terpintar yang bisa bantu kamu belajar, nulis, coding, dan banyak lagi —
              <strong> gratis untuk semua!</strong>
            </p>
            <div className="nx-welcome-features">
              <div className="nx-welcome-feature">
                <span className="nx-welcome-feature-icon">🚀</span>
                <span><strong>26 Model AI</strong> pilihan — dari GPT-4o sampai Llama terbaru</span>
              </div>
              <div className="nx-welcome-feature">
                <span className="nx-welcome-feature-icon">💬</span>
                <span><strong>Bahasa Indonesia</strong> — AI yang ngerti bahasa sehari-hari</span>
              </div>
              <div className="nx-welcome-feature">
                <span className="nx-welcome-feature-icon">🆓</span>
                <span><strong>20 pesan/hari gratis</strong> — upgrade Premium untuk tanpa batas</span>
              </div>
            </div>
            <div className="nx-home-actions">
              <button className="nx-start-btn" onClick={() => navigate("/sign-up")}>
                ✨ Daftar Gratis
              </button>
              <button className="nx-login-btn" onClick={() => navigate("/sign-in")}>
                Sudah punya akun? Masuk
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
