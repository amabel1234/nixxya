import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function LandingPage() {
  const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(248, 30%, 6%)" }}>
      <div
        className="w-full px-4 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #c026d3 100%)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="font-bold text-white text-lg">Nixx AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="text-white/90 text-sm font-medium px-4 py-1.5 rounded-full border border-white/30 hover:bg-white/10 transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/sign-up"
            className="text-white text-sm font-bold px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            Daftar
          </Link>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[100px] pointer-events-none"
          style={{ background: "radial-gradient(circle, #a855f7, #7c3aed, transparent)" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm text-center relative z-10"
        >
          <div className="flex justify-center mb-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #7c3aed, #c026d3)" }}
            >
              🧠
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-3 leading-tight text-white">
            Selamat datang di{" "}
            <span style={{
              background: "linear-gradient(135deg, #a855f7, #c026d3)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Nixx AI
            </span>
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "hsl(248, 15%, 60%)" }}>
            Asisten AI terpintar yang bisa bantu kamu belajar, nulis, coding, dan banyak lagi —{" "}
            <span className="font-bold" style={{ color: "#a855f7" }}>gratis tanpa batas!</span>
          </p>

          <div className="space-y-3 mb-8">
            {[
              { emoji: "🚀", title: "26 Model AI pilihan", desc: "dari GPT-4o sampai Llama terbaru" },
              { emoji: "💬", title: "Bahasa Indonesia", desc: "AI yang ngerti bahasa sehari-hari" },
              { emoji: "🔒", title: "Aman & Terpercaya", desc: "akun pribadi, percakapan tersimpan" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                style={{ background: "hsl(248, 28%, 13%)", border: "1px solid hsl(248, 25%, 20%)" }}
              >
                <span className="text-2xl shrink-0">{item.emoji}</span>
                <div>
                  <span className="font-semibold text-sm text-white">{item.title}</span>
                  <span className="text-sm" style={{ color: "hsl(248, 15%, 60%)" }}> — {item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/sign-up"
            className="block w-full py-4 rounded-full text-white font-bold text-lg text-center shadow-lg transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7, #c026d3)" }}
          >
            ✨ Mulai Chat Sekarang
          </Link>
          <p className="mt-4 text-xs" style={{ color: "hsl(248, 15%, 50%)" }}>
            Sudah punya akun?{" "}
            <Link href="/sign-in" className="font-semibold" style={{ color: "#a855f7" }}>
              Masuk di sini
            </Link>
          </p>
        </motion.div>
      </main>

      <div
        className="text-center py-3 text-xs"
        style={{ color: "hsl(248, 15%, 40%)", borderTop: "1px solid hsl(248, 25%, 14%)" }}
      >
        © 2026 Nixx AI — Gratis Selamanya ✨
      </div>
    </div>
  );
}
