import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { getModelById } from "@/lib/models";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface LocalConv {
  id: number;
  title: string;
  modelId: string;
  messages: LocalMessage[];
  createdAt: string;
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString("id-ID", {
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return ""; }
}

let convCounter = Date.now();

export default function DashboardPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<LocalConv[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState("deepseekv3");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (localStorage.getItem("nx-theme") as "dark" | "light") || "dark"
  );
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("nx-theme", theme);
  }, [theme]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;

  useEffect(() => { scrollToBottom(); }, [activeConv?.messages, streamingContent]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleNewChat = () => {
    setActiveConvId(null);
    setStreamingContent("");
    setSidebarOpen(false);
  };

  const handleDelete = (id: number) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  };

  const handleClearChat = () => {
    if (activeConvId) handleDelete(activeConvId);
    setSidebarOpen(false);
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const modelObj = getModelById(selectedModelId);
    let convId = activeConvId;
    let existingMessages: LocalMessage[] = [];

    if (!convId) {
      convCounter += 1;
      const newId = convCounter;
      const newConv: LocalConv = {
        id: newId,
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        modelId: selectedModelId,
        messages: [],
        createdAt: new Date().toISOString(),
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConvId(newId);
      convId = newId;
    } else {
      existingMessages = activeConv?.messages ?? [];
    }

    const userMsg: LocalMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    const capturedConvId = convId;

    setConversations(prev => prev.map(c =>
      c.id === capturedConvId
        ? { ...c, messages: [...c.messages, userMsg] }
        : c
    ));

    const apiHistory = [...existingMessages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    setIsStreaming(true);
    setStreamingContent("");

    let fullResponse = "";

    try {
      const res = await fetch("/api/openai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiHistory, model: modelObj.actualModel }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data:\s*/, "").trim();
          if (!line) continue;
          try {
            const evt = JSON.parse(line) as { content?: string; done?: boolean };
            if (evt.content) {
              fullResponse += evt.content;
              setStreamingContent(s => s + evt.content!);
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      fullResponse = "Maaf, server AI sedang sibuk. Coba lagi ya! 😊";
      setStreamingContent(fullResponse);
    }

    const aiMsg: LocalMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: fullResponse || "Maaf, tidak ada respons.",
      createdAt: new Date().toISOString(),
    };

    setConversations(prev => prev.map(c =>
      c.id === capturedConvId
        ? { ...c, messages: [...c.messages, aiMsg] }
        : c
    ));

    setIsStreaming(false);
    setStreamingContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };

  const messages = activeConv?.messages ?? [];
  const showDots = isStreaming && !streamingContent;
  const hasMessages = messages.length > 0 || isStreaming;
  const currentModel = getModelById(selectedModelId);
  const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

  const sidebarConvs = conversations.map(c => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
  }));

  return (
    <>
      <button className="nx-menu-toggle" onClick={() => setSidebarOpen(true)} title="Menu">☰</button>
      <button
        className="nx-theme-toggle"
        onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
        title="Ganti tema"
      >{theme === "dark" ? "☀️" : "🌙"}</button>

      <div className={`nx-sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />

      <ConversationSidebar
        conversations={sidebarConvs}
        activeId={activeConvId}
        onSelect={(id) => { setActiveConvId(id); setSidebarOpen(false); }}
        onNew={handleNewChat}
        onDelete={handleDelete}
        onClearChat={handleClearChat}
        selectedModelId={selectedModelId}
        onModelChange={(id) => { setSelectedModelId(id); setSidebarOpen(false); }}
        open={sidebarOpen}
        userName={user?.username ?? user?.email?.split("@")[0] ?? "User"}
        basePath={basePath}
      />

      <main className="nx-main">
        <div className="nx-header">
          <div className="nx-logo-container">
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              border: "2.5px solid rgba(255,255,255,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>🧠</div>
            <div>
              <div className="nx-logo">Nixx AI</div>
              <div className="nx-tagline">26 Model AI · Gratis Selamanya ✨</div>
            </div>
          </div>
          <div className="nx-model-chip">
            <span>{currentModel.emoji}</span>
            <span style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentModel.label}
            </span>
          </div>
        </div>

        <div className="nx-chat-container">
          {!hasMessages ? (
            <WelcomeScreen onPrompt={(text) => { handleSend(text); }} />
          ) : (
            <div className="nx-chat-messages" ref={scrollRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`nx-message ${msg.role === "user" ? "nx-user-msg" : "nx-ai-msg"}`}
                >
                  <div className="nx-msg-content">{msg.content}</div>
                  <div className="nx-msg-time">{formatTime(msg.createdAt)}</div>
                </div>
              ))}
              {isStreaming && streamingContent && (
                <div className="nx-message nx-ai-msg">
                  <div className="nx-msg-content">
                    {streamingContent}<span className="nx-cursor" />
                  </div>
                </div>
              )}
              {showDots && (
                <div className="nx-typing">
                  <div className="nx-typing-dots"><span /><span /><span /></div>
                </div>
              )}
            </div>
          )}

          <div className="nx-input-container">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan Anda di sini..."
              disabled={isStreaming}
              className="nx-input"
              rows={1}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isStreaming}
              className="nx-send-btn"
            >
              {isStreaming ? "⏳" : "➤ SEND"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
