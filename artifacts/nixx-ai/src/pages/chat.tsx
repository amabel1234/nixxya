import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
  getGetOpenaiConversationQueryKey,
} from "@workspace/api-client-react";
import ChatSidebar from "@/components/chat-sidebar";
import ChatThread from "@/components/chat-thread";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const queryClient = useQueryClient();
  const { data: conversations = [], isLoading: isLoadingConversations } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();
  const deleteConversation = useDeleteOpenaiConversation();

  // If there are conversations and none is active, set the first one as active
  useEffect(() => {
    if (!isLoadingConversations && conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId, isLoadingConversations]);

  const handleNewChat = () => {
    createConversation.mutate(
      { data: { title: "Percakapan Baru" } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          setActiveConversationId(newConv.id);
          // Auto-close sidebar on mobile after selection
          if (window.innerWidth < 768) {
            setSidebarOpen(false);
          }
        },
      }
    );
  };

  const handleDeleteChat = (id: number) => {
    deleteConversation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
          if (activeConversationId === id) {
            setActiveConversationId(null);
          }
        },
      }
    );
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 lg:w-72 transform border-r border-border bg-sidebar transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ChatSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={(id) => {
            setActiveConversationId(id);
            if (window.innerWidth < 768) setSidebarOpen(false);
          }}
          onNewChat={handleNewChat}
          onDelete={handleDeleteChat}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col relative">
        {/* Header (visible mainly on mobile to open sidebar) */}
        <header className="absolute top-0 left-0 right-0 z-10 flex h-14 items-center gap-2 border-b border-border/40 bg-background/80 px-4 backdrop-blur md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-muted-foreground">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="text-sm font-semibold tracking-wide text-foreground">Nixx AI</div>
        </header>

        {activeConversationId ? (
          <ChatThread conversationId={activeConversationId} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div className="flex flex-col items-center gap-6 max-w-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
                <span className="font-mono text-2xl font-bold">N</span>
              </div>
              <div>
                <h2 className="text-xl font-medium tracking-tight text-foreground mb-2">Nixx AI</h2>
                <p className="text-sm text-muted-foreground">
                  Ruang menulis privat yang berpikir bersama Anda. Mulai percakapan baru untuk mengeksplorasi ide.
                </p>
              </div>
              <Button onClick={handleNewChat} className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 rounded-full px-8">
                Mulai Percakapan
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
