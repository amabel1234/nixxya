import React, { useState, useRef } from "react";
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
  { id: "deepseekv3", label: "Nixx AI",       badge: "Fast",     icon: "🧠", off: false },
  { id: "christyai",  label: "Christy AI",    badge: "JKT48",    icon: "⭐", off: false },
  { id: "copilot",    label: "Copilot AI",    badge: "Microsoft",icon: "🤖", off: false },
  { id: "ripple",     label: "Ripple AI",     badge: "OFF",      icon: "🌊", off: true  },
  { id: "felo",       label: "Felo AI",       badge: "New",      icon: "🔍", off: false },
  { id: "turboseek",  label: "Turboseek AI",  badge: "Fast",     icon: "🚀", off: false },
  { id: "perplexed",  label: "Perplexed AI",  badge: "Advanced", icon: "❓", off: false },
  { id: "muslim",     label: "Muslim AI",     badge: "Religious",icon: "🕌", off: false },
  { id: "gpt3",       label: "GPT-3",         badge: "OpenAI",   icon: "🤖", off: false },
  { id: "gpt4o",      label: "GPT-4o",        badge: "Latest",   icon: "🤖", off: false },
  { id: "perplexity", label: "Perplexity AI", badge: "Web",      icon: "🔍", off: false },
  { id: "groqmini",   label: "Groq Mini",     badge: "Fast",     icon: "⚡", off: false },
  { id: "llama4",     label: "Llama-4 Scout", badge: "17B",      icon: "💻", off: false },
  { id: "llama33",    label: "Llama-3.3",     badge: "70B",      icon: "🌿", off: false },
  { id: "gemma",      label: "Gemma 7B",      badge: "Light",    icon: "💎", off: false },
  { id: "mistral",    label: "Mistral 7B",    badge: "v0.1",     icon: "🌬️", off: false },
  { id: "aoyo",       label: "Aoyo AI",       badge: "New",      icon: "💬", off: false },
  { id: "gptoss120",  label: "GPT-OSS 120B",  badge: "120B",     icon: "💻", off: false },
  { id: "gptoss20",   label: "GPT-OSS 20B",   badge: "20B",      icon: "💻", off: false },
  { id: "gemini25v1", label: "Gemini 2.5 v1", badge: "Flash",    icon: "🤖", off: false },
  { id: "gemini25v2", label: "Gemini 2.5 v2", badge: "Flash",    icon: "🤖", off: false },
  { id: "grok4fast",  label: "Grok 4 Fast",   badge: "Fast",     icon: "⚡", off: false },
  { id: "grok3mini",  label: "Grok 3 Mini",   badge: "Mini",     icon: "⚡", off: false },
  { id: "grok3jail1", label: "Grok Jail v1",  badge: "JB",       icon: "🔓", off: false },
  { id: "grok3jail2", label: "Grok Jail v2",  badge: "JB",       icon: "🔓", off: false },
  { id: "venice",     label: "Venice AI",     badge: "New",      icon: "🌊", off: false },
];

const SUGGESTIONS = [
  { icon: "📝", text: "Buatkan cerita pendek yang menarik" },
  { icon: "💻", text: "Bantu saya belajar coding Python" },
  { icon: "🎨", text: "Ide bisnis online yang menguntungkan" },
  { icon: "📚", text: "Jelaskan konsep ini dengan mudah" },
];

export { MODELS };

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState("deepseekv3");
  const [welcomeInput, setWelcomeInput] = useState("");
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const welcomeInputRef = useRef<HTMLTextAreaElement>(null);

  const { isDark, toggle: toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();
  const deleteConversation = useDeleteOpenaiConversation();

  const doCreateAndSend = (text: string) => {
    if (!text.trim() || createConversation.isPending) return;
    const activeModel = MODELS.find((m) => m.id === selectedModel);
    createConversation.mutate(
      { data: { title: `Percakapan Baru — ${activeModel?.label ?? "Nixx AI"}` } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          setPendingMessage(text.trim());
          setActiveConvId(newConv.id);
          setSidebarOpen(false);
          setWelcomeInput("");
        },
      }
    );
  };

  const handleNewChat = () => {
    doCreateAndSend("");
  };

  const handleSuggestion = (text: string) => {
    doCreateAndSend(text);
  };

  const handleWelcomeSend = () => {
    if (!welcomeInput.trim()) return;
    doCreateAndSend(welcomeInput);
  };

  const handleWelcomeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleWelcomeSend();
    }
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
    if (confirm("Hapus percakapan ini?")) {
      handleDelete(activeConvId);
    }
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setSidebarOpen(false);
  };

  return (
    <>
      <button
        className="nx-menu-toggle"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Buka sidebar"
      >
        ☰
      </button>

      <button
        className="nx-theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle tema"
      >
        {isDark ? "☀️" : "🌙"}
      </button>

      <div
        className={`nx-sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

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
              <div className="nx-tagline">26 AI Models • Free Assistant</div>
            </div>
          </div>
        </header>

        <div className="nx-chat-container">
          {activeConvId ? (
            <ChatThread
              conversationId={activeConvId}
              selectedModel={selectedModel}
              initialMessage={pendingMessage}
              onInitialMessageSent={() => setPendingMessage(null)}
            />
          ) : (
            <div className="nx-welcome-screen">
              <div className="nx-welcome-body">
                <div className="nx-welcome-icon">🧠</div>
                <h2 className="nx-welcome-title">
                  Halo! Ada yang bisa{" "}
                  <span className="nx-welcome-highlight">dibantu?</span>
                </h2>
                <p className="nx-welcome-sub">
                  Pilih salah satu pertanyaan di bawah atau ketik sendiri
                </p>

                <div className="nx-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.text}
                      className="nx-suggestion-btn"
                      onClick={() => handleSuggestion(s.text)}
                      disabled={createConversation.isPending}
                    >
                      <span className="nx-suggestion-icon">{s.icon}</span>
                      <span>{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="nx-input-container">
                <textarea
                  ref={welcomeInputRef}
                  className="nx-input"
                  value={welcomeInput}
                  onChange={(e) => setWelcomeInput(e.target.value)}
                  onKeyDown={handleWelcomeKeyDown}
                  placeholder="Ketik pesan Anda di sini..."
                  rows={1}
                  disabled={createConversation.isPending}
                />
                <button
                  className="nx-send-btn"
                  onClick={handleWelcomeSend}
                  disabled={!welcomeInput.trim() || createConversation.isPending}
                >
                  ► SEND
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
