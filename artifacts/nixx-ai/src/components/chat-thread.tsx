import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetOpenaiConversation,
  useListOpenaiMessages,
  getGetOpenaiConversationQueryKey,
  getListOpenaiConversationsQueryKey,
  getListOpenaiMessagesQueryKey,
  getGetUsageQueryKey,
} from "@workspace/api-client-react";

interface ChatThreadProps {
  conversationId: number;
  selectedModel: string;
  onLimitReached: () => void;
}

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function getSystemPrompt(model: string): string {
  const base = "Gunakan bahasa Indonesia yang santai dan natural. Jangan gunakan LaTeX. Jawab langsung tanpa meta-talk. Jangan gunakan markdown berlebihan. Jangan mulai dengan 'Okay', 'Sure', 'Baik', atau 'Tentu'.";
  const map: Record<string, string> = {
    deepseekv3: `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas dan helpful. ${base}`,
    christyai: `Kamu adalah Christy AI berkarakter idol JKT48 yang ceria dan ramah. ${base} Sesekali gunakan sapaan "kak".`,
    copilot: `Kamu adalah Copilot AI bergaya Microsoft. ${base}`,
    muslim: `Kamu adalah Muslim AI berbasis nilai-nilai Islam. ${base}`,
    gpt4o: `Kamu adalah asisten AI canggih berbasis GPT-4o. ${base}`,
    turboseek: `Kamu adalah Turboseek AI yang super cepat. ${base} Jawab singkat dan padat.`,
    grok4fast: `Kamu adalah Grok 4 Fast dari xAI. ${base} Witty dan cepat.`,
    grok3mini: `Kamu adalah Grok 3 Mini dari xAI. ${base}`,
  };
  return map[model] ?? `Kamu adalah Nixx AI, asisten AI yang cerdas. ${base}`;
}

function cleanResponse(text: string): string {
  let c = text.trim();
  if (c.includes("</think>")) c = c.split("</think>").pop()?.trim() ?? c;
  c = c.replace(/\\boxed\{([\s\S]*?)\}/g, "$1").replace(/\\[|\\]|\\(|\\)/g, "").replace(/\*\*/g, "");
  c = c.replace(/^(okay|sure|baik|tentu)[,.]?\s*/i, "");
  return c.trim();
}

