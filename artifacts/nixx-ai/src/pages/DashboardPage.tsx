import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
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
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getModelById, AI_MODELS } from "@/lib/models";
import { Menu } from "lucide-react";

interface TempMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  conversationId?: number | null;
}

export default function DashboardPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState("deepseekv3");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [localUserMessage, setLocalUserMessage] = useState<TempMessage | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useListOpenaiConversations();
  const { data: activeConvData } = useGetOpenaiConversation(activeConvId!, {
    query: { enabled: !!activeConvId, queryKey: getGetOpenaiConversationQueryKey(activeConvId!) },
  });
  const createConv = useCreateOpenaiConversation();
  const deleteConv = useDeleteOpenaiConversation();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) (viewport as HTMLElement).scrollTop = (viewport as HTMLElement).scrollHeight;
    }
  };

  useEffect(() => { scrollToBottom(); }, [activeConvData?.messages, streamingMessage, localUserMessage]);

  const handleNewChat = () => {
    setActiveConvId(null);
    setStreamingMessage("");
    setLocalUserMessage(null);
  };

  const handleDelete = (id: number) => {
    deleteConv.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        if (activeConvId === id) setActiveConvId(null);
      },
    });
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    let targetConvId = activeConvId;
    const modelObj = getModelById(selectedModelId);

    if (!targetConvId) {
      try {
        const newConv = await createConv.mutateAsync({
          data: { title: content.slice(0, 50) + (content.length > 50 ? "..." : "") },
        });
        targetConvId = newConv.id;
        setActiveConvId(targetConvId);
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      } catch { return; }
    }

    setIsStreaming(true);
    setStreamingMessage("");
    setLocalUserMessage({ id: `temp-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() });

    try {
      const response = await fetch(`/api/openai/conversations/${targetConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, model: modelObj.actualModel }),
      });
      if (!response.ok) throw new Error("Failed");

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream")) {
        const reader = response.body!.getReader();
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
            if (!line) continue;
            try {
              const evt = JSON.parse(line);
              if (evt.content) setStreamingMessage(prev => prev + evt.content);
            } catch { /* skip */ }
          }
        }
      }
    } catch { /* silent */ } finally {
      setIsStreaming(false);
      setLocalUserMessage(null);
      setStreamingMessage("");
      if (targetConvId) {
        queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(targetConvId) });
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      }
    }
  };

  const existingMessages = (activeConvData?.messages ?? []) as TempMessage[];
  const displayMessages: TempMessage[] = [
    ...existingMessages,
    ...(localUserMessage ? [localUserMessage] : []),
    ...(isStreaming ? [{ id: "streaming", role: "assistant", content: streamingMessage, createdAt: new Date().toISOString() }] : []),
  ];

  const initials = user
    ? (`${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.trim() || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase())
    : "U";
  const currentModel = getModelById(selectedModelId);
  const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

  return (
    <div className="h-dvh flex overflow-hidden" style={{ background: "hsl(248, 30%, 6%)" }}>
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={setActiveConvId}
        onNew={handleNewChat}
        onDelete={handleDelete}
        selectedModelId={selectedModelId}
        onModelChange={setSelectedModelId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        basePath={basePath}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #c026d3 100%)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8 flex items-center justify-center rounded-full text-white/80 hover:bg-white/20 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Avatar className="h-8 w-8 border-2 border-white/30">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="text-white font-bold text-xs" style={{ background: "rgba(255,255,255,0.2)" }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Nixx AI</p>
              <p className="text-white/75 text-xs">26 Model AI · Gratis Selamanya ✨</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white" style={{ background: "rgba(255,255,255,0.15)" }}>
            <span>{currentModel.emoji}</span>
            <span className="hidden sm:inline">{currentModel.label}</span>
          </div>
        </div>

        <ScrollArea ref={scrollRef} className="flex-1">
          <div className="flex flex-col min-h-full">
            {displayMessages.length === 0 && !isStreaming ? (
              <div className="flex-1 flex items-center justify-center p-6" style={{ minHeight: "60vh" }}>
                <WelcomeScreen onPrompt={handleSendMessage} />
              </div>
            ) : (
              <MessageList
                messages={displayMessages}
                isLoading={isStreaming && !streamingMessage}
                userAvatarUrl={user?.imageUrl}
                userInitials={initials}
              />
            )}
          </div>
        </ScrollArea>

        <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
      </main>
    </div>
  );
}
