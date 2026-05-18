import React from "react";
import { format } from "date-fns";
import { Plus, Trash2, LogOut, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useClerk } from "@clerk/clerk-react";
import { AI_MODELS } from "@/lib/models";
import type { OpenaiConversation } from "@workspace/api-client-react";

interface ConversationSidebarProps {
  conversations: OpenaiConversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  selectedModelId: string;
  onModelChange: (id: string) => void;
  open: boolean;
  onClose: () => void;
  basePath: string;
}

const MENU_ITEMS = [
  { emoji: "👨‍💻", label: "Developer", action: () => alert("Developer: Nixx Team\nContact: t.me/nixsukakamu") },
  { emoji: "🏪", label: "Store Menu", action: () => window.open("https://list.unix.biz.id", "_blank") },
  { emoji: "👥", label: "Community", action: () => window.open("https://t.me/nixsukakamu", "_blank") },
  { emoji: "💖", label: "Saweria", action: () => window.open("https://iili.io/f7GFZcF.png", "_blank") },
];

export function ConversationSidebar({
  conversations, activeId, onSelect, onNew, onDelete,
  selectedModelId, onModelChange, open, onClose, basePath,
}: ConversationSidebarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const initials = user
    ? (`${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.trim() || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase())
    : "U";

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[300px] flex flex-col transition-transform duration-300 md:static md:translate-x-0 md:z-auto md:w-[280px] md:max-w-none md:shrink-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "hsl(248, 30%, 6%)", borderRight: "1px solid hsl(248, 25%, 14%)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #c026d3 100%)" }}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-white/30">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="text-white font-bold text-sm" style={{ background: "rgba(255,255,255,0.2)" }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold text-white text-sm leading-tight">{user?.firstName ?? "User"}</div>
              <div className="text-white/80 text-xs">Nixx AI</div>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden h-8 w-8 flex items-center justify-center rounded-full text-white/80 hover:bg-white/20 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            <button
              onClick={() => { onNew(); onClose(); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95 mb-2"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
            >
              <Plus className="h-4 w-4" />
              Chat Baru
            </button>

            {conversations.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold px-2 py-1 uppercase tracking-wider" style={{ color: "hsl(248, 15%, 45%)" }}>
                  Percakapan
                </p>
                <div className="space-y-0.5">
                  {conversations.slice(0, 20).map((conv) => (
                    <div
                      key={conv.id}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${activeId === conv.id ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                      style={activeId === conv.id ? { background: "rgba(124, 58, 237, 0.3)" } : {}}
                      onClick={() => { onSelect(conv.id); onClose(); }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-base shrink-0">💬</span>
                        <div className="overflow-hidden">
                          <p className="text-xs font-medium truncate">{conv.title || "Chat Baru"}</p>
                          <p className="text-[10px]" style={{ color: "hsl(248, 15%, 45%)" }}>
                            {format(new Date(conv.createdAt), "d MMM yyyy")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm("Hapus percakapan?")) onDelete(conv.id); }}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded transition-all hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-2 space-y-0.5" style={{ borderColor: "hsl(248, 25%, 14%)" }}>
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-white/5 text-white/60 hover:text-white"
                >
                  <span>{item.emoji}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="border-t pt-2" style={{ borderColor: "hsl(248, 25%, 14%)" }}>
              <p className="text-xs font-semibold px-2 py-1 uppercase tracking-wider mb-1" style={{ color: "hsl(248, 15%, 45%)" }}>
                Pilih Model AI
              </p>
              <div className="space-y-0.5 max-h-60 overflow-y-auto">
                {AI_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { onModelChange(model.id); onClose(); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${selectedModelId === model.id ? "text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                    style={selectedModelId === model.id ? { background: "rgba(124, 58, 237, 0.3)" } : {}}
                  >
                    <span>{model.emoji}</span>
                    <span className="flex-1 text-left truncate">{model.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}>
                      {model.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-3 shrink-0" style={{ borderTop: "1px solid hsl(248, 25%, 14%)" }}>
          <button
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
