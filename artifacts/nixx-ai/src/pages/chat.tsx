import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useTheme } from "@/App";
import { AI_MODELS } from "@/lib/models";

const MODELS = AI_MODELS.map(m => ({
  id: m.id,
  label: m.label,
  badge: m.badge,
  icon: m.emoji,
  off: m.off ?? false,
}));
export { MODELS };

export interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

export interface LocalConversation {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  messages: LocalMessage[];
}

const STORAGE_KEY = "nixx-ai-conversations";
function loadConversations(): LocalConversation[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveConversations(c: LocalConversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}
function getTime() {
  const n = new Date();
  return n.getHours().toString().padStart(2,"0") + ":" + n.getMinutes().toString().padStart(2,"0");
}

const SUGGESTIONS = [
  { icon: "📝", text: "Buatkan cerita pendek yang menarik" },
  { icon: "💻", text: "Bantu saya belajar coding Python" },
  { icon: "🎨", text: "Ide bisnis online yang menguntungkan" },
  { icon: "📚", text: "Jelaskan konsep ini dengan mudah" },
];


/* ── Komponen render pesan AI dengan Markdown ─── */
function AiMessage({ content, streaming }: { content: string; streaming?: boolean }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  return (
    <div style={{ fontSize:".88rem", lineHeight:1.7, color:"var(--nx-text)", wordBreak:"break-word" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { children, className } = props;
            const match = /language-(\w+)/.exec(className || "");
            const codeStr = String(children).replace(/\n$/, "");
            if (match) {
              const codeId = `code-${codeStr.slice(0, 20)}`;
              return (
                <div style={{ position:"relative", borderRadius:10, overflow:"hidden", margin:"10px 0", border:"1px solid rgba(255,255,255,.1)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 12px", background:"rgba(0,0,0,.35)", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
                    <span style={{ fontSize:".7rem", opacity:.6, fontFamily:"monospace" }}>{match[1]}</span>
                    <button onClick={() => handleCopy(codeStr, codeId)}
                      style={{ background:"none", border:"none", cursor:"pointer", color:"inherit", opacity:.6, display:"flex", alignItems:"center", gap:4, fontSize:".7rem", padding:"2px 4px" }}>
                      {copiedId === codeId ? <><Check size={12} /> Tersalin</> : <><Copy size={12} /> Salin</>}
                    </button>
                  </div>
                  <SyntaxHighlighter language={match[1]} style={vscDarkPlus}
                    customStyle={{ margin:0, background:"rgba(0,0,0,.3)", padding:"12px 16px", fontSize:".8rem", borderRadius:0 }}>
                    {codeStr}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return (
              <code style={{ background:"rgba(124,58,237,.18)", color:"#c084fc", padding:"2px 6px", borderRadius:5, fontFamily:"monospace", fontSize:".82em" }}>
                {children}
              </code>
            );
          },
          p: ({ children }) => <p style={{ margin:"6px 0" }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin:"6px 0", paddingLeft:20 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin:"6px 0", paddingLeft:20 }}>{children}</ol>,
          li: ({ children }) => <li style={{ margin:"3px 0" }}>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft:"3px solid var(--nx-accent)", paddingLeft:12, margin:"8px 0", opacity:.8 }}>{children}</blockquote>
          ),
          h1: ({ children }) => <h1 style={{ fontSize:"1.2em", fontWeight:700, margin:"12px 0 6px" }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize:"1.1em", fontWeight:700, margin:"10px 0 5px" }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize:"1em", fontWeight:700, margin:"8px 0 4px" }}>{children}</h3>,
          hr: () => <hr style={{ border:"none", borderTop:"1px solid rgba(255,255,255,.1)", margin:"10px 0" }} />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer"
              style={{ color:"var(--nx-accent)", textDecoration:"underline" }}>{children}</a>
          ),
          table: ({ children }) => (
            <div style={{ overflowX:"auto", margin:"8px 0" }}>
              <table style={{ borderCollapse:"collapse", width:"100%", fontSize:".85em" }}>{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{ border:"1px solid rgba(255,255,255,.15)", padding:"6px 10px", background:"rgba(124,58,237,.2)", textAlign:"left" }}>{children}</th>
          ),
          td: ({ children }) => (
            <td style={{ border:"1px solid rgba(255,255,255,.1)", padding:"6px 10px" }}>{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {streaming && <span className="nx-cursor" />}
    </div>
  );
}

export default function ChatPage() {
  const { isDark, toggle: toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [conversations, setConversations] = useState<LocalConversation[]>([]);
  const [activeConvId, setActiveConvId]   = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("deepseekv3");
  const [input, setInput]         = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");

  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setConversations(loadConversations()); }, []);

  const activeConv  = conversations.find(c => c.id === activeConvId) ?? null;
  const messages    = activeConv?.messages ?? [];
  const activeModel = MODELS.find(m => m.id === selectedModel);

  const scroll = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scroll, [messages, streamContent]);

  const handleNewChat = (initialText?: string) => {
    const model  = MODELS.find(m => m.id === selectedModel);
    const now    = new Date();
    const timeStr = now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0");
    const newConv: LocalConversation = {
      id: Date.now().toString(),
      title: initialText ? initialText.slice(0,40) : `${model?.icon ?? "💬"} ${model?.label ?? "Nixx AI"} · ${timeStr}`,
      model: selectedModel,
      createdAt: now.toISOString(),
      messages: [],
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    saveConversations(updated);
    setActiveConvId(newConv.id);
    setSidebarOpen(false);
    return newConv;
  };

  const handleDelete = (id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveConversations(updated);
      return updated;
    });
    if (activeConvId === id) setActiveConvId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;

    let conv = activeConv;
    if (!conv) conv = handleNewChat(text);
    else {
      const updated = conversations.map(c =>
        c.id === conv!.id ? { ...c, title: c.messages.length === 0 ? text.slice(0,40) : c.title } : c
      );
      setConversations(updated);
      saveConversations(updated);
    }

    const userMsg: LocalMessage = { id: Date.now().toString(), role: "user", content: text, time: getTime() };
    const nextMsgs = [...(conv.messages), userMsg];

    setConversations(prev => {
      const up = prev.map(c => c.id === conv!.id ? { ...c, messages: nextMsgs } : c);
      saveConversations(up);
      return up;
    });
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsStreaming(true);
    setStreamContent("");

    const apiMessages = nextMsgs.map(m => ({ role: m.role, content: m.content }));
    let fullResponse = "";

    try {
      const res = await fetch("/api/openai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, model: conv.model }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

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
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const evt = JSON.parse(line) as { content?: string; done?: boolean };
            if (evt.content) {
              fullResponse += evt.content;
              setStreamContent(s => s + evt.content);
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      fullResponse = "Maaf, server AI sedang sibuk. Coba lagi sebentar ya! 😊";
      setStreamContent(fullResponse);
    }

    const aiMsg: LocalMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: fullResponse || "Maaf, tidak ada respons.",
      time: getTime(),
    };

    setConversations(prev => {
      const up = prev.map(c => c.id === conv!.id ? { ...c, messages: [...nextMsgs, aiMsg] } : c);
      saveConversations(up);
      return up;
    });
    setIsStreaming(false);
    setStreamContent("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="nx-main" style={{ maxWidth:"100%", height:"100dvh", borderRadius:0 }}>
      {/* Sidebar overlay */}
      <div className={`nx-sidebar-overlay${sidebarOpen ? " active" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <div className={`nx-sidebar${sidebarOpen ? " active" : ""}`}>
        <button className="nx-sidebar-btn" onClick={() => { handleNewChat(); setSidebarOpen(false); }}>
          ✏️ Percakapan Baru
        </button>

        {conversations.length > 0 && (
          <>
            <div style={{ fontSize:".72rem", color:"var(--nx-text-muted)", textTransform:"uppercase", letterSpacing:".08em", fontWeight:700, padding:"8px 0 4px" }}>Riwayat</div>
            {conversations.map(conv => (
              <button key={conv.id}
                className="nx-sidebar-btn"
                onClick={() => { setActiveConvId(conv.id); setSidebarOpen(false); }}
                style={{ background: activeConvId===conv.id ? "var(--nx-accent)" : undefined, color: activeConvId===conv.id ? "#fff" : undefined, justifyContent:"space-between" }}>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>💬 {conv.title}</span>
                <span onClick={e => { e.stopPropagation(); if (confirm("Hapus?")) handleDelete(conv.id); }} style={{ opacity:.5, flexShrink:0, padding:"0 2px" }}>🗑</span>
              </button>
            ))}
            <button className="nx-sidebar-btn nx-clear-btn"
              onClick={() => { if (confirm("Hapus semua chat?")) { setConversations([]); saveConversations([]); setActiveConvId(null); setSidebarOpen(false); } }}>
              🗑️ Hapus Semua
            </button>
          </>
        )}

        <div className="nx-model-selector">
          <span className="nx-model-label">Model AI ({MODELS.filter(m=>!m.off).length} aktif)</span>
          {MODELS.map(m => (
            <button key={m.id}
              className={`nx-model-option${selectedModel===m.id?" active":""}${m.off?" off":""}`}
              disabled={m.off}
              onClick={() => { if (!m.off) { setSelectedModel(m.id); setSidebarOpen(false); } }}>
              <span>{m.icon}</span>
              <span style={{ flex:1 }}>{m.label}</span>
              <span className="nx-model-badge">{m.badge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating buttons */}
      <button className="nx-menu-toggle" onClick={() => setSidebarOpen(v => !v)} title="Menu">☰</button>
      <button className="nx-theme-toggle" onClick={toggleTheme} title="Toggle tema">{isDark ? "☀️" : "🌙"}</button>

      {/* Header */}
      <div className="nx-header" style={{ position:"relative", zIndex:10 }}>
        <div className="nx-logo-container">
          <img className="nx-logo-img" src="https://iili.io/f7nDq8X.jpg" alt="Nixx AI" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
          <div className="nx-logo-text">
            <div className="nx-logo">Nixx AI</div>
            <div className="nx-tagline">{activeModel?.icon} {activeModel?.label} · {MODELS.filter(m=>!m.off).length} Model Tersedia</div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="nx-chat-container">
        {!activeConv ? (
          /* Welcome screen */
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 16px", overflow:"auto" }}>
            <div style={{ fontSize:"3.5rem", marginBottom:12 }}>🧠</div>
            <h2 style={{ color:"var(--nx-text)", fontWeight:900, fontSize:"1.5rem", textAlign:"center", marginBottom:8 }}>
              Halo! Saya <span style={{ color:"var(--nx-accent)" }}>Nixx AI</span>
            </h2>
            <p style={{ color:"var(--nx-text-muted)", textAlign:"center", fontSize:".88rem", marginBottom:20, maxWidth:320, lineHeight:1.6 }}>
              Pilih model AI di sidebar, lalu ketik pesanmu di bawah untuk mulai chat!
            </p>
            <div style={{ width:"100%", maxWidth:420, display:"flex", flexDirection:"column", gap:8 }}>
              {SUGGESTIONS.map(s => (
                <button key={s.text}
                  onClick={() => { handleNewChat(s.text); setTimeout(() => handleSend(s.text), 50); }}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.09)", borderRadius:12, cursor:"pointer", fontFamily:"inherit", color:"var(--nx-text)", textAlign:"left", transition:"all .18s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,.18)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.05)"; }}>
                  <span style={{ fontSize:"1.3rem" }}>{s.icon}</span>
                  <span style={{ fontSize:".85rem", fontWeight:600 }}>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="nx-chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`nx-message${msg.role==="user" ? " nx-user-msg" : " nx-ai-msg"}`}>
                {msg.role === "assistant" && (
                  <div style={{ fontSize:".7rem", opacity:.65, marginBottom:4, display:"flex", alignItems:"center", gap:4 }}>
                    🧠 {MODELS.find(m => m.id === activeConv?.model)?.label ?? "Nixx AI"}
                  </div>
                )}
                {msg.role === "assistant"
                  ? <AiMessage content={msg.content} />
                  : <div className="nx-msg-content">{msg.content}</div>
                }
                <div className="nx-msg-time">{msg.time}</div>
              </div>
            ))}

            {isStreaming && streamContent && (
              <div className="nx-message nx-ai-msg">
                <div style={{ fontSize:".7rem", opacity:.65, marginBottom:4, display:"flex", alignItems:"center", gap:4 }}>🧠 Nixx AI</div>
                <AiMessage content={streamContent} streaming />
              </div>
            )}

            {isStreaming && !streamContent && (
              <div className="nx-typing">
                <div className="nx-typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input bar */}
        <div className="nx-input-container">
          <textarea
            ref={textareaRef}
            className="nx-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKey}
            placeholder={`Chat dengan ${activeModel?.label ?? "Nixx AI"}… (Enter kirim, Shift+Enter baris baru)`}
            rows={1}
            disabled={isStreaming}
          />
          <button
            className="nx-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
          >
            {isStreaming ? "⏳" : "➤ Kirim"}
          </button>
        </div>
      </div>
    </div>
  );
}
