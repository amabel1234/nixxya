import React, { useEffect } from "react";
import { useLocation } from "wouter";

interface PremiumPopupProps {
  show: boolean;
  onClose: () => void;
  count?: number;
  limit?: number;
}

export default function PremiumPopup({ show, onClose, count, limit }: PremiumPopupProps) {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [show]);

  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 9998,
          animation: "ppFadeIn 0.25s ease",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "min(90vw, 360px)",
          background: "linear-gradient(145deg, #1a1730 0%, #13102a 100%)",
          borderRadius: "24px",
          border: "1.5px solid rgba(124,58,237,0.5)",
          boxShadow: "0 0 40px rgba(124,58,237,0.35), 0 20px 60px rgba(0,0,0,0.6)",
          padding: "32px 28px",
          textAlign: "center",
          animation: "ppSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Glow effect */}
        <div style={{
          position: "absolute",
          top: "-1px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60%",
          height: "2px",
          background: "linear-gradient(90deg, transparent, #7c3aed, #a855f7, #7c3aed, transparent)",
          borderRadius: "2px",
        }} />

        {/* Crown */}
        <div style={{ fontSize: 56, marginBottom: 16, filter: "drop-shadow(0 4px 12px rgba(250,204,21,0.4))", lineHeight: 1 }}>
          👑
        </div>

        {/* Title */}
        <h2 style={{
          color: "#ffffff",
          fontSize: "22px",
          fontWeight: 800,
          margin: "0 0 10px",
          letterSpacing: "-0.3px",
        }}>
          Limit Harian Habis!
        </h2>

        {/* Description */}
        <p style={{
          color: "#a89dc4",
          fontSize: "14px",
          lineHeight: 1.6,
          margin: "0 0 8px",
        }}>
          Kamu sudah mencapai batas pesan gratis hari ini.
          Upgrade ke <span style={{ color: "#c4b5fd", fontWeight: 600 }}>Premium</span> untuk
          kirim pesan <span style={{ color: "#c4b5fd", fontWeight: 600 }}>unlimited!</span>
        </p>

        {/* Counter badge */}
        {count !== undefined && limit !== undefined && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: "100px",
            padding: "5px 14px",
            marginBottom: 24,
            fontSize: 13,
            color: "#c4b5fd",
            fontWeight: 600,
          }}>
            <span style={{ fontSize: 10, opacity: 0.7 }}>⚡</span>
            {count}/{limit} pesan terpakai hari ini
          </div>
        )}

        {!count && <div style={{ marginBottom: 24 }} />}

        {/* Features mini-list */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 22,
          textAlign: "left",
        }}>
          {[
            { icon: "♾️", text: "Pesan unlimited tanpa batas" },
            { icon: "🤖", text: "Akses semua 26 model AI premium" },
            { icon: "⚡", text: "Respons lebih cepat & prioritas" },
          ].map((f, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "5px 0",
              color: "#d4cce8",
              fontSize: 13,
              borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
              <span style={{ fontSize: 16 }}>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <button
          onClick={() => navigate("/premium")}
          style={{
            width: "100%",
            padding: "14px",
            background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #7c3aed 100%)",
            backgroundSize: "200% 100%",
            border: "none",
            borderRadius: "14px",
            color: "#fff",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 10,
            boxShadow: "0 4px 20px rgba(124,58,237,0.45)",
            letterSpacing: "0.2px",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(124,58,237,0.6)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(124,58,237,0.45)";
          }}
        >
          ✨ Upgrade ke Premium
        </button>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "13px",
            background: "rgba(255,255,255,0.06)",
            border: "1.5px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            color: "#a89dc4",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            (e.currentTarget as HTMLButtonElement).style.color = "#a89dc4";
          }}
        >
          Lanjut Gratis
        </button>

        {/* Small note */}
        <p style={{ color: "#6b6080", fontSize: 11, marginTop: 12, margin: "12px 0 0" }}>
          Limit reset setiap hari pukul 00:00 WIB
        </p>
      </div>

      <style>{`
        @keyframes ppFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ppSlideUp {
          from { opacity: 0; transform: translate(-50%, -40%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
