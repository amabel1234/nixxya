import { useState } from "react";

interface WelcomeScreenProps {
  onPrompt?: (text: string) => void;
  disabled?: boolean;
}

const SAMPLE_PROMPTS = [
  { emoji: "📝", text: "Buatkan cerita pendek yang menarik" },
  { emoji: "💻", text: "Bantu saya belajar coding Python" },
  { emoji: "🎨", text: "Ide bisnis online yang menguntungkan" },
  { emoji: "📚", text: "Jelaskan konsep ini dengan mudah" },
];

export function WelcomeScreen({ onPrompt, disabled }: WelcomeScreenProps) {
  const [sending, setSending] = useState<string | null>(null);

  const handleClick = async (text: string) => {
    if (disabled || sending) return;
    setSending(text);
    try {
      await onPrompt?.(text);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500 max-w-md mx-auto w-full">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-5 shadow-lg"
        style={{ background: "linear-gradient(135deg, #7c3aed, #c026d3)" }}
      >
        🧠
      </div>

      <h2 className="text-2xl font-bold mb-1 text-white">
        Halo! Ada yang bisa{" "}
        <span className="nixx-gradient-text">dibantu?</span>
      </h2>
      <p className="text-sm mb-7" style={{ color: "hsl(248, 15%, 55%)" }}>
        Pilih salah satu pertanyaan di bawah atau ketik sendiri
      </p>

      <div className="grid grid-cols-1 gap-3 w-full">
        {SAMPLE_PROMPTS.map((p) => {
          const isActive = sending === p.text;
          return (
            <button
              key={p.text}
              onClick={() => handleClick(p.text)}
              disabled={!!disabled || !!sending}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: isActive
                  ? "rgba(124, 58, 237, 0.35)"
                  : "hsl(248, 28%, 13%)",
                border: isActive
                  ? "1px solid rgba(168, 85, 247, 0.6)"
                  : "1px solid hsl(248, 25%, 20%)",
                transform: isActive ? "scale(0.98)" : undefined,
              }}
            >
              {isActive ? (
                <span className="text-xl shrink-0 animate-spin">⏳</span>
              ) : (
                <span className="text-xl shrink-0">{p.emoji}</span>
              )}
              <span className="text-sm font-medium text-white leading-snug">
                {isActive ? "Mengirim..." : p.text}
              </span>
              {!isActive && (
                <span className="ml-auto text-purple-400 text-xs shrink-0">➤</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs" style={{ color: "hsl(248, 15%, 40%)" }}>
        ✨ Powered by Nixx AI — 26 model tersedia
      </p>
    </div>
  );
}
