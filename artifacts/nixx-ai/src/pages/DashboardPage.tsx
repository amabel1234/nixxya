import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { getModelById } from "@/lib/models";
import { Menu } from "lucide-react";

interface TempMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState("deepseekv3");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingUserMsg, setPendingUserMsg] = useState<TempMessage | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useListOpenaiConversations();
  const { data: activeConvData } = useGetOpenaiConversation(activeConvId!, {
    query: { enabled: !!activeConvId, queryKey: getGetOpenaiConversationQueryKey(activeConvId!) },
  });
  const createConv = useCreateOpenaiConversation();
  const deleteConv = useDeleteOpenaiConversation();

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const vp = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (vp) (vp as HTMLElement).scrollTop = (vp as HTMLElement).scrollHeight;
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [activeConvData?.messages, streamingContent, pendingUserMsg]);

  const handleNewChat = () => { setActiveConvId(null); setStreamingContent(""); setPendingUserMsg(null); };

  const handleClearChat = () => {
    setStreamingContent("");
    setPendingUserMsg(null);
    if (activeConvId) {
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(activeConvId) });
    }
    setActiveConvId(null);
  };

  const handleDelete = (id: number) => {
    deleteConv.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        if (activeConvId === id) handleNewChat();
      },
    });
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    let convId = activeConvId;
    const modelObj = getModelById(selectedModelId);

    if (!convId) {
      try {
        const newConv = await createConv.mutateAsync({
          data: { title: content.slice(0, 50) + (content.length > 50 ? "..." : "") },
        });
        convId = newConv.id;
        setActiveConvId(convId);
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      } catch { return; }
    }

    setIsStreaming(true);
    setStreamingContent("");
    setPendingUserMsg({ id: `u-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() });

    try {
      const res = await fetch(`/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, model: modelObj.actualModel }),
      });
      if (!res.ok) throw new Error("Failed");

      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.replace(/^data:\s*/, "").trim();
            if (!line) continue;
            try { const e = JSON.parse(line); if (e.content) setStreamingContent(p => p + e.content); } catch { /* skip */ }
          }
        }
      }
    } catch { /* silent */ } finally {
      const finalConvId = convId;
      setIsStreaming(false);
      setPendingUserMsg(null);
      setStreamingContent("");
      if (finalConvId) {
        queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(finalConvId) });
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      }
    }
  };

  const persisted = (activeConvData?.messages ?? []) as TempMessage[];
  // Only add streaming message when there's actual content (no empty bubble)
  const displayMessages: TempMessage[] = [
    ...persisted,
    ...(pendingUserMsg ? [pendingUserMsg] : []),
    ...(isStreaming && streamingContent
      ? [{ id: "streaming", role: "assistant", content: streamingContent, createdAt: new Date().toISOString() }]
      : []),
  ];
  const showLoadingDots = isStreaming && !streamingContent;

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
        onClearChat={handleClearChat}
        selectedModelId={selectedModelId}
        onModelChange={setSelectedModelId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        basePath={basePath}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #c026d3 100%)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-full border-2 border-white/30 text-white hover:bg-white/20 transition-colors"
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
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
          >
            <span>{currentModel.emoji}</span>
            <span className="hidden sm:inline">{currentModel.label}</span>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1">
          <div className="flex flex-col min-h-full">
            {displayMessages.length === 0 && !isStreaming ? (
              <div className="flex-1 flex items-center justify-center p-6" style={{ minHeight: "65vh" }}>
                <WelcomeScreen onPrompt={handleSend} />
              </div>
            ) : (
              <MessageList
                messages={displayMessages}
                isLoading={showLoadingDots}
                userAvatarUrl={user?.imageUrl}
                userInitials={initials}
              />
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </main>
    </div>
  );
}
