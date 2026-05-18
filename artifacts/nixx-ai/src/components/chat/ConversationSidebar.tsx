import React from "react";
import { format } from "date-fns";
import { Trash2, LogOut, X } from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AI_MODELS } from "@/lib/models";
import type { OpenaiConversation } from "@workspace/api-client-react";

interface ConversationSidebarProps {
  conversations: OpenaiConversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  onClearChat: () => void;
  selectedModelId: string;
  onModelChange: (id: string) => void;
  open: boolean;
  onClose: () => void;
  basePath: string;
}

const MENU_ITEMS = [
  { emoji: "👨‍💻", label: "DEVELOPER", tag: "🚀", action: () => alert("Developer: Nixx Team\nContact: t.me/nixsukakamu") },
  { emoji: "🏪", label: "STORE MENU", tag: "🛍️", action: () => window.open("https://list.unix.biz.id", "_blank") },
  { emoji: "👥", label: "COMMUNITY", tag: "🌐", action: () => window.open("https://t.me/nixsukakamu", "_blank") },
  { emoji: "💖", label: "SAWERIA", tag: "✨", action: () => window.open("https://iili.io/f7GFZcF.png", "_blank") },
];

export function ConversationSidebar({
  conversations, activeId, onSelect, onNew, onDelete, onClearChat,
  selectedModelId, onModelChange, open, onClose, basePath,
}: ConversationSidebarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const card: React.CSSProperties = {
    background: "hsl(248,28%,10%)",
    border: "1px solid hsl(248,25%,17%)",
    borderRadius: "16px",
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px] flex flex-col transition-transform duration-300 md:static md:translate-x-0 md:z-auto md:w-[300px] md:max-w-none md:shrink-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "hsl(248,30%,5%)", borderRight: "1px solid hsl(248,25%,13%)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9 shrink-0" style={{ border: "2px solid hsl(248,40%,40%)" }}>
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="text-white font-bold text-sm" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                {user?.firstName?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{user?.firstName ?? "User"}</p>
              <p className="text-xs" style={{ color: "hsl(248,15%,50%)" }}>Nixx AI</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden h-8 w-8 flex items-center justify-center rounded-full text-white/60 hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">

          {/* New Chat */}
          <button
            onClick={() => { onNew(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-white text-sm font-bold tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
            style={card}
          >
            <span className="text-lg">✏️</span>
            <span>PERCAKAPAN BARU</span>
          </button>

          {/* Conversations */}
          {conversations.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold tracking-widest uppercase px-1 py-1" style={{ color: "hsl(248,15%,38%)" }}>Percakapan</p>
              {conversations.slice(0, 15).map((conv) => (
                <div
                  key={conv.id}
                  className="group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all"
                  style={activeId === conv.id
                    ? { background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.35)", borderRadius: "16px" }
                    : card}
                  onClick={() => { onSelect(conv.id); onClose(); }}
                >
                  <span className="text-base shrink-0">💬</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: activeId === conv.id ? "#e9d5ff" : "hsl(0,0%,88%)" }}>
                      {conv.title || "Percakapan — Nixx AI"}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "hsl(248,15%,42%)" }}>
                      {format(new Date(conv.createdAt), "d MMM yyyy")}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm("Hapus percakapan ini?")) onDelete(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-xl transition-all shrink-0"
                    style={{ color: "hsl(248,15%,45%)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(248,15%,45%)")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Menu items */}
          <div className="space-y-1.5 pt-1">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-white text-sm font-bold transition-all hover:opacity-80 active:scale-[0.98]"
                style={card}
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="flex-1 text-left tracking-wide">{item.label} {item.tag}</span>
              </button>
            ))}

            {/* Clear Chat */}
            <button
              onClick={() => { onClearChat(); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold transition-all hover:opacity-80 active:scale-[0.98]"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "16px", color: "#f87171" }}
            >
              <span className="text-xl">🗑️</span>
              <span className="tracking-wide">CLEAR CHAT 🗑️</span>
            </button>
          </div>

          {/* Model selector */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-bold tracking-widest uppercase px-1 py-1" style={{ color: "hsl(248,15%,38%)" }}>Select AI Model:</p>
            <div className="space-y-1.5">
              {AI_MODELS.map((model) => {
                const active = selectedModelId === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => { onModelChange(model.id); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={active
                      ? { background: "linear-gradient(135deg,#7c3aed,#ec4899)", border: "none", borderRadius: "16px", color: "white" }
                      : card}
                  >
                    <span className="text-lg">{model.emoji}</span>
                    <span className="flex-1 text-left" style={{ color: active ? "white" : "hsl(0,0%,82%)" }}>{model.label}</span>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={active
                        ? { background: "rgba(255,255,255,0.22)", color: "white" }
                        : { background: "rgba(168,85,247,0.15)", color: "#a855f7" }}
                    >
                      {model.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="px-3 py-3 shrink-0" style={{ borderTop: "1px solid hsl(248,25%,12%)" }}>
          <button
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "16px", color: "#f87171" }}
          >
            <LogOut className="h-4 w-4" />
            <span>[→ Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
