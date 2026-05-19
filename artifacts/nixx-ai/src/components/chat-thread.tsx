import React, { useState, useEffect, useRef } from "react";
  import { useQueryClient } from "@tanstack/react-query";
  import {
    useGetOpenaiConversation,
    useListOpenaiMessages,
    getGetOpenaiConversationQueryKey,
    getListOpenaiConversationsQueryKey,
    getListOpenaiMessagesQueryKey,
  } from "@workspace/api-client-react";

  interface ChatThreadProps {
    conversationId: number;
    selectedModel: string;
  }

  function getCurrentTime() {
    const now = new Date();
    return (
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0")
    );
  }

  function getSystemPrompt(model: string): string {
    const base =
      "Gunakan bahasa Indonesia yang santai dan natural. Jangan gunakan LaTeX. Jawab langsung ke inti tanpa meta-talk. Jangan gunakan format markdown berlebihan. Jangan mulai jawaban dengan 'Okay', 'Sure', 'Baik', atau 'Tentu'.";
    const personas: Record<string, string> = {
      deepseekv3: `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas dan helpful. ${base}`,
      christyai: `Kamu adalah Christy AI, asisten AI dengan karakter idol JKT48 yang ceria, ramah, dan energik. ${base} Sesekali gunakan sapaan khas idol seperti "kak" atau kata-kata ceria khas idol.`,
      copilot: `Kamu adalah Copilot AI, asisten produktivitas bergaya Microsoft Copilot. ${base}`,
      muslim: `Kamu adalah Muslim AI, asisten AI berbasis nilai-nilai Islam. ${base}`,
      gpt4o: `Kamu adalah asisten AI canggih berbasis GPT-4o. ${base}`,
      turboseek: `Kamu adalah Turboseek AI, asisten super cepat dan ringkas. ${base} Jawab singkat.`,
      groqmini: `Kamu adalah Groq Mini, asisten AI yang efisien dan sangat cepat. ${base}`,
      grok4fast: `Kamu adalah Grok 4 Fast dari xAI. ${base} Berikan jawaban cepat dan witty.`,
      grok3mini: `Kamu adalah Grok 3 Mini dari xAI. ${base} Ringkas dan cerdas.`,
    };
    return personas[model] ?? `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas. ${base}`;
  }

  function cleanResponse(text: string): string {
    let clean = text.trim();
    if (clean.includes("</think>")) clean = clean.split("</think>").pop()?.trim() ?? clean;
    clean = clean.replace(/\\boxed\{([\s\S]*?)\}/g, "$1");
    clean = clean.replace(/\\[|\\]|\\(|\\)/g, "");
    clean = clean.replace(/\*\*/g, "");
    clean = clean.replace(/^(okay|sure|baik|tentu)[,.]?\s*/i, "");
    return clean.trim();
  }

  export default function ChatThread({ conversationId, selectedModel }: ChatThreadProps) {
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const streamingAccumRef = useRef("");
    const contentAccumRef = useRef("");
    const inContentPhaseRef = useRef(false);

    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [hasText, setHasText] = useState(false);

    const { data: conversationData, isLoading: isLoadingConv } =
      useGetOpenaiConversation(conversationId, {
        query: { enabled: !!conversationId, queryKey: getGetOpenaiConversationQueryKey(conversationId) },
      });

    const { data: listMessages, isLoading: isLoadingMessages } =
      useListOpenaiMessages(conversationId, {
        query: { enabled: !!conversationId, queryKey: getListOpenaiMessagesQueryKey(conversationId) },
      });

    const isLoading = isLoadingConv || isLoadingMessages;
    const messages = listMessages ?? conversationData?.messages ?? [];

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingContent]);
    useEffect(() => { inputRef.current?.focus(); }, [conversationId]);

    const handleSend = async () => {
      if (!input.trim() || isStreaming) return;

      const userMessage = input.trim();
      setInput("");
      setIsStreaming(true);
      setStreamingContent("");
      setHasText(false);
      streamingAccumRef.current = "";
      contentAccumRef.current = "";
      inContentPhaseRef.current = false;

      // Optimistic: tampilkan pesan user langsung
      queryClient.setQueryData(getGetOpenaiConversationQueryKey(conversationId), (old: any) => {
        if (!old) return old;
        return { ...old, messages: [...(old.messages ?? []), {
          id: Date.now(), conversationId, role: "user", content: userMessage,
          createdAt: new Date().toISOString(),
        }]};
      });

      let finalAIContent = "";

      try {
        const res = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: userMessage, model: selectedModel }),
        });

        if (!res.ok) throw new Error("Gagal mengirim pesan");

        const contentType = res.headers.get("content-type") ?? "";

        if (contentType.includes("text/event-stream")) {
          // === MODE CEPAT: Server streaming (GitHub Models / OpenAI) ===
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() ?? "";
            for (const part of parts) {
              const line = part.replace(/^data:\s*/, "").trim();
              if (!line || line === "[DONE]") continue;
              try {
                const evt = JSON.parse(line);
                if (evt.content) {
                  streamingAccumRef.current += evt.content;
                  setStreamingContent(streamingAccumRef.current);
                  setHasText(true);
                }
              } catch { /* skip */ }
            }
          }
          finalAIContent = streamingAccumRef.current;

        } else {
          // === MODE FALLBACK: Frontend stream langsung ke pollinations.ai ===
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
          let buffer = "";
          let reasoningBuf = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.replace(/^data:\s*/, "").trim();
              if (!trimmed || trimmed === "[DONE]") continue;
              try {
                const evt = JSON.parse(trimmed);
                const delta = evt.choices?.[0]?.delta;
                if (!delta) continue;
                if (delta.content != null && delta.content !== "") {
                  if (!inContentPhaseRef.current) {
                    inContentPhaseRef.current = true;
                    reasoningBuf = "";
                    setStreamingContent("");
                  }
                  contentAccumRef.current += delta.content;
                  setStreamingContent(contentAccumRef.current);
                  setHasText(true);
                } else if (delta.reasoning && !inContentPhaseRef.current) {
                  reasoningBuf += delta.reasoning;
                  setStreamingContent(reasoningBuf);
                  setHasText(true);
                }
              } catch { /* skip */ }
            }
          }

          finalAIContent = cleanResponse(contentAccumRef.current);

          // Simpan ke DB via endpoint assistant
          if (finalAIContent) {
            await fetch(`/api/openai/conversations/${conversationId}/messages/assistant`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: finalAIContent }),
            }).catch(() => {});
          }
        }

      } catch {
        finalAIContent = "Server AI sedang sibuk. Coba lagi ya!";
        setStreamingContent(finalAIContent);
        setHasText(true);
      }

      // Update cache
      if (finalAIContent) {
        const aiMsg = { id: Date.now() + 1, conversationId, role: "assistant", content: finalAIContent, createdAt: new Date().toISOString() };
        queryClient.setQueryData(getGetOpenaiConversationQueryKey(conversationId), (old: any) => {
          if (!old) return old;
          return { ...old, messages: [...(old.messages ?? []), aiMsg] };
        });
        queryClient.setQueryData(getListOpenaiMessagesQueryKey(conversationId), (old: any) =>
          Array.isArray(old) ? [...old, aiMsg] : old
        );
      }

      setIsStreaming(false);
      setStreamingContent("");
      setHasText(false);
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    if (isLoading) {
      return (
        <div className="nx-chat-messages" style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="nx-typing"><div className="nx-typing-dots"><span /><span /><span /></div></div>
        </div>
      );
    }

    return (
      <>
        <div className="nx-chat-messages">
          {messages.length === 0 && !isStreaming && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, marginTop: 40 }}>
              Ketik pesan untuk memulai percakapan.
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`nx-message ${msg.role === "user" ? "nx-user-msg" : "nx-ai-msg"}`}>
              <div className="nx-msg-content">{msg.content}</div>
              <div className="nx-msg-time">{getCurrentTime()}</div>
            </div>
          ))}

          {isStreaming && (
            <div className="nx-message nx-ai-msg">
              <div
                className="nx-msg-content"
                style={!inContentPhaseRef.current && hasText
                  ? { opacity: 0.4, fontStyle: "italic", fontSize: "0.9em" }
                  : undefined}
              >
                {hasText ? streamingContent : ""}
                <span className="nx-cursor" />
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
          <button
            className="nx-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            ✈ SEND
          </button>
        </div>
      </>
    );
  }
  