import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { useTheme } from "@/App";
import ChatSidebar from "@/components/chat-sidebar";
import ChatThread from "@/components/chat-thread";

const MODELS = [
  { id: "deepseekv3", label: "Nixx AI",        badge: "Fast",      icon: "🧠", off: false },
  { id: "christyai",  label: "Christy AI",     badge: "JKT48",     icon: "⭐", off: false },
  { id: "copilot",    label: "Copilot AI",     badge: "Microsoft", icon: "🤖", off: false },
  { id: "ripple",     label: "Ripple AI",      badge: "OFF",       icon: "🌊", off: true  },
  { id: "felo",       label: "Felo AI",        badge: "New",       icon: "🔍", off: false },
  { id: "turboseek",  label: "Turboseek AI",   badge: "Fast",      icon: "🚀", off: false },
  { id: "perplexed",  label: "Perplexed AI",   badge: "Advanced",  icon: "❓", off: false },
  { id: "muslim",     label: "Muslim AI",      badge: "Religious", icon: "🕌", off: false },
  { id: "gpt3",       label: "GPT-3",          badge: "OpenAI",    icon: "🤖", off: false },
  { id: "gpt4o",      label: "GPT-4o",         badge: "Latest",    icon: "🤖", off: false },
  { id: "perplexity", label: "Perplexity AI",  badge: "Web",       icon: "🔍", off: false },
  { id: "groqmini",   label: "Groq Mini",      badge: "Fast",      icon: "⚡", off: false },
  { id: "llama4",     label: "Llama-4 Scout",  badge: "17B",       icon: "💻", off: false },
  { id: "llama33",    label: "Llama-3.3",      badge: "70B",       icon: "🌿", off: false },
  { id: "gemma",      label: "Gemma 7B",       badge: "Light",     icon: "💎", off: false },
  { id: "mistral",    label: "Mistral 7B",     badge: "v0.1",      icon: "🌬️", off: false },
  { id: "aoyo",       label: "Aoyo AI",        badge: "New",       icon: "💬", off: false },
  { id: "gptoss120",  label: "GPT-OSS 120B",   badge: "120B",      icon: "💻", off: false },
  { id: "gptoss20",   label: "GPT-OSS 20B",    badge: "20B",       icon: "💻", off: false },
  { id: "gemini25v1", label: "Gemini 2.5 v1",  badge: "Flash",     icon: "🤖", off: false },
  { id: "gemini25v2", label: "Gemini 2.5 v2",  badge: "Flash",     icon: "🤖", off: false },
  { id: "grok4fast",  label: "Grok 4 Fast",    badge: "Fast",      icon: "⚡", off: false },
  { id: "grok3mini",  label: "Grok 3 Mini",    badge: "Mini",      icon: "⚡", off: false },
  { id: "grok3jail1", label: "Grok Jail v1",   badge: "JB",        icon: "🔓", off: false },
  { id: "grok3jail2", label: "Grok Jail v2",   badge: "JB",        icon: "🔓", off: false },
  { id: "venice",     label: "Venice AI",      badge: "New",       icon: "🌊", off: false },
];

export { MODELS };

