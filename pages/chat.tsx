import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Show, useClerk, useUser } from "@clerk/react";
import { useLocation } from "wouter";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { useTheme } from "@/App";
import { useUserInfo } from "@/hooks/use-user-info";
import ChatSidebar from "@/components/chat-sidebar";
import ChatThread from "@/components/chat-thread";

const MODELS = [
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

export { MODELS };

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState("deepseekv3");
  const [limitReached, setLimitReached] = useState(false);

  const { isDark, toggle: toggleTheme } = useTheme();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: userInfo, refetch: refetchUserInfo } = useUserInfo();

  const { data: conversations = [] } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();
  const deleteConversation = useDeleteOpenaiConversation();

  const handleNewChat = () => {
    const activeModel = MODELS.find((m) => m.id === selectedModel);
    createConversation.mutate(
      { data: { title: `Percakapan — ${activeModel?.label ?? "Nixx AI"}` } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          setActiveConvId(newConv.id);
          setLimitReached(false);
          setSidebarOpen(false);
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

  const handleLimitReached = () => {
    setLimitReached(true);
    refetchUserInfo();
  };

  const isPremium = userInfo?.isPremium ?? false;
  const remaining = userInfo?.remaining ?? null;
  const usedToday = userInfo?.usedToday ?? 0;
  const limit = userInfo?.limit ?? 20;

  return (
    <>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>

      <button className="nx-menu-toggle" onClick={() => setSidebarOpen((v) => !v)} aria-label="Buka sidebar">
        ☰
      </button>
      <button className="nx-theme-toggle" onClick={toggleTheme} aria-label="Toggle tema">
        {isDark ? "☀️" : "🌙"}
      </button>

      <div className={`nx-sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div className={`nx-sidebar ${sidebarOpen ? "active" : ""}`}>
        <div
            className="nx-sidebar-user"
            onClick={() => { navigate(`${basePath}/profile`); setSidebarOpen(false); }}
            style={{ cursor: "pointer" }}
            title="Lihat profil"
          >
          {user?.imageUrl && (
            <img src={user.imageUrl} alt="avatar" className="nx-user-avatar" />
          )}
          <div className="nx-user-info">
            <div className="nx-user-name">{user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "Pengguna"}</div>
            {isPremium ? (
              <div className="nx-user-badge premium">⭐ Premium</div>
            ) : (
              <div className="nx-user-badge free">{usedToday}/{limit} pesan hari ini</div>
            )}
          </div>
        </div>

        <button
            onClick={() => { navigate(`${basePath}/profile`); setSidebarOpen(false); }}
            style={{
              width:"100%", padding:"10px 14px",
              background:"rgba(124,58,237,0.12)",
              border:"1.5px solid rgba(124,58,237,0.4)",
              borderRadius:10, color:"#7c3aed",
              fontSize:"0.875rem", fontWeight:600,
              cursor:"pointer", display:"flex",
              alignItems:"center", gap:8,
              marginBottom:8, fontFamily:"inherit",
            }}
          >
            👤 Profil Saya
          </button>

        {!isPremium && (
          <div className="nx-sidebar-upgrade">
            <button className="nx-upgrade-btn" onClick={() => { navigate(`${basePath}/premium`); setSidebarOpen(false); }}>
              ⭐ Upgrade Premium
            </button>
          </div>
        )}

        <ChatSidebar
          conversations={conversations}
          activeId={activeConvId}
          selectedModel={selectedModel}
          models={MODELS}
          onSelect={(id) => { setActiveConvId(id); setSidebarOpen(false); setLimitReached(false); }}
          onNewChat={handleNewChat}
          onDelete={handleDelete}
          onClearChat={handleClearChat}
          onSelectModel={handleSelectModel}
        />

        <div className="nx-sidebar-footer">
          <button className="nx-logout-btn" onClick={() => signOut({ redirectUrl: `${basePath}/` })}>
            🚪 Keluar
          </button>
        </div>
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
                {isPremium ? "⭐ Premium · Chat Tanpa Batas" : `${remaining ?? "..."}/20 pesan tersisa hari ini`}
              </div>
            </div>
          </div>
        </header>

        {limitReached && !isPremium && (
          <div className="nx-limit-banner">
            <span>🚫 Batas 20 pesan/hari tercapai!</span>
            <button className="nx-limit-upgrade-btn" onClick={() => navigate(`${basePath}/premium`)}>
              ⭐ Upgrade Premium
            </button>
          </div>
        )}

        <div className="nx-chat-container">
          {activeConvId ? (
            <ChatThread
              conversationId={activeConvId}
              selectedModel={selectedModel}
              onLimitReached={handleLimitReached}
            />
          ) : (
            <div className="nx-welcome">
              <div className="nx-welcome-icon">🧠</div>
              <div>
                <div className="nx-welcome-title">
                  Selamat datang di <span>Nixx AI</span>
                </div>
              </div>
              <p className="nx-welcome-desc">
                Asisten AI terpintar yang bisa bantu kamu belajar, nulis, coding, dan banyak lagi —
                {isPremium ? <strong> chat tanpa batas!</strong> : <><strong> {remaining}/20</strong> pesan gratis tersisa hari ini.</>}
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
                  <span className="nx-welcome-feature-icon">{isPremium ? "⭐" : "🆓"}</span>
                  <span>{isPremium ? <><strong>Premium aktif</strong> — chat tanpa batas!</> : <><strong>20 pesan/hari gratis</strong> — upgrade untuk tanpa batas</>}</span>
                </div>
              </div>
              <button className="nx-start-btn" onClick={handleNewChat}>
                ✨ Mulai Chat Sekarang
              </button>
              {!isPremium && (
                <button className="nx-premium-cta-btn" onClick={() => navigate(`${basePath}/premium`)}>
                  ⭐ Upgrade Premium — Rp15.000/30 hari
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
