import React from "react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { OpenaiConversation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ChatSidebarProps {
  conversations: OpenaiConversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onDelete: (id: number) => void;
}

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2 text-primary">
          <span className="font-mono text-lg font-bold tracking-tight">Nixx</span>
        </div>
      </div>

      <div className="px-3 pb-4">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-accent hover:bg-accent/80 text-accent-foreground border border-border shadow-sm rounded-lg"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          Percakapan Baru
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-1 pb-4">
          {conversations.length === 0 ? (
            <div className="px-2 py-8 text-center text-xs text-muted-foreground">
              Belum ada percakapan.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  activeId === conv.id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
                onClick={() => onSelect(conv.id)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className={`h-4 w-4 shrink-0 ${activeId === conv.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate">{conv.title || "Percakapan Tanpa Judul"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(conv.createdAt), "d MMM yyyy", { locale: id })}
                    </span>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 h-6 w-6 opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-border bg-card">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Percakapan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Percakapan "{conv.title}" akan dihapus permanen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent hover:bg-accent hover:text-accent-foreground border-border">Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conv.id);
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
