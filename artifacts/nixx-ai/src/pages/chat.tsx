import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useClerk } from "@clerk/react";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  useGetUsage,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { useTheme } from "@/App";
import ChatSidebar from "@/components/chat-sidebar";
import ChatThread from "@/components/chat-thread";

export const MODELS = [
  { id: "deepseekv3", label: "Nixx AI",       badge: "Unggulan", icon: "🧠", off: false },
  { id: "christyai",  label: "Christy AI",    badge: "JKT48",    icon: "⭐", off: false },
  { id: "copilot",    label: "Copilot AI",    badge: "Microsoft",icon: "🤖", off: false },
  { id: "ripple",     label: "Ripple AI",     badge: "OFF",      icon: "🌊", off: true  },
  { id: "felo",       label: "Felo AI",       badge: "Baru",     icon: "🔍", off: false },
  { id: "turboseek",  label: "Turboseek AI",  badge: "Cepat",    icon: "🚀", off: false },
  { id: "perplexed",  label: "Perplexed AI",  badge: "Canggih",  icon: "❓", off: false },
  { id: "muslim",     label: "Muslim AI",     badge: "Islami",   icon: "🕌", off: false },
  { id: "gpt3",       label: "GPT-3",         badge: "OpenAI",   icon: "🤖", off: false },
  { id: "gpt4o",      label: "GPT-4o",        badge: "Terbaru",  icon: "🤖", off: false },
  { id: "perplexity", label: "Perplexity AI", badge: "Web",      icon: "🔍", off: false },
  { id: "groqmini",   label: "Groq Mini",     badge: "Cepat",    icon: "⚡", off: false },
  { id: "llama4",     label: "Llama-4 Scout", badge: "17B",      icon: "💻", off: false },
  { id: "llama33",    label: "Llama-3.3",     badge: "70B",      icon: "🌿", off: false },
  { id: "gemma",      label: "Gemma 7B",      badge: "Ringan",   icon: "💎", off: false },
  { id: "mistral",    label: "Mistral 7B",    badge: "v0.1",     icon: "🌬️", off: false },
  { id: "aoyo",       label: "Aoyo AI",       badge: "Baru",     icon: "💬", off: false },
  { id: "gptoss120",  label: "GPT-OSS 120B",  badge: "120B",     icon: "💻", off: false },
  { id: "gptoss20",   label: "GPT-OSS 20B",   badge: "20B",      icon: "💻", off: false },
  { id: "gemini25v1", label: "Gemini 2.5 v1", badge: "Flash",    icon: "🤖", off: false },
  { id: "gemini25v2", label: "Gemini 2.5 v2", badge: "Flash",    icon: "🤖", off: false },
  { id: "grok4fast",  label: "Grok 4 Fast",   badge: "Kilat",    icon: "⚡", off: false },
  { id: "grok3mini",  label: "Grok 3 Mini",   badge: "Mini",     icon: "⚡", off: false },
  { id: "grok3jail1", label: "Grok Jail v1",  badge: "JB",       icon: "🔓", off: false },
  { id: "grok3jail2", label: "Grok Jail v2",  badge: "JB",       icon: "🔓", off: false },
  { id: "venice",     label: "Venice AI",     badge: "Baru",     icon: "🌊", off: false },
];

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState("deepseekv3");

  const { isDark, toggle: toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const { signOut } = useClerk();

  const { data: conversations = [] } = useListOpenaiConversations();
  const { data: usage } = useGetUsage();
  const createConversation = useCreateOpenaiConversation();
  const deleteConversation = useDeleteOpenaiConversation();

  const isAtLimit = usage && usage.used >= usage.limit;

  const handleNewChat = () => {
    const activeModel = MODELS.find((m) => m.id === selectedModel);
    createConversation.mutate(
      { data: { title: `Percakapan — ${activeModel?.label ?? "Nixx AI"}` } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          setActiveConvId(newConv.id);
          setSidebarOpen(false);
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteConversation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        if (activeConvId === id) setActiveConvId(null);
      },
    });
  };

  return (
    <>
      <button className="nx-menu-toggle" onClick={() => setSidebarOpen((v) => !v)} aria-label="Buka sidebar">☰</button>
      <button className="nx-theme-toggle" onClick={toggleTheme} aria-label="Toggle tema">{isDark ? "☀️" : "🌙"}</button>

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
          onClearChat={() => { if (activeConvId && confirm("Hapus percakapan ini?")) handleDelete(activeConvId); }}
          onSelectModel={(m) => { setSelectedModel(m); setSidebarOpen(false); }}
          onSignOut={() => signOut({ redirectUrl: "/" })}
          usage={usage ?? null}
        />
      </div>

      <div className="nx-main">
        <header className="nx-header">
          <div className="nx-logo-container">
            <img src="https://iili.io/f7nDq8X.jpg" alt="Nixx AI" className="nx-logo-img" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="nx-logo-text">
              <div className="nx-logo">Nixx AI</div>
              <div className="nx-tagline">26 Model AI · Gratis Selamanya ✨</div>
            </div>
          </div>
        </header>

        {isAtLimit && (
          <div className="nx-usage-banner" style={{ background: "linear-gradient(135deg, #fee2e2, #fecaca)", borderColor: "#ef4444", color: "#7f1d1d" }}>
            <span>❌ Batas 20 pesan/hari tercapai. Coba lagi besok!</span>
          </div>
        )}

        <div className="nx-chat-container">
          {activeConvId ? (
            <ChatThread conversationId={activeConvId} selectedModel={selectedModel} onLimitReached={() => {}} />
          ) : (
            <div className="nx-welcome">
              <div className="nx-welcome-icon">🧠</div>
              <div className="nx-welcome-title">Selamat datang di <span>Nixx AI</span></div>
              <p className="nx-welcome-desc">
                Asisten AI terpintar dalam Bahasa Indonesia. Belajar, nulis, coding, dan banyak lagi —
                <strong> gratis 20 pesan/hari!</strong>
              </p>
              <div className="nx-welcome-features">
                <div className="nx-welcome-feature">
                  <span className="nx-welcome-feature-icon">🚀</span>
                  <span><strong>26 Model AI</strong> — dari GPT-4o sampai Llama terbaru</span>
                </div>
                <div className="nx-welcome-feature">
                  <span className="nx-welcome-feature-icon">💬</span>
                  <span><strong>Bahasa Indonesia</strong> — AI yang ngerti bahasa sehari-hari</span>
                </div>
                <div className="nx-welcome-feature">
                  <span className="nx-welcome-feature-icon">💾</span>
                  <span><strong>Riwayat tersimpan</strong> — percakapan kamu aman di akun</span>
                </div>
              </div>
              <button className="nx-start-btn" onClick={handleNewChat} disabled={isAtLimit ?? false}>
                {isAtLimit ? "❌ Batas Harian Tercapai — Coba Besok" : "✨ Mulai Chat Sekarang"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
