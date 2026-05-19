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
  initialMessage?: string | null;
  onInitialMessageSent?: () => void;
}

function getCurrentTime() {
  const now = new Date();
  return (
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0")
  );
}

export default function ChatThread({ conversationId, selectedModel, initialMessage, onInitialMessageSent }: ChatThreadProps) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const didSendInitial = useRef(false);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

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
  }, [messages, streamingContent]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage = text.trim();
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
      queryClient.invalidateQueries({
        queryKey: getGetOpenaiConversationQueryKey(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: getListOpenaiMessagesQueryKey(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: getListOpenaiConversationsQueryKey(),
      });
    }
  };

  useEffect(() => {
    if (initialMessage && !didSendInitial.current && !isLoading) {
      didSendInitial.current = true;
      onInitialMessageSent?.();
      sendMessage(initialMessage);
    }
  }, [initialMessage, isLoading]);

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
        {messages.length === 0 && !isStreaming && (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 14,
              marginTop: 40,
            }}
          >
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

        {isStreaming && streamingContent && (
          <div className="nx-message nx-ai-msg">
            <div className="nx-msg-content">
              {streamingContent}
              <span className="nx-cursor" />
            </div>
          </div>
        )}

        {isStreaming && !streamingContent && (
          <div className="nx-typing">
            <div className="nx-typing-dots">
              <span /><span /><span />
            </div>
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
        />
        <button
          className="nx-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
        >
          ► SEND
        </button>
      </div>
    </>
  );
}
