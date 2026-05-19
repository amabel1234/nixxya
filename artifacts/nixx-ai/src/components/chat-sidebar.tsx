import type { OpenaiConversation } from "@workspace/api-client-react";

interface Model {
  id: string; label: string; badge: string; icon: string; off: boolean;
}

interface UsageInfo {
  used: number; limit: number;
}

interface ChatSidebarProps {
  conversations: OpenaiConversation[];
  activeId: number | null;
  selectedModel: string;
  models: Model[];
  usage: UsageInfo | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onDelete: (id: number) => void;
  onClearChat: () => void;
  onSelectModel: (modelId: string) => void;
  onSignOut: () => void;
}

export default function ChatSidebar({
  conversations, activeId, selectedModel, models, usage,
  onSelect, onNewChat, onDelete, onClearChat, onSelectModel, onSignOut,
}: ChatSidebarProps) {
  return (
    <>
      <button className="nx-sidebar-btn" onClick={onNewChat}>
        <span>✏️</span> PERCAKAPAN BARU
      </button>

      {conversations.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", padding: "4px 4px 6px", textTransform: "uppercase" }}>Riwayat</div>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className="nx-sidebar-btn"
              onClick={() => onSelect(conv.id)}
              style={{ fontWeight: activeId === conv.id ? 700 : 400, fontSize: "0.8rem", marginBottom: 4, paddingRight: 36, position: "relative" }}
            >
              <span>💬</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{conv.title}</span>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); if (confirm("Hapus?")) onDelete(conv.id); }}
                style={{ position: "absolute", right: 10, fontSize: 12, opacity: 0.5, cursor: "pointer", padding: "2px 4px" }}
              >🗑</span>
            </button>
          ))}
        </div>
      )}

      {usage && (
        <div style={{ background: "var(--secondary-bg)", border: "1.5px solid var(--border-color)", borderRadius: 10, padding: "10px 12px", marginBottom: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 600, marginBottom: 6 }}>
            <span style={{ color: "var(--text-secondary)" }}>Pesan hari ini</span>
            <span style={{ color: usage.used >= usage.limit ? "var(--danger-color)" : "var(--accent)" }}>{usage.used}/{usage.limit}</span>
          </div>
          <div style={{ height: 5, background: "var(--border-color)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", background: usage.used >= usage.limit ? "var(--danger-color)" : "var(--gradient)", width: `${Math.min(100, (usage.used / usage.limit) * 100)}%`, borderRadius: 4, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      <button className="nx-sidebar-btn" onClick={() => window.location.href = "/profile"}>
        <span>👤</span> PROFIL SAYA
      </button>
      <button className="nx-sidebar-btn" onClick={() => window.open("https://t.me/nixsukakamu", "_blank")}>
        <span>💫</span> COMMUNITY
      </button>
      <button className="nx-sidebar-btn nx-clear-btn" onClick={onClearChat}>
        <span>🗑️</span> HAPUS CHAT INI
      </button>
      <button
        className="nx-sidebar-btn"
        onClick={onSignOut}
        style={{ color: "var(--danger-color)", borderColor: "var(--danger-color)" }}
      >
        <span>🚪</span> KELUAR
      </button>

      <div className="nx-model-selector">
        <span className="nx-model-label">PILIH MODEL AI:</span>
        {models.map((model) => (
          <button
            key={model.id}
            className={`nx-model-option${model.id === selectedModel ? " active" : ""}${model.off ? " off" : ""}`}
            onClick={() => !model.off && onSelectModel(model.id)}
          >
            <span>{model.icon}</span>
            {model.label}
            <span className="nx-model-badge">{model.badge}</span>
          </button>
        ))}
      </div>
    </>
  );
}
