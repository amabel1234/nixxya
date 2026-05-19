import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useGetOpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
  getGetOpenaiConversationQueryKey,
  getSendOpenaiMessageUrl,
} from "@workspace/api-client-react";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getModelById } from "@/lib/models";
import { toast } from "sonner";
import { Menu } from "lucide-react";

interface StreamingMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function DashboardContent() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>("gpt-5.4");
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [localUserMessage, setLocalUserMessage] = useState<StreamingMessage | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useListOpenaiConversations();
  const { data: activeConvData, isLoading: isLoadingConv } = useGetOpenaiConversation(
    activeConvId!,
    { query: { enabled: !!activeConvId, queryKey: getGetOpenaiConversationQueryKey(activeConvId!) } }
  );

  const createConv = useCreateOpenaiConversation();
  const deleteConv = useDeleteOpenaiConversation();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConvData?.messages, streamingMessage, localUserMessage]);

  const handleNewChat = useCallback(() => {
    setActiveConvId(null);
    setStreamingMessage("");
    setLocalUserMessage(null);
  }, []);

  const handleClearChat = () => {
    handleNewChat();
    toast.success("Chat dibersihkan");
  };

  const handleDelete = (id: number) => {
    deleteConv.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          if (activeConvId === id) setActiveConvId(null);
          toast.success("Percakapan dihapus");
        },
        onError: () => toast.error("Gagal menghapus percakapan"),
      }
    );
  };

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    let targetConvId = activeConvId;
    const modelObj = getModelById(selectedModelId);

    if (!targetConvId) {
      try {
        const newConv = await createConv.mutateAsync({
          data: {
            title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
            model: modelObj.actualModel,
          },
        });
        targetConvId = newConv.id;
        setActiveConvId(targetConvId);
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      } catch {
        toast.error("Gagal memulai percakapan. Coba lagi.");
        return;
      }
    }

    setIsStreaming(true);
    setStreamingMessage("");
    setLocalUserMessage({
      id: `temp-user-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    });

    try {
      const response = await fetch(getSendOpenaiMessageUrl(targetConvId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, model: modelObj.actualModel }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) throw new Error(data.error);
              if (data.content) {
                fullResponse += data.content;
                setStreamingMessage(fullResponse);
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message !== "Unexpected token") {
                throw parseErr;
              }
            }
          }
        }
      }

      await queryClient.invalidateQueries({
        queryKey: getGetOpenaiConversationQueryKey(targetConvId),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal mengirim: ${msg}`);
    } finally {
      setIsStreaming(false);
      setLocalUserMessage(null);
      setStreamingMessage("");
    }
  }, [activeConvId, selectedModelId, isStreaming, createConv, queryClient]);

  const handleStartChatWithModel = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    handleNewChat();
  }, [handleNewChat]);

  const displayMessages: any[] = activeConvData?.messages ? [...activeConvData.messages] : [];
  if (localUserMessage) displayMessages.push(localUserMessage);
  if (isStreaming) {
    displayMessages.push({
      id: "streaming-response",
      role: "assistant",
      content: streamingMessage || " ",
      conversationId: activeConvId!,
      createdAt: new Date().toISOString(),
    });
  }

  const initials = user
    ? `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.trim() ||
      user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()
    : "U";

  const currentModel = getModelById(selectedModelId);
  const showWelcome = !activeConvId && !localUserMessage;

  return (
    <div className="h-[100dvh] flex overflow-hidden" style={{ background: "hsl(248, 30%, 6%)" }}>
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={setActiveConvId}
        onNew={handleNewChat}
        onDelete={handleDelete}
        selectedModelId={selectedModelId}
        onModelChange={setSelectedModelId}
        onClearChat={handleClearChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onStartChatWithModel={handleStartChatWithModel}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #c026d3 100%)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8 flex items-center justify-center rounded-full text-white/80 hover:bg-white/20 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Avatar className="h-8 w-8 border-2 border-white/30">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback
                className="text-white font-bold text-xs"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Nixx AI</p>
              <p className="text-white/75 text-xs">26 Model AI · Gratis Selamanya ✨</p>
            </div>
          </div>
          {/* Tap to change model */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:bg-white/20 active:scale-95"
            style={{ background: "rgba(255,255,255,0.15)" }}
            title="Ganti model AI"
          >
            <span>{currentModel.emoji}</span>
            <span className="hidden sm:inline">{currentModel.label}</span>
            <span className="sm:hidden">{currentModel.badge}</span>
          </button>
        </div>

        {/* Chat area */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          {showWelcome ? (
            <div className="min-h-full flex items-center justify-center p-4">
              <WelcomeScreen
                onPrompt={handleSendMessage}
                disabled={isStreaming}
              />
            </div>
          ) : (
            <div className="py-4">
              <MessageList
                messages={displayMessages}
                isLoading={isLoadingConv || (isStreaming && !streamingMessage)}
                userAvatarUrl={user?.imageUrl}
                userInitials={initials}
              />
            </div>
          )}
        </ScrollArea>

        <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
      </main>
    </div>
  );
}
