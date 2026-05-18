import React from "react";

const SAMPLE_PROMPTS = [
  { emoji: "📝", text: "Buatkan cerita pendek yang menarik" },
  { emoji: "💻", text: "Bantu saya belajar coding Python" },
  { emoji: "🎨", text: "Ide bisnis online yang menguntungkan" },
  { emoji: "📚", text: "Jelaskan konsep ini dengan mudah" },
];

interface WelcomeScreenProps {
  onPrompt?: (text: string) => void;
}

export function WelcomeScreen({ onPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-8 text-center w-full max-w-sm mx-auto">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-5 shadow-xl"
        style={{ background: "linear-gradient(135deg, #7c3aed, #c026d3)", boxShadow: "0 6px 30px rgba(124,58,237,0.4)" }}>
        🧠
      </div>
      <h2 className="text-2xl font-extrabold mb-2 text-white leading-tight">
        Halo! Ada yang bisa dibantu?
      </h2>
      <p className="text-sm mb-7" style={{ color: "hsl(248, 15%, 55%)" }}>
        Pilih salah satu pertanyaan di bawah atau ketik sendiri
      </p>
      <div className="w-full space-y-2.5">
        {SAMPLE_PROMPTS.map((p) => (
          <button
            key={p.text}
            onClick={() => onPrompt?.(p.text)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all hover:scale-[1.02] hover:opacity-90 active:scale-[0.98]"
            style={{ background: "hsl(248, 28%, 11%)", border: "1px solid hsl(248, 25%, 19%)" }}>
            <span className="text-xl shrink-0">{p.emoji}</span>
            <span className="text-sm font-medium text-white">{p.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
