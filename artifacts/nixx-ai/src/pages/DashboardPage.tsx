import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useGetOpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
  getGetOpenaiConversationQueryKey,
} from "@workspace/api-client-react";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { getModelById } from "@/lib/models";

interface TempMsg { id: string; role: string; content: string; createdAt: string; }

function formatTime(dateStr: string) {
  try { return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }); }
  catch { return ""; }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState("deepseekv3");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingUserMsg, setPendingUserMsg] = useState<TempMsg | null>(null);
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

  const { data: conversations = [] } = useListOpenaiConversations();
  const { data: convData } = useGetOpenaiConversation(activeConvId!, {
    query: {
      enabled: !!activeConvId && !isStreaming,
      queryKey: getGetOpenaiConversationQueryKey(activeConvId!),
    },
  });
  const createConv = useCreateOpenaiConversation();
  const deleteConv = useDeleteOpenaiConversation();

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [convData?.messages, streamingContent, pendingUserMsg]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleNewChat = () => {
    setActiveConvId(null); setStreamingContent(""); setPendingUserMsg(null); setSidebarOpen(false);
  };
  const handleClearChat = () => {
    setStreamingContent(""); setPendingUserMsg(null); setActiveConvId(null); setSidebarOpen(false);
  };
  const handleDelete = (id: number) => {
    deleteConv.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        if (activeConvId === id) handleNewChat();
      },
    });
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    let convId = activeConvId;
    const modelObj = getModelById(selectedModelId);

    if (!convId) {
      try {
        const nc = await createConv.mutateAsync({
          data: { title: content.slice(0, 50) + (content.length > 50 ? "..." : "") },
        });
        convId = nc.id;
        setActiveConvId(convId);
        qc.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      } catch { return; }
    }

    setIsStreaming(true);
    setStreamingContent("");
    setPendingUserMsg({ id: `u-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() });

    try {
      const res = await fetch(`/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, model: modelObj.actualModel }),
      });
      if (!res.ok) throw new Error("Failed");
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
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
            try { const e = JSON.parse(line); if (e.content) setStreamingContent(p => p + e.content); } catch { /* skip */ }
          }
        }
      }
    } catch { /* silent */ } finally {
      const fid = convId;
      setIsStreaming(false);
      setPendingUserMsg(null);
      setStreamingContent("");
      if (fid) {
        await qc.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(fid) });
        qc.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };

  const persisted = (convData?.messages ?? []) as TempMsg[];
  const lastPersisted = persisted[persisted.length - 1];
  const showPending = pendingUserMsg && !(lastPersisted?.role === "user" && lastPersisted?.content === pendingUserMsg.content);

  const displayMessages: TempMsg[] = [
    ...persisted,
    ...(showPending ? [pendingUserMsg!] : []),
    ...(isStreaming && streamingContent
      ? [{ id: "streaming", role: "assistant", content: streamingContent, createdAt: new Date().toISOString() }]
      : []),
  ];
  const showDots = isStreaming && !streamingContent;
  const hasMessages = displayMessages.length > 0 || isStreaming;
  const currentModel = getModelById(selectedModelId);
  const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

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
        conversations={conversations}
        activeId={activeConvId}
        onSelect={(id) => { setActiveConvId(id); setPendingUserMsg(null); setStreamingContent(""); setSidebarOpen(false); }}
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
            <div style={{ width:42, height:42, borderRadius:"50%", background:"rgba(255,255,255,0.2)", border:"2.5px solid rgba(255,255,255,0.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🧠</div>
            <div>
              <div className="nx-logo">Nixx AI</div>
              <div className="nx-tagline">26 Model AI · Gratis Selamanya ✨</div>
            </div>
          </div>
          <div className="nx-model-chip">
            <span>{currentModel.emoji}</span>
            <span style={{ maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentModel.label}</span>
          </div>
        </div>

        <div className="nx-chat-container">
          {!hasMessages ? (
            <WelcomeScreen onPrompt={(text) => { setInput(text); handleSend(text); }} />
          ) : (
            <div className="nx-chat-messages" ref={scrollRef}>
              {displayMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`nx-message ${msg.role === "user" ? "nx-user-msg" : "nx-ai-msg"}`}
                >
                  <div className="nx-msg-content">
                    {msg.content}
                    {msg.id === "streaming" && <span className="nx-cursor" />}
                  </div>
                  <div className="nx-msg-time">{formatTime(msg.createdAt)}</div>
                </div>
              ))}
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
              ➤ SEND
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
