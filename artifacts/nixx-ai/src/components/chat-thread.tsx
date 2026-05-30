import React, { useState, useEffect, useRef } from "react";
  import ReactMarkdown from "react-markdown";
  import remarkGfm from "remark-gfm";
  import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
  import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
  import { Copy, Check } from "lucide-react";
  import type { LocalConversation, LocalMessage } from "@/pages/chat";

  interface ChatThreadProps {
    conversation: LocalConversation;
    onUpdateMessages: (messages: LocalMessage[]) => void;
  }

  const THREAD_CSS = `
    @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes tDot { 0%,80%,100%{transform:scale(0.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
    @keyframes curBlink { 0%,100%{opacity:1} 50%{opacity:0} }
    .nx-msg-bubble { animation: msgIn .25s ease both; }
    .nx-typing-dot { animation: tDot 1.4s ease-in-out infinite; }
    .nx-typing-dot:nth-child(2) { animation-delay: .15s; }
    .nx-typing-dot:nth-child(3) { animation-delay: .3s; }
    .nx-cursor { display:inline-block; width:2px; height:1em; background:currentColor; margin-left:2px; vertical-align:middle; animation:curBlink .7s step-end infinite; }
    .nx-send-animated:not(:disabled):hover { transform:scale(1.08); }
    .nx-send-animated { transition:transform .15s,background .15s; }
    .nx-input-grow { resize:none; overflow-y:hidden; }
    .nx-ai-msg:hover .copy-btn { opacity:1 !important; }
    .nx-msg-content .prose h1,.nx-msg-content .prose h2,.nx-msg-content .prose h3 { margin-top:0.8em; margin-bottom:0.3em; }
    .nx-msg-content .prose ul,.nx-msg-content .prose ol { padding-left:1.4em; }
    .nx-msg-content .prose p:last-child { margin-bottom:0; }
    .nx-msg-content .prose p:first-child { margin-top:0; }
  `;

  function getTime() {
    const n = new Date();
    return n.getHours().toString().padStart(2,"0") + ":" + n.getMinutes().toString().padStart(2,"0");
  }

  export default function ChatThread({ conversation, onUpdateMessages }: ChatThreadProps) {
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamContent, setStreamContent] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (content: string, id: string) => {
      navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    };

    const messages = conversation.messages;
    const modelId = conversation.model;

    const scroll = () => endRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scroll, [messages, streamContent]);
    useEffect(() => { inputRef.current?.focus(); }, [conversation.id]);

    // Auto-grow textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = "auto";
      e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
    };

    const handleSend = async () => {
      const text = input.trim();
      if (!text || isStreaming) return;

      const userMsg: LocalMessage = { id: Date.now().toString(), role: "user", content: text, time: getTime() };
      const nextMsgs = [...messages, userMsg];
      onUpdateMessages(nextMsgs);
      setInput("");
      if (inputRef.current) { inputRef.current.style.height = "auto"; }
      setIsStreaming(true);
      setStreamContent("");

      // Build history for API
      const apiMessages = nextMsgs.map(m => ({ role: m.role, content: m.content }));

      let fullResponse = "";
      try {
        const res = await fetch("/api/openai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, model: modelId }),
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
              if (evt.content) { fullResponse += evt.content; setStreamContent(s => s + evt.content); }
            } catch { /* skip */ }
          }
        }
      } catch {
        fullResponse = "Server AI sedang sibuk. Coba lagi ya!";
        setStreamContent(fullResponse);
      }

      const aiMsg: LocalMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullResponse || "Maaf, tidak ada respons.",
        time: getTime(),
      };
      onUpdateMessages([...nextMsgs, aiMsg]);
      setIsStreaming(false);
      setStreamContent("");
    };

    const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    return (
      <>
        <style>{THREAD_CSS}</style>

        {/* Messages */}
        <div className="nx-chat-messages">
          {messages.length === 0 && !isStreaming && (
            <div style={{ textAlign:"center", color:"var(--nx-text-muted)", fontSize:13, marginTop:40, opacity:.7 }}>
              💬 Ketik pesan pertama kamu…
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`nx-msg-bubble nx-message ${msg.role === "user" ? "nx-user-msg" : "nx-ai-msg"}`}>
              {msg.role === "assistant" && (
                <div style={{ fontSize:"0.7rem", color:"var(--nx-text-muted)", marginBottom:4, display:"flex", alignItems:"center", gap:5, opacity:.7 }}>
                  <span style={{ fontSize:"0.9rem" }}>🧠</span> Nixx AI
                </div>
              )}
              {msg.role === "assistant" ? (
                <div className="nx-msg-content" style={{ position:"relative" }}>
                  <div className="prose prose-sm max-w-none prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-headings:font-bold prose-headings:text-white prose-strong:text-white prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code(props: any) {
                          const { children, className, inline } = props;
                          const match = /language-(\w+)/.exec(className || "");
                          const codeStr = String(children).replace(/\n$/, "");
                          if (!inline && match) {
                            return (
                              <div className="relative group/code rounded-xl overflow-hidden my-3"
                                style={{ border: "1px solid hsl(248,25%,22%)" }}>
                                <div className="flex items-center justify-between px-3 py-2"
                                  style={{ background: "hsl(248,30%,7%)", borderBottom: "1px solid hsl(248,25%,22%)" }}>
                                  <span className="text-xs font-mono" style={{ color: "hsl(248,15%,55%)" }}>{match[1]}</span>
                                  <button onClick={() => navigator.clipboard.writeText(codeStr)}
                                    className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover/code:opacity-100 transition-opacity"
                                    style={{ color: "hsl(248,15%,60%)" }}>
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                                <SyntaxHighlighter language={match[1]} style={vscDarkPlus}
                                  customStyle={{ margin: 0, background: "transparent", padding: "12px 16px", fontSize: "12px" }}>
                                  {codeStr}
                                </SyntaxHighlighter>
                              </div>
                            );
                          }
                          return (
                            <code className="px-1.5 py-0.5 rounded text-xs font-mono"
                              style={{ background: "hsl(248,25%,18%)", color: "#a855f7" }}>
                              {children}
                            </code>
                          );
                        },
                        table(props: any) {
                          return (
                            <div style={{ overflowX: "auto", margin: "8px 0" }}>
                              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.8rem" }}>{props.children}</table>
                            </div>
                          );
                        },
                        th(props: any) {
                          return <th style={{ padding: "6px 12px", borderBottom: "2px solid hsl(248,25%,25%)", textAlign: "left", color: "hsl(248,15%,80%)", fontWeight: 600 }}>{props.children}</th>;
                        },
                        td(props: any) {
                          return <td style={{ padding: "6px 12px", borderBottom: "1px solid hsl(248,25%,18%)", color: "hsl(0,0%,85%)" }}>{props.children}</td>;
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    style={{ position:"absolute", top:0, right:0, opacity:0, transition:"opacity .15s", color:"hsl(248,15%,60%)", background:"none", border:"none", cursor:"pointer", padding:"2px 4px" }}
                    className="group-hover:opacity-100 copy-btn"
                    title="Salin"
                  >
                    {copiedId === msg.id ? <Check style={{ width:12, height:12, color:"#4ade80" }} /> : <Copy style={{ width:12, height:12 }} />}
                  </button>
                </div>
              ) : (
                <div className="nx-msg-content">{msg.content}</div>
              )}
              <div className="nx-msg-time">{msg.time}</div>
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && streamContent && (
            <div className="nx-msg-bubble nx-message nx-ai-msg">
              <div style={{ fontSize:"0.7rem", color:"var(--nx-text-muted)", marginBottom:4, display:"flex", alignItems:"center", gap:5, opacity:.7 }}>
                <span style={{ fontSize:"0.9rem" }}>🧠</span> Nixx AI
              </div>
              <div className="nx-msg-content">
                <div className="prose prose-sm max-w-none prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-headings:font-bold prose-headings:text-white prose-strong:text-white prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
                </div>
                <span className="nx-cursor" />
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isStreaming && !streamContent && (
            <div className="nx-message nx-ai-msg nx-typing" style={{ padding:"12px 16px" }}>
              <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                {[0,1,2].map(i => (
                  <span key={i} className="nx-typing-dot" style={{
                    width:7, height:7, borderRadius:"50%", background:"var(--nx-accent)", display:"inline-block",
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding:"10px 12px", borderTop:"1px solid var(--nx-border)",
          background:"var(--nx-card-bg)", display:"flex", gap:8, alignItems:"flex-end", flexShrink:0,
        }}>
          <textarea
            ref={inputRef}
            className="nx-input nx-input-grow"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKey}
            placeholder="Ketik pesan… (Enter kirim, Shift+Enter baris baru)"
            rows={1}
            disabled={isStreaming}
            style={{ flex:1, minHeight:42, maxHeight:140, borderRadius:12, padding:"10px 14px", lineHeight:1.5 }}
          />
          <button
            className="nx-send-btn nx-send-animated"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            style={{
              flexShrink:0, width:44, height:44, borderRadius:12,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.1rem", padding:0,
            }}
          >
            {isStreaming ? "⏳" : "➤"}
          </button>
        </div>
      </>
    );
  }
