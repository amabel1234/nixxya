import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetOpenaiConversation, useListOpenaiMessages, getGetOpenaiConversationQueryKey, getListOpenaiConversationsQueryKey, getListOpenaiMessagesQueryKey } from "@workspace/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, CornerDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatThreadProps {
  conversationId: number;
}

export default function ChatThread({ conversationId }: ChatThreadProps) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const { data: conversationData, isLoading: isLoadingConv } = useGetOpenaiConversation(conversationId, {
    query: {
      enabled: !!conversationId,
      queryKey: getGetOpenaiConversationQueryKey(conversationId),
    },
  });

  const { data: listMessages, isLoading: isLoadingMessages } = useListOpenaiMessages(conversationId, {
    query: {
      enabled: !!conversationId,
      queryKey: getListOpenaiMessagesQueryKey(conversationId),
    },
  });

  const isLoading = isLoadingConv || isLoadingMessages;
  const messages = listMessages || conversationData?.messages || [];

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    // Optimistically update the UI with the user's message
    queryClient.setQueryData(getGetOpenaiConversationQueryKey(conversationId), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        messages: [
          ...old.messages,
          {
            id: Date.now(), // temporary ID
            conversationId,
            role: "user",
            content: userMessage,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });

    try {
      const res = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!res.ok) throw new Error("Failed to send message");

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
            if (evt.done) {
              // Finish streaming
            }
          } catch (e) {
            console.error("Failed to parse SSE event", e);
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // In a real app, we'd show a toast error here
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      // Invalidate to get the final saved messages from the DB
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

  if (isLoading) {
    return (
      <div className="flex h-full flex-col pt-14 md:pt-0 items-center justify-center">
        <div className="h-6 w-6 animate-pulse rounded-full bg-primary/50" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col pt-14 md:pt-0">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[85%] rounded-2xl px-5 py-3.5 text-sm md:text-base leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-accent/50 text-foreground border border-border/50 rounded-tl-sm shadow-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                </div>
              </motion.div>
            ))}
            
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full justify-start"
              >
                <div className="relative max-w-[85%] rounded-2xl bg-accent/50 text-foreground border border-border/50 rounded-tl-sm px-5 py-3.5 text-sm md:text-base leading-relaxed shadow-sm">
                  <div className="whitespace-pre-wrap font-sans">
                    {streamingContent}
                    <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
                  </div>
                </div>
              </motion.div>
            )}
            
            {messages.length === 0 && !isStreaming && (
              <div className="flex h-[40vh] items-center justify-center text-muted-foreground text-sm">
                Ketik pesan untuk memulai.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-background/80 p-4 backdrop-blur-sm border-t border-border/50">
        <div className="mx-auto max-w-3xl relative">
          <div className="relative flex w-full items-end gap-2 rounded-xl border border-input bg-accent/30 p-1 focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis sesuatu..."
              className="min-h-[44px] max-h-48 w-full resize-none border-0 bg-transparent py-3 px-4 shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/60"
              rows={1}
            />
            <div className="flex flex-col justify-end pb-1 pr-1">
              <Button
                size="icon"
                disabled={!input.trim() || isStreaming}
                onClick={handleSend}
                className="h-9 w-9 shrink-0 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-2 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            Tekan <kbd className="font-mono bg-accent px-1 py-0.5 rounded text-[9px]">Enter</kbd> untuk mengirim, <kbd className="font-mono bg-accent px-1 py-0.5 rounded text-[9px]">Shift + Enter</kbd> untuk baris baru
          </div>
        </div>
      </div>
    </div>
  );
}