const ANIM_CSS = `
  @keyframes nxFloatA {
    0%,100% { transform: translate(0,0) scale(1); }
    40% { transform: translate(35px,-45px) scale(1.12); }
    75% { transform: translate(-20px,25px) scale(0.92); }
  }
  @keyframes nxFloatB {
    0%,100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(-45px,-30px) scale(1.18); }
  }
  @keyframes nxFloatC {
    0%,100% { transform: translate(0,0); }
    33% { transform: translate(20px,-35px); }
    66% { transform: translate(-25px,20px); }
  }
  @keyframes nxSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nxGlow {
    0%,100% { box-shadow: 0 8px 32px rgba(124,58,237,.55), 0 2px 12px rgba(0,0,0,.25); }
    50%     { box-shadow: 0 12px 44px rgba(124,58,237,.85), 0 0 60px rgba(236,72,153,.25); }
  }
  @keyframes nxSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .nx-cta-main {
    animation: nxSlideUp .5s ease .35s both, nxGlow 2.8s ease-in-out 1s infinite;
    transition: transform .18s ease, opacity .18s;
  }
  .nx-cta-main:hover:not(:disabled) { transform: translateY(-3px) !important; opacity: .95; }
  .nx-cta-main:active:not(:disabled) { transform: translateY(0) !important; }
  .nx-cta-main:disabled { animation: none !important; opacity: .6; cursor: wait; }
  .nx-model-pill { transition: all .15s; }
  .nx-model-pill:hover { opacity: 1 !important; }
`;

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState("deepseekv3");
  const [createError, setCreateError] = useState<string | null>(null);

  const { isDark, toggle: toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();
  const deleteConversation = useDeleteOpenaiConversation();

  const handleNewChat = () => {
    if (createConversation.isPending) return;
    setCreateError(null);
    const activeModel = MODELS.find((m) => m.id === selectedModel);
    createConversation.mutate(
      { data: { title: `Percakapan — ${activeModel?.label ?? "Nixx AI"}` } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          setActiveConvId(newConv.id);
          setSidebarOpen(false);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Gagal membuat percakapan";
          setCreateError(msg);
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteConversation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          if (activeConvId === id) setActiveConvId(null);
        },
      }
    );
  };

  const handleClearChat = () => {
    if (!activeConvId) return;
    if (confirm("Hapus percakapan ini?")) handleDelete(activeConvId);
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setSidebarOpen(false);
  };

  const activeModel = MODELS.find(m => m.id === selectedModel);
  const availableModels = MODELS.filter(m => !m.off);
  const isCreating = createConversation.isPending;

  return (
    <>
      <style>{ANIM_CSS}</style>

      <button className="nx-menu-toggle" onClick={() => setSidebarOpen((v) => !v)} aria-label="Buka sidebar">
        ☰
      </button>
      <button className="nx-theme-toggle" onClick={toggleTheme} aria-label="Toggle tema">
        {isDark ? "☀️" : "🌙"}
      </button>

      <div className={`nx-sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div className={`nx-sidebar ${sidebarOpen ? "active" : ""}`}>
        <ChatSidebar
          conversations={conversations}
          activeId={activeConvId}
          selectedModel={selectedModel}
          models={MODELS}
          onSelect={(id) => { setActiveConvId(id); setSidebarOpen(false); }}
          onNewChat={handleNewChat}
          onDelete={handleDelete}
          onClearChat={handleClearChat}
          onSelectModel={handleSelectModel}
        />
      </div>

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
              <div className="nx-tagline">
                {activeModel
                  ? `${activeModel.icon} ${activeModel.label} · ${activeModel.badge}`
                  : "26 AI Models · Gratis Selamanya ✨"}
              </div>
            </div>
          </div>
        </header>

        <div className="nx-chat-container">
          {activeConvId ? (
            <ChatThread conversationId={activeConvId} selectedModel={selectedModel} />
          ) : (
            /* ── NEW BEAUTIFUL WELCOME SCREEN ───────────────── */
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", overflow: "hidden", padding: "16px",
            }}>
              {/* Animated background orbs */}
              <div style={{
                position: "absolute", width: 360, height: 360, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(124,58,237,.28) 0%, transparent 70%)",
                top: "-100px", left: "-100px",
                animation: "nxFloatA 9s ease-in-out infinite", pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", width: 300, height: 300, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(59,130,246,.22) 0%, transparent 70%)",
                bottom: "-70px", right: "-70px",
                animation: "nxFloatB 12s ease-in-out infinite", pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", width: 220, height: 220, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(236,72,153,.18) 0%, transparent 70%)",
                top: "35%", right: "5%",
                animation: "nxFloatC 15s ease-in-out infinite", pointerEvents: "none",
              }} />

              {/* Main content */}
              <div style={{
                position: "relative", zIndex: 1,
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 16, maxWidth: 480, width: "100%", textAlign: "center",
              }}>

                {/* Avatar + Brand */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, animation: "nxSlideUp .5s ease both" }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
                    background: "linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)",
                    boxShadow: "0 0 28px rgba(124,58,237,.65), 0 0 60px rgba(124,58,237,.2)",
                    border: "2.5px solid rgba(255,255,255,.2)", flexShrink: 0,
                  }}>
                    <img
                      src="https://iili.io/f7nDq8X.jpg" alt="Nixx"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <span style={{
                    fontSize: "1.9rem", fontWeight: 900, letterSpacing: "-.5px",
                    background: "linear-gradient(135deg,#a78bfa 0%,#f472b6 50%,#60a5fa 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}>Nixx AI</span>
                </div>

                {/* Hero headline */}
                <div style={{ animation: "nxSlideUp .5s ease .08s both" }}>
                  <h2 style={{ color: "var(--nx-text)", fontSize: "1.35rem", fontWeight: 800, margin: "0 0 6px", lineHeight: 1.3 }}>
                    Apa yang bisa saya bantu hari ini?
                  </h2>
                  <p style={{ color: "var(--nx-text-muted)", fontSize: ".85rem", margin: 0 }}>
                    26 model AI terbaik · Gratis selamanya · Bahasa Indonesia
                  </p>
                </div>

                {/* Feature badges */}
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center", animation: "nxSlideUp .5s ease .16s both" }}>
                  {([["⚡","Super Cepat"],["🔒","Privat"],["🆓","Gratis"],["🇮🇩","Indonesia"]] as [string,string][]).map(([icon,lbl]) => (
                    <span key={lbl} style={{
                      background: "var(--nx-ai-bubble)", border: "1px solid var(--nx-border)",
                      borderRadius: 20, padding: "4px 12px", fontSize: ".76rem",
                      color: "var(--nx-text-muted)", display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      {icon} {lbl}
                    </span>
                  ))}
                </div>

                {/* Active model indicator */}
                <div style={{
                  background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.28)",
                  borderRadius: 10, padding: "9px 16px",
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: ".82rem", color: "var(--nx-text)", width: "100%",
                  animation: "nxSlideUp .5s ease .22s both",
                }}>
                  <span style={{ fontSize: "1.1rem" }}>{activeModel?.icon}</span>
                  <span>Model aktif: <strong style={{ color: "#a78bfa" }}>{activeModel?.label}</strong></span>
                  <span style={{ marginLeft: "auto", color: "var(--nx-text-muted)", fontSize: ".73rem" }}>Ganti dari ☰</span>
                </div>

                {/* CTA Button */}
                <button
                  className="nx-cta-main"
                  onClick={handleNewChat}
                  disabled={isCreating}
                  style={{
                    background: "linear-gradient(135deg,#7c3aed 0%,#a855f7 55%,#ec4899 100%)",
                    color: "#fff", border: "none", borderRadius: 14,
                    padding: "14px 32px", fontSize: "1rem", fontWeight: 700,
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 9,
                    minWidth: 220, width: "100%", maxWidth: 320, justifyContent: "center",
                    letterSpacing: ".2px", fontFamily: "inherit",
                  }}
                >
                  {isCreating
                    ? <><span style={{ animation: "nxSpin 1s linear infinite", display: "inline-block" }}>⏳</span> Membuat...</>
                    : <><span>✨</span> Mulai Percakapan</>}
                </button>

                {/* Error feedback */}
                {createError && (
                  <div style={{
                    background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)",
                    borderRadius: 10, padding: "9px 14px",
                    color: "#fca5a5", fontSize: ".81rem", width: "100%",
                    display: "flex", alignItems: "center", gap: 8,
                    animation: "nxSlideUp .3s ease",
                  }}>
                    <span>⚠️ {createError}</span>
                    <button onClick={() => setCreateError(null)} style={{
                      marginLeft: "auto", background: "none", border: "none",
                      color: "inherit", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 0,
                    }}>×</button>
                  </div>
                )}

                {/* Quick model selector */}
                <div style={{ width: "100%", animation: "nxSlideUp .5s ease .38s both" }}>
                  <p style={{
                    color: "var(--nx-text-muted)", fontSize: ".7rem", margin: "0 0 7px",
                    textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, textAlign: "left",
                  }}>Model Tersedia:</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {availableModels.slice(0, 9).map(m => (
                      <button
                        key={m.id}
                        className="nx-model-pill"
                        onClick={() => setSelectedModel(m.id)}
                        style={{
                          background: selectedModel === m.id ? "rgba(124,58,237,.28)" : "var(--nx-ai-bubble)",
                          border: selectedModel === m.id ? "1px solid rgba(124,58,237,.55)" : "1px solid var(--nx-border)",
                          borderRadius: 8, padding: "4px 10px", fontSize: ".73rem",
                          color: selectedModel === m.id ? "#c4b5fd" : "var(--nx-text-muted)",
                          cursor: "pointer", fontFamily: "inherit",
                          opacity: selectedModel === m.id ? 1 : .75,
                        }}
                      >
                        {m.icon} {m.label}
                      </button>
                    ))}
                    {availableModels.length > 9 && (
                      <span style={{ fontSize: ".73rem", color: "var(--nx-text-muted)", alignSelf: "center" }}>
                        +{availableModels.length - 9} lagi
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
