import React from "react";
import { useClerk } from "@clerk/clerk-react";

const FEATURES = [
  { emoji: "🚀", title: "26 Model AI Gratis", desc: "Nixx AI, Grok, Gemini, Llama, GPT — semua tersedia tanpa biaya apapun." },
  { emoji: "💬", title: "Chat Natural", desc: "Bahasa Indonesia yang santai dan mudah dimengerti, bukan robot kaku." },
  { emoji: "⚡", title: "Super Cepat", desc: "Streaming real-time, respons langsung terasa instan tanpa loading lama." },
  { emoji: "🔒", title: "Aman & Privat", desc: "Data percakapanmu tersimpan aman dan tidak dibagikan ke pihak manapun." },
];

export default function LandingPage() {
  const { openSignIn, openSignUp } = useClerk();

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "hsl(248, 35%, 5%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3"
        style={{ background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a21caf 100%)", boxShadow: "0 2px 20px rgba(124,58,237,0.4)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
            🧠
          </div>
          <span className="text-white font-extrabold text-lg tracking-tight">Nixx AI</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openSignIn()}
            className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:bg-white/20"
            style={{ border: "1px solid rgba(255,255,255,0.3)" }}>
            Masuk
          </button>
          <button
            onClick={() => openSignUp()}
            className="px-4 py-2 rounded-full text-sm font-bold text-purple-900 transition-all hover:opacity-90"
            style={{ background: "white" }}>
            Daftar
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-5 pt-12 pb-8 text-center">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #7c3aed, #c026d3)", boxShadow: "0 8px 40px rgba(124,58,237,0.5)" }}>
          🧠
        </div>

        <h1 className="text-3xl font-extrabold text-white leading-tight mb-3 max-w-xs">
          Selamat datang di{" "}
          <span style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Nixx AI
          </span>
        </h1>

        <p className="text-sm mb-2 max-w-xs" style={{ color: "hsl(248, 20%, 65%)" }}>
          Asisten AI pintar gratis selamanya — 26 model AI dalam satu platform!
        </p>
        <p className="text-xs mb-8 font-medium" style={{ color: "#a855f7" }}>
          ✨ Tanpa biaya · Tanpa iklan · Selamanya gratis
        </p>

        <button
          onClick={() => openSignUp()}
          className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-base mb-4 transition-all hover:opacity-90 active:scale-[0.97] shadow-xl"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 4px 24px rgba(124,58,237,0.45)" }}>
          ✨ Mulai Chat Sekarang
        </button>

        <p className="text-sm" style={{ color: "hsl(248, 20%, 55%)" }}>
          Sudah punya akun?{" "}
          <button onClick={() => openSignIn()} className="font-semibold hover:underline" style={{ color: "#a855f7" }}>
            Masuk di sini
          </button>
        </p>

        {/* Features */}
        <div className="w-full max-w-sm mt-10 space-y-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-4 px-4 py-4 rounded-2xl text-left"
              style={{ background: "hsl(248, 28%, 10%)", border: "1px solid hsl(248, 25%, 17%)" }}>
              <span className="text-2xl shrink-0">{f.emoji}</span>
              <div>
                <p className="text-sm font-bold text-white">{f.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(248, 15%, 55%)" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Model pills */}
        <div className="w-full max-w-sm mt-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "hsl(248, 15%, 40%)" }}>
            Model Tersedia
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Nixx AI","Christy AI","Grok 4","Gemini 2.5","GPT-4o","Llama-4","Mistral","Copilot","Muslim AI","Venice AI","+ 16 lagi"].map((m) => (
              <span key={m} className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.2)", color: "#a855f7" }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-10 text-xs" style={{ color: "hsl(248, 15%, 38%)" }}>
          © 2025 Nixx AI · by Nixx Team · t.me/nixsukakamu
        </p>
      </main>
    </div>
  );
}