export default function ChatThread({ conversationId, selectedModel, onLimitReached }: ChatThreadProps) {
  const qc = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamAccumRef = useRef("");
  const contentAccumRef = useRef("");
  const inContentPhaseRef = useRef(false);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [hasText, setHasText] = useState(false);

  const { data: convData, isLoading: loadingConv } = useGetOpenaiConversation(conversationId, {
    query: { enabled: !!conversationId, queryKey: getGetOpenaiConversationQueryKey(conversationId) },
  });
  const { data: listMessages, isLoading: loadingMsgs } = useListOpenaiMessages(conversationId, {
    query: { enabled: !!conversationId, queryKey: getListOpenaiMessagesQueryKey(conversationId) },
  });

  const isLoading = loadingConv || loadingMsgs;
  const messages = listMessages ?? convData?.messages ?? [];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingContent]);
  useEffect(() => { inputRef.current?.focus(); }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent(""); setHasText(false);
    streamAccumRef.current = ""; contentAccumRef.current = ""; inContentPhaseRef.current = false;

    // Optimistic user message
    qc.setQueryData(getGetOpenaiConversationQueryKey(conversationId), (old: any) =>
      old ? { ...old, messages: [...(old.messages ?? []), { id: Date.now(), conversationId, role: "user", content: userMsg, createdAt: new Date().toISOString() }] } : old
    );

    let finalAIContent = "";
    try {
      const res = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg, model: selectedModel }),
        credentials: "include",
      });

      if (res.status === 429) {
        const err = await res.json();
        qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
        onLimitReached();
        finalAIContent = err.error ?? "Batas pesan harian tercapai.";
        setStreamingContent(finalAIContent); setHasText(true);
        setIsStreaming(false); return;
      }

      if (!res.ok) throw new Error("Gagal mengirim pesan");

      const ct = res.headers.get("content-type") ?? "";

      if (ct.includes("text/event-stream")) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n"); buf = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.replace(/^data:\s*/, "").trim();
            if (!line || line === "[DONE]") continue;
            try {
              const evt = JSON.parse(line);
              if (evt.content) { streamAccumRef.current += evt.content; setStreamingContent(streamAccumRef.current); setHasText(true); }
              if (evt.done) finalAIContent = streamAccumRef.current;
            } catch { /* skip */ }
          }
        }
        finalAIContent = streamAccumRef.current;
      } else {
        // Fallback: use Pollinations directly in browser
        const { history } = await res.json() as { history: Array<{ role: string; content: string }> };
        const chatMessages = [
          { role: "system", content: getSystemPrompt(selectedModel) },
          ...history.map((m) => ({ role: m.role, content: m.content })),
        ];
        const aiRes = await fetch("https://text.pollinations.ai/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "gpt-oss-20b", messages: chatMessages, max_tokens: 1024, stream: true }),
        });
        if (!aiRes.ok) throw new Error("AI tidak tersedia");

        const reader = aiRes.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop() ?? "";
          for (const line of lines) {
            const t = line.replace(/^data:\s*/, "").trim();
            if (!t || t === "[DONE]") continue;
            try {
              const evt = JSON.parse(t);
              const delta = evt.choices?.[0]?.delta;
              if (!delta) continue;
              if (delta.content != null && delta.content !== "") {
                if (!inContentPhaseRef.current) { inContentPhaseRef.current = true; contentAccumRef.current = ""; setStreamingContent(""); }
                contentAccumRef.current += delta.content;
                setStreamingContent(contentAccumRef.current); setHasText(true);
              } else if (delta.reasoning && !inContentPhaseRef.current) {
                streamAccumRef.current += delta.reasoning;
                setStreamingContent(streamAccumRef.current); setHasText(true);
              }
            } catch { /* skip */ }
          }
        }
        finalAIContent = cleanResponse(contentAccumRef.current);
        if (finalAIContent) {
          await fetch(`/api/openai/conversations/${conversationId}/messages/assistant`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: finalAIContent }), credentials: "include",
          }).catch(() => {});
        }
      }
    } catch {
      finalAIContent = "Server AI sedang sibuk. Coba lagi ya!";
      setStreamingContent(finalAIContent); setHasText(true);
    }

    if (finalAIContent) {
      const aiMsg = { id: Date.now() + 1, conversationId, role: "assistant", content: finalAIContent, createdAt: new Date().toISOString() };
      qc.setQueryData(getGetOpenaiConversationQueryKey(conversationId), (old: any) =>
        old ? { ...old, messages: [...(old.messages ?? []), aiMsg] } : old
      );
      qc.setQueryData(getListOpenaiMessagesQueryKey(conversationId), (old: any) =>
        Array.isArray(old) ? [...old, aiMsg] : old
      );
    }

    setIsStreaming(false); setStreamingContent(""); setHasText(false);
    qc.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
    qc.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(conversationId) });
    qc.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (isLoading) {
    return <div className="nx-chat-messages" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="nx-typing"><div className="nx-typing-dots"><span /><span /><span /></div></div>
    </div>;
  }

  return (
    <>
      <div className="nx-chat-messages">
        {messages.length === 0 && !isStreaming && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, marginTop: 40 }}>Ketik pesan untuk memulai percakapan.</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`nx-message ${msg.role === "user" ? "nx-user-msg" : "nx-ai-msg"}`}>
            <div className="nx-msg-content">{msg.content}</div>
            <div className="nx-msg-time">{getCurrentTime()}</div>
          </div>
        ))}
        {isStreaming && (
          <div className="nx-message nx-ai-msg">
            <div className="nx-msg-content" style={!inContentPhaseRef.current && hasText ? { opacity: 0.4, fontStyle: "italic", fontSize: "0.88em" } : undefined}>
              {hasText ? streamingContent : ""}<span className="nx-cursor" />
            </div>
          </div>
        )}
        {isStreaming && !hasText && (
          <div className="nx-typing"><div className="nx-typing-dots"><span /><span /><span /></div></div>
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
        />
        <button className="nx-send-btn" onClick={handleSend} disabled={!input.trim() || isStreaming}>
          ✈ SEND
        </button>
      </div>
    </>
  );
}
