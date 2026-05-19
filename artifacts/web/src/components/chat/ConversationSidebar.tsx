import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, LogOut, X, Zap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useClerk } from "@clerk/react";
import { OpenaiConversation } from "@workspace/api-client-react";
import { AI_MODELS, AIModel } from "@/lib/models";

interface ConversationSidebarProps {
  conversations: OpenaiConversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  selectedModelId: string;
  onModelChange: (id: string) => void;
  onClearChat: () => void;
  open: boolean;
  onClose: () => void;
  onStartChatWithModel?: (modelId: string) => void;
}

const MENU_ITEMS = [
  { emoji: "👨‍💻", label: "DEVELOPER", key: "developer" },
  { emoji: "🏪", label: "STORE MENU", key: "store" },
  { emoji: "👥", label: "COMMUNITY", key: "community" },
  { emoji: "💖", label: "SAWERIA", key: "saweria" },
];

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  selectedModelId,
  onModelChange,
  onClearChat,
  open,
  onClose,
  onStartChatWithModel,
}: ConversationSidebarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [modelTab, setModelTab] = useState<"all" | "gpt" | "other">("all");

  const initials = user
    ? `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.trim() ||
      user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()
    : "U";

  const handleSignOut = () => {
    signOut({ redirectUrl: basePath || "/" });
  };

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
  };

  const handleModelChat = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onModelChange(modelId);
    onNew();
    onClose();
  };

  const filteredModels = AI_MODELS.filter((m) => {
    if (modelTab === "gpt") return m.group.startsWith("GPT") || m.group === "Reasoning" || m.group === "Code";
    if (modelTab === "other") return !m.group.startsWith("GPT") && m.group !== "Reasoning" && m.group !== "Code";
    return true;
  });

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px] flex flex-col transition-transform duration-300 md:static md:translate-x-0 md:z-auto md:w-[280px] md:max-w-none md:shrink-0 md:pointer-events-auto md:visible ${
          open ? "translate-x-0 pointer-events-auto visible" : "-translate-x-full pointer-events-none invisible"
        }`}
        style={{
          background: "hsl(248, 32%, 8%)",
          borderRight: "1px solid hsl(248, 25%, 14%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 60%, #c026d3 100%)" }}
        >
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 border-2 border-white/30">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="text-white font-bold text-sm" style={{ background: "rgba(255,255,255,0.2)" }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold text-white text-sm leading-tight">Nixx AI</div>
              <div className="text-white/80 text-[11px]">26 Model AI · Gratis Selamanya ✨</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-full text-white/80 hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {/* New Chat */}
            <button
              onClick={() => { onNew(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 mb-3"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              data-testid="button-new-chat"
            >
              <Plus className="h-4 w-4" />
              Chat Baru
            </button>

            {/* Conversations */}
            {conversations.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold px-2 py-1 uppercase tracking-widest mb-1" style={{ color: "hsl(248, 15%, 40%)" }}>
                  Percakapan
                </p>
                {conversations.slice(0, 8).map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all mb-0.5 ${
                      activeId === conv.id ? "text-white" : "text-white/55 hover:text-white/90"
                    }`}
                    style={activeId === conv.id ? { background: "rgba(124, 58, 237, 0.3)" } : { hover: "background: rgba(255,255,255,0.05)" }}
                    onClick={() => { onSelect(conv.id); onClose(); }}
                    data-testid={`conv-item-${conv.id}`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <span className="text-base shrink-0">💬</span>
                      <div className="overflow-hidden min-w-0">
                        <p className="text-xs font-medium truncate">{conv.title || "Chat Baru"}</p>
                        <p className="text-[10px]" style={{ color: "hsl(248, 15%, 40%)" }}>
                          {format(new Date(conv.createdAt), "d MMM")}
                        </p>
                      </div>
                    </div>
                    <button
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full shrink-0 ml-1 transition-all hover:bg-red-500/20"
                      style={{ color: "#f87171" }}
                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                      data-testid={`button-delete-conv-${conv.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Menu Items */}
            <div className="py-1 border-t" style={{ borderColor: "hsl(248, 25%, 15%)" }}>
              <p className="text-[10px] font-bold px-2 py-1 uppercase tracking-widest mb-1 mt-1" style={{ color: "hsl(248, 15%, 40%)" }}>
                Menu
              </p>
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.key}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left hover:bg-white/5 active:scale-95 mb-0.5"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  <span className="text-base shrink-0">{item.emoji}</span>
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => { onClearChat(); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left active:scale-95 mt-1"
                style={{ color: "#f87171", background: "rgba(239,68,68,0.08)" }}
              >
                <span className="text-base shrink-0">🗑️</span>
                CLEAR CHAT
              </button>
            </div>

            {/* Model List */}
            <div className="pt-2 border-t" style={{ borderColor: "hsl(248, 25%, 15%)" }}>
              <div className="flex items-center justify-between px-2 py-1 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(248, 15%, 40%)" }}>
                  Pilih Model AI
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1 px-1 mb-2">
                {(["all", "gpt", "other"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setModelTab(tab)}
                    className="flex-1 py-1 rounded-lg text-[10px] font-bold transition-all"
                    style={
                      modelTab === tab
                        ? { background: "#7c3aed", color: "white" }
                        : { background: "hsl(248, 28%, 13%)", color: "hsl(248, 15%, 50%)" }
                    }
                  >
                    {tab === "all" ? "Semua" : tab === "gpt" ? "GPT" : "Lainnya"}
                  </button>
                ))}
              </div>

              <div className="space-y-0.5">
                {filteredModels.map((model: AIModel) => {
                  const isSelected = selectedModelId === model.id;
                  return (
                    <div
                      key={model.id}
                      className="group flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                      style={
                        isSelected
                          ? { background: "rgba(124, 58, 237, 0.25)", border: "1px solid rgba(168, 85, 247, 0.4)" }
                          : { border: "1px solid transparent" }
                      }
                      onClick={() => handleModelSelect(model.id)}
                    >
                      <span className="text-base shrink-0">{model.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${isSelected ? "text-white" : "text-white/60"}`}>
                          {model.label}
                        </p>
                      </div>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 text-white"
                        style={{ background: "#7c3aed", opacity: isSelected ? 1 : 0.7 }}
                      >
                        {model.badge}
                      </span>
                      {/* Chat button appears on hover */}
                      <button
                        onClick={(e) => handleModelChat(model.id, e)}
                        className="opacity-0 group-hover:opacity-100 shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white transition-all active:scale-95"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                        title={`Chat dengan ${model.label}`}
                      >
                        <Zap className="h-2.5 w-2.5" />
                        Chat
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* User footer */}
        <div
          className="px-3 py-3 flex items-center justify-between shrink-0"
          style={{ borderTop: "1px solid hsl(248, 25%, 14%)" }}
        >
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback
                className="text-white text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user?.fullName || user?.emailAddresses[0]?.emailAddress || "Pengguna"}
              </p>
              <p className="text-[10px]" style={{ color: "hsl(248, 15%, 45%)" }}>Akun aktif</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0"
            style={{ color: "hsl(248, 15%, 50%)" }}
            title="Keluar"
            data-testid="button-signout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
