import React, { useState, useEffect, useRef } from "react";
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
              <div className="nx-msg-content">{msg.content}</div>
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
                {streamContent}<span className="nx-cursor" />
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
  