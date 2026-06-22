import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import PremiumPopup from "./PremiumPopup";

interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date | string;
}

interface ConversationWithMessages {
  id: number;
  title: string;
  createdAt: Date | string;
  messages: Message[];
}

interface ChatThreadProps {
  conversationId: number;
  selectedModel: string;
}

function getCurrentTime() {
  const now = new Date();
  return now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
}

export default function ChatThread({ conversationId, selectedModel }: ChatThreadProps) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ count: number; limit: number } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/openai/conversations/${conversationId}`)
      .then(r => r.json())
      .then((data: ConversationWithMessages) => {
        setMessages(data.messages ?? []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, streamingContent]);
  useEffect(() => { inputRef.current?.focus(); }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    const tempId = Date.now();
    const tempUserMsg: Message = {
      id: tempId,
      conversationId,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ content: userMessage, model: selectedModel }),
      });

      if (res.status === 429) {
        const data = await res.json() as { error: string; count?: number; limit?: number };
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setInput(userMessage);
        if (data.count !== undefined && data.limit !== undefined) {
          setLimitInfo({ count: data.count, limit: data.limit });
        }
        setShowPremiumPopup(true);
        setIsStreaming(false);
        return;
      }

      if (!res.ok) throw new Error("Gagal mengirim pesan");

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const data = await res.json() as { content?: string };
        if (data.content) setStreamingContent(data.content);
      } else {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.replace(/^data: /, "").trim();
            if (!line) continue;
            try {
              const evt = JSON.parse(line) as { content?: string; done?: boolean };
              if (evt.content) setStreamingContent(prev => prev + evt.content);
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      setStreamingContent("Server AI sedang sibuk. Coba lagi ya!");
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      fetch(`/api/openai/conversations/${conversationId}`)
        .then(r => r.json())
        .then((data: ConversationWithMessages) => setMessages(data.messages ?? []))
        .catch(() => {});
      queryClient.invalidateQueries();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (isLoading) {
    return (
      <div className="nx-chat-messages" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="nx-typing">
          <div className="nx-typing-dots"><span /><span /><span /></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PremiumPopup
        show={showPremiumPopup}
        onClose={() => setShowPremiumPopup(false)}
        count={limitInfo?.count}
        limit={limitInfo?.limit}
      />

      <div className="nx-chat-messages">
        {messages.length === 0 && !isStreaming && (
          <div style={{ textAlign: "center", color: "var(--nx-text-muted)", fontSize: 14, marginTop: 40 }}>
            Ketik pesan untuk memulai percakapan.
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`nx-message ${msg.role === "user" ? "nx-user-msg" : "nx-ai-msg"}`}
          >
            <div className="nx-msg-content">{msg.content}</div>
            <div className="nx-msg-time">{getCurrentTime()}</div>
          </div>
        ))}

        {isStreaming && (
          <div className="nx-message nx-ai-msg">
            <div className="nx-msg-content">
              {streamingContent || ""}
              <span className="nx-cursor" />
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="nx-typing">
            <div className="nx-typing-dots"><span /><span /><span /></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="nx-input-container">
        <textarea
          ref={inputRef}
          className="nx-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pesan Anda di sini..."
          rows={1}
          disabled={isStreaming}
          data-testid="input-message"
        />
        <button
          className="nx-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          data-testid="button-send"
        >
          ➤ KIRIM
        </button>
      </div>
    </>
  );
}
