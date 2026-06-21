import React from "react";
import { OpenaiConversation } from "@workspace/api-client-react";

interface Model { id: string; label: string; badge: string; icon: string; off: boolean; premium?: boolean }

interface ChatSidebarProps {
  conversations: OpenaiConversation[];
  activeId: number | null;
  selectedModel: string;
  models: Model[];
  isCreating?: boolean;
  isPremium?: boolean;
  usage?: { used: number; limit: number } | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onDelete: (id: number) => void;
  onClearChat: () => void;
  onSelectModel: (modelId: string) => void;
  onUpgrade?: () => void;
}

export default function ChatSidebar({
  conversations, activeId, selectedModel, models, isCreating,
  isPremium, usage, onSelect, onNewChat, onDelete, onClearChat, onSelectModel, onUpgrade,
}: ChatSidebarProps) {
  const usagePct = usage ? Math.min((usage.used / usage.limit) * 100, 100) : 0;
  const limitReached = usage ? usage.used >= usage.limit : false;

  return (
    <>
      {/* Usage / Premium Status */}
      {isPremium ? (
        <div style={{ margin: "8px 0 4px", padding: "10px 14px", borderRadius: 10, background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(219,39,119,0.15))", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>👑</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--accent)" }}>Premium Aktif</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>26 model · pesan tak terbatas</div>
          </div>
        </div>
      ) : usage ? (
        <div style={{ margin: "8px 0 4px", padding: "10px 14px", borderRadius: 10, background: "rgba(0,0,0,0.05)", border: "1px solid var(--border-color,#e8e4ff)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 5 }}>
            <span style={{ color: "var(--text-muted)" }}>Pesan hari ini</span>
            <span style={{ fontWeight: 700, color: limitReached ? "#ef4444" : "var(--text-primary)" }}>{usage.used}/{usage.limit}</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, width: `${usagePct}%`, background: limitReached ? "linear-gradient(90deg,#ef4444,#f97316)" : "linear-gradient(90deg,#7c3aed,#db2777)", transition: "width 0.3s" }} />
          </div>
          {limitReached && <div style={{ fontSize: "0.72rem", color: "#ef4444", fontWeight: 600, marginTop: 4 }}>Limit harian tercapai!</div>}
        </div>
      ) : null}

      {/* Upgrade Button */}
      {!isPremium && onUpgrade && (
        <button className="nx-sidebar-btn" onClick={onUpgrade} style={{
          background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontWeight: 700, border: "none",
          marginBottom: 4,
        }}>
          <span>👑</span>
          UPGRADE PREMIUM ✨
        </button>
      )}

      <button
        className="nx-sidebar-btn"
        onClick={onNewChat}
        disabled={isCreating}
        style={{ opacity: isCreating ? 0.7 : 1, cursor: isCreating ? "not-allowed" : "pointer" }}
      >
        <span>{isCreating ? "⏳" : "✏️"}</span>
        {isCreating ? "Membuat..." : "PERCAKAPAN BARU"}
      </button>

      {conversations.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {conversations.map(conv => (
            <button
              key={conv.id}
              className="nx-sidebar-btn"
              onClick={() => onSelect(conv.id)}
              style={{ fontWeight: activeId === conv.id ? 700 : 400, fontSize: "0.82rem", marginBottom: 4, position: "relative", paddingRight: 40 }}
            >
              <span>💬</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{conv.title}</span>
              <span
                role="button"
                onClick={e => { e.stopPropagation(); if (confirm("Hapus percakapan ini?")) onDelete(conv.id); }}
                style={{ position: "absolute", right: 10, fontSize: 12, opacity: 0.6, cursor: "pointer", padding: "2px 4px" }}
                title="Hapus"
              >🗑</span>
            </button>
          ))}
        </div>
      )}

      <button className="nx-sidebar-btn" onClick={() => alert("Developer: Nixx Team\nContact: t.me/nixsukakamu")}>
        <span>👤</span>DEVELOPER 🚀
      </button>
      <button className="nx-sidebar-btn" onClick={() => window.open("https://list.unix.biz.id", "_blank")}>
        <span>📚</span>STORE MENU 🛍️
      </button>
      <button className="nx-sidebar-btn" onClick={() => window.open("https://t.me/nixsukakamu", "_blank")}>
        <span>💫</span>COMMUNITY 💫
      </button>
      <button className="nx-sidebar-btn" onClick={() => window.open("https://iili.io/f7GFZcF.png", "_blank")}>
        <img src="https://iili.io/f7GOsse.jpg" alt="QRIS" style={{ width: 20, borderRadius: 4, objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        SAWERIA ✨
      </button>
      <button className="nx-sidebar-btn nx-clear-btn" onClick={onClearChat}>
        <span>🗑️</span>CLEAR CHAT 🗑️
      </button>

      <div className="nx-model-selector">
        <span className="nx-model-label">SELECT AI MODEL:</span>
        {models.map(model => {
          const locked = model.premium && !isPremium;
          return (
            <button
              key={model.id}
              className={`nx-model-option${model.id === selectedModel ? " active" : ""}${model.off ? " off" : ""}`}
              onClick={() => !model.off && onSelectModel(model.id)}
              style={{ position: "relative", opacity: model.off ? 0.4 : 1 }}
            >
              <span>{model.icon}</span>
              {model.label}
              <span className="nx-model-badge" style={locked ? { background: "rgba(239,68,68,0.15)", color: "#ef4444" } : undefined}>
                {locked ? "🔒 PRO" : model.badge}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
