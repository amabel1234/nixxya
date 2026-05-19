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
  return (
    <div
      className="flex flex-col items-center text-center max-w-sm mx-auto w-full"
      style={{ padding: "16px 8px" }}
    >
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
      <p className="text-sm mb-6" style={{ color: "hsl(248, 15%, 55%)" }}>
        Pilih salah satu pertanyaan di bawah atau ketik sendiri
      </p>

      <div className="w-full" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {SAMPLE_PROMPTS.map((p) => (
          <button
            key={p.text}
            type="button"
            onClick={() => {
              if (!disabled && onPrompt) {
                onPrompt(p.text);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 16px",
              borderRadius: "16px",
              textAlign: "left",
              width: "100%",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              background: "hsl(248, 28%, 13%)",
              border: "1px solid hsl(248, 25%, 20%)",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "rgba(0,0,0,0)",
              userSelect: "none",
              transition: "background 0.15s, border-color 0.15s",
            }}
            onTouchStart={(e) => {
              const el = e.currentTarget;
              el.style.background = "rgba(124, 58, 237, 0.3)";
              el.style.borderColor = "rgba(168, 85, 247, 0.6)";
            }}
            onTouchEnd={(e) => {
              const el = e.currentTarget;
              el.style.background = "hsl(248, 28%, 13%)";
              el.style.borderColor = "hsl(248, 25%, 20%)";
            }}
            onMouseDown={(e) => {
              const el = e.currentTarget;
              el.style.background = "rgba(124, 58, 237, 0.3)";
              el.style.borderColor = "rgba(168, 85, 247, 0.6)";
            }}
            onMouseUp={(e) => {
              const el = e.currentTarget;
              el.style.background = "hsl(248, 28%, 13%)";
              el.style.borderColor = "hsl(248, 25%, 20%)";
            }}
          >
            <span style={{ fontSize: "20px", flexShrink: 0 }}>{p.emoji}</span>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "white", lineHeight: "1.4" }}>
              {p.text}
            </span>
            <span style={{ marginLeft: "auto", color: "#a855f7", fontSize: "12px", flexShrink: 0 }}>➤</span>
          </button>
        ))}
      </div>

      <p className="mt-5 text-xs" style={{ color: "hsl(248, 15%, 40%)" }}>
        ✨ Powered by Nixx AI — 26 model tersedia
      </p>
    </div>
  );
}
