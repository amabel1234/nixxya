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

function isImageContent(content: string) {
  return content.startsWith("data:image/");
}

function ImageBubble({ content, prompt }: { content: string; prompt?: string }) {
  const handleOpen = () => {
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${content}" style="max-width:100%;display:block;margin:auto;" />`);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = content;
    a.download = `nixx-gambar-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="nx-image-bubble">
      <img
        src={content}
        alt={prompt ?? "Generated image"}
        className="nx-generated-img"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <div className="nx-image-actions">
        <button className="nx-img-btn" onClick={handleOpen}>🔍 Buka</button>
        <button className="nx-img-btn" onClick={handleDownload}>⬇️ Unduh</button>
      </div>
      {prompt && (
        <div className="nx-image-prompt">
          Prompt: {prompt}
        </div>
      )}
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  if (isImageContent(content)) {
    return <ImageBubble content={content} />;
  }
  return <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{content}</span>;
}

export default function ChatThread({ conversationId, selectedModel }: ChatThreadProps) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");

  const { data: conversationData, isLoading: isLoadingConv } =
    useGetOpenaiConversation(conversationId, {
      query: {
        enabled: !!conversationId,
        queryKey: getGetOpenaiConversationQueryKey(conversationId),
      },
    });

  const { data: listMessages, isLoading: isLoadingMessages } =
    useListOpenaiMessages(conversationId, {
      query: {
        enabled: !!conversationId,
        queryKey: getListOpenaiMessagesQueryKey(conversationId),
      },
    });

  const isLoading = isLoadingConv || isLoadingMessages;
  const messages = listMessages ?? conversationData?.messages ?? [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isGeneratingImage]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleGenerateImage = async (prompt: string) => {
    setIsGeneratingImage(true);
    setImagePrompt(prompt);
    setInput("");

    // Optimistic user message
    queryClient.setQueryData(
      getGetOpenaiConversationQueryKey(conversationId),
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...old.messages,
            {
              id: Date.now(),
              conversationId,
              role: "user",
              content: `/gambar ${prompt}`,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
    );

    try {
      const res = await fetch("/api/openai/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, conversationId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Gagal generate gambar");
      }
    } catch (err: any) {
      // error sudah disimpan ke DB dari server
    } finally {
      setIsGeneratingImage(false);
      setImagePrompt("");
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming || isGeneratingImage) return;

    const userMessage = input.trim();

    // Cek apakah command /gambar
    const gambarMatch = userMessage.match(/^\/gambar\s+(.+)/i);
    if (gambarMatch) {
      await handleGenerateImage(gambarMatch[1].trim());
      return;
    }

    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    queryClient.setQueryData(
      getGetOpenaiConversationQueryKey(conversationId),
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...old.messages,
            {
              id: Date.now(),
              conversationId,
              role: "user",
              content: userMessage,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
    );

    try {
      const res = await fetch(
        `/api/openai/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ content: userMessage, model: selectedModel }),
        }
      );

      if (!res.ok) throw new Error("Gagal mengirim pesan");

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.content) setStreamingContent(data.content);
      } else {
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
            const line = part.replace(/^data: /, "").trim();
            if (!line) continue;
            try {
              const evt = JSON.parse(line);
              if (evt.content) {
                setStreamingContent((prev) => prev + evt.content);
              }
            } catch {
              // skip malformed
            }
          }
        }
      }
    } catch {
      setStreamingContent("Server AI sedang sibuk. Coba lagi ya!");
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageButton = () => {
    setInput("/gambar ");
    inputRef.current?.focus();
  };

  if (isLoading) {
    return (
      <div className="nx-chat-messages" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="nx-typing">
          <div className="nx-typing-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="nx-chat-messages">
        {messages.length === 0 && !isStreaming && !isGeneratingImage && (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 14,
              marginTop: 40,
            }}
          >
            Ketik pesan atau gunakan <strong>/gambar [deskripsi]</strong> untuk generate gambar.
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`nx-message ${msg.role === "user" ? "nx-user-msg" : "nx-ai-msg"}`}
            data-testid={`msg-${msg.id}`}
          >
            <div className="nx-msg-content">
              <MessageContent content={msg.content} />
            </div>
            <div className="nx-msg-time">{getCurrentTime()}</div>
          </div>
        ))}

        {/* Streaming text bubble */}
        {isStreaming && (
          <div className="nx-message nx-ai-msg">
            <div className="nx-msg-content">
              {streamingContent || ""}
              <span className="nx-cursor" />
            </div>
          </div>
        )}

        {/* Typing dots */}
        {isStreaming && !streamingContent && (
          <div className="nx-typing">
            <div className="nx-typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* Image generating state */}
        {isGeneratingImage && (
          <div className="nx-message nx-ai-msg">
            <div className="nx-msg-content nx-img-loading">
              <div className="nx-img-spinner" />
              <span>Sedang membuat gambar "{imagePrompt}"...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="nx-input-area">
        {/* Toolbar */}
        <div className="nx-toolbar">
          <button
            className="nx-tool-btn"
            onClick={handleImageButton}
            title="Generate Gambar"
            disabled={isStreaming || isGeneratingImage}
          >
            🎨 Buat Gambar
          </button>
        </div>

        <div className="nx-input-container">
          <textarea
            ref={inputRef}
            className="nx-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGeneratingImage ? "Membuat gambar..." : "Ketik pesan atau /gambar [deskripsi]..."}
            rows={1}
            disabled={isStreaming || isGeneratingImage}
            data-testid="input-message"
          />
          <button
            className="nx-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || isGeneratingImage}
            data-testid="button-send"
          >
            ✈ KIRIM
          </button>
        </div>
      </div>
    </>
  );
}
