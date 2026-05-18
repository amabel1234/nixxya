import React from "react";
import { format } from "date-fns";
import { Trash2, LogOut } from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
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
  { emoji: "👨‍💻", label: "DEVELOPER 🚀", action: () => alert("Developer: Nixx Team\nContact: t.me/nixsukakamu") },
  { emoji: "🏪", label: "STORE MENU 🛍️", action: () => window.open("https://list.unix.biz.id", "_blank") },
  { emoji: "👥", label: "COMMUNITY 🌐", action: () => window.open("https://t.me/nixsukakamu", "_blank") },
  { emoji: "💖", label: "SAWERIA ✨", action: () => window.open("https://iili.io/f7GFZcF.png", "_blank") },
];

export function ConversationSidebar({
  conversations, activeId, onSelect, onNew, onDelete, onClearChat,
  selectedModelId, onModelChange, open, onClose, basePath,
}: ConversationSidebarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const cardBase: React.CSSProperties = {
    background: "hsl(248, 28%, 11%)",
    border: "1px solid hsl(248, 25%, 18%)",
    borderRadius: "14px",
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px] flex flex-col transition-transform duration-300 md:static md:translate-x-0 md:z-auto md:w-[300px] md:max-w-none md:shrink-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "hsl(248, 30%, 6%)", borderRight: "1px solid hsl(248, 25%, 14%)" }}
      >
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          {/* New Chat button */}
          <button
            onClick={() => { onNew(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "hsl(248, 28%, 13%)", border: "1px solid hsl(248, 25%, 22%)" }}
          >
            <span className="text-xl">✏️</span>
            <span className="tracking-wide">PERCAKAPAN BARU</span>
          </button>

          {/* Conversation list */}
          {conversations.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold px-1 pt-1 pb-0.5 tracking-widest uppercase" style={{ color: "hsl(248, 15%, 40%)" }}>
                Percakapan
              </p>
              {conversations.slice(0, 15).map((conv) => (
                <div
                  key={conv.id}
                  className="group flex items-center gap-2 px-3 py-2.5 rounded-2xl cursor-pointer transition-all"
                  style={activeId === conv.id
                    ? { background: "rgba(168, 85, 247, 0.2)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: "14px" }
                    : cardBase}
                  onClick={() => { onSelect(conv.id); onClose(); }}
                >
                  <span className="text-base shrink-0">💬</span>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate" style={{ color: activeId === conv.id ? "#e9d5ff" : "hsl(0,0%,90%)" }}>
                      {conv.title || "Percakapan — Nixx AI"}
                    </p>
                    <p className="text-[11px]" style={{ color: "hsl(248, 15%, 45%)" }}>
                      {format(new Date(conv.createdAt), "d MMM yyyy")}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm("Hapus?")) onDelete(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-lg transition-all hover:bg-red-500/20 hover:text-red-400 shrink-0"
                    style={{ color: "hsl(248,15%,50%)" }}
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
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={cardBase}
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}

            {/* Clear Chat */}
            <button
              onClick={() => { onClearChat(); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "14px", color: "#f87171" }}
            >
              <span className="text-xl">🗑️</span>
              <span>CLEAR CHAT 🗑️</span>
            </button>
          </div>

          {/* Model selector */}
          <div className="pt-1 space-y-1.5">
            <p className="text-xs font-bold px-1 pt-1 pb-0.5 tracking-widest uppercase" style={{ color: "hsl(248, 15%, 40%)" }}>
              Select AI Model:
            </p>
            {AI_MODELS.map((model) => {
              const isActive = selectedModelId === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => { onModelChange(model.id); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={isActive
                    ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)", border: "none", borderRadius: "14px", color: "white" }
                    : cardBase}
                >
                  <span className="text-lg">{model.emoji}</span>
                  <span className="flex-1 text-left" style={{ color: isActive ? "white" : "hsl(0,0%,85%)" }}>{model.label}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={isActive
                      ? { background: "rgba(255,255,255,0.25)", color: "white" }
                      : { background: "rgba(168,85,247,0.15)", color: "#a855f7" }}
                  >
                    {model.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sign out footer */}
        <div className="p-3 shrink-0" style={{ borderTop: "1px solid hsl(248, 25%, 14%)" }}>
          <button
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "14px", color: "#f87171" }}
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
