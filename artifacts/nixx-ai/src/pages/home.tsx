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
        <div className="nx-landing">
          <div className="nx-landing-inner">
            <div className="nx-landing-icon">🧠</div>
            <h1 className="nx-landing-title">
              Halo! Ada yang bisa <span>dibantu?</span>
            </h1>
            <p className="nx-landing-sub">
              Pilih salah satu atau ketik pertanyaanmu sendiri
            </p>

            <div className="nx-landing-suggestions">
              <button className="nx-landing-card" onClick={() => navigate("/sign-up")}>
                ✍️ Bantu nulis essay atau artikel yang menarik
              </button>
              <button className="nx-landing-card" onClick={() => navigate("/sign-up")}>
                💡 Jelaskan konsep yang susah dengan cara mudah
              </button>
              <button className="nx-landing-card" onClick={() => navigate("/sign-up")}>
                🐍 Ajarkan cara coding Python yang menguntungkan
              </button>
              <button className="nx-landing-card" onClick={() => navigate("/sign-up")}>
                🤝 Bantu buat bisnis online dengan mudah
              </button>
            </div>

            <div className="nx-landing-actions">
              <button className="nx-start-btn" onClick={() => navigate("/sign-up")}>
                ✨ Mulai Gratis
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
