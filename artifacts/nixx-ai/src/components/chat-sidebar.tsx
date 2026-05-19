import React from "react";
import { OpenaiConversation } from "@workspace/api-client-react";

interface Model {
  id: string;
  label: string;
  badge: string;
  icon: string;
  off: boolean;
}

interface ChatSidebarProps {
  conversations: OpenaiConversation[];
  activeId: number | null;
  selectedModel: string;
  models: Model[];
  isCreating?: boolean;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onDelete: (id: number) => void;
  onClearChat: () => void;
  onSelectModel: (modelId: string) => void;
}

export default function ChatSidebar({
  conversations,
  activeId,
  selectedModel,
  models,
  isCreating,
  onSelect,
  onNewChat,
  onDelete,
  onClearChat,
  onSelectModel,
}: ChatSidebarProps) {
  return (
    <>
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
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className="nx-sidebar-btn"
              onClick={() => onSelect(conv.id)}
              style={{
                fontWeight: activeId === conv.id ? 700 : 400,
                fontSize: "0.82rem",
                marginBottom: 4,
                position: "relative",
                paddingRight: 40,
              }}
            >
              <span>💬</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {conv.title}
              </span>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); if (confirm("Hapus percakapan ini?")) onDelete(conv.id); }}
                style={{
                  position: "absolute",
                  right: 10,
                  fontSize: 12,
                  opacity: 0.6,
                  cursor: "pointer",
                  padding: "2px 4px",
                }}
                title="Hapus"
              >
                🗑
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        className="nx-sidebar-btn"
        onClick={() => alert("Developer: Nixx Team\nContact: t.me/nixsukakamu")}
      >
        <span>👤</span>
        DEVELOPER 🚀
      </button>

      <button
        className="nx-sidebar-btn"
        onClick={() => window.open("https://list.unix.biz.id", "_blank")}
      >
        <span>📚</span>
        STORE MENU 🛍️
      </button>

      <button
        className="nx-sidebar-btn"
        onClick={() => window.open("https://t.me/nixsukakamu", "_blank")}
      >
        <span>💫</span>
        COMMUNITY 💫
      </button>

      <button
        className="nx-sidebar-btn"
        onClick={() => window.open("https://iili.io/f7GFZcF.png", "_blank")}
      >
        <img
          src="https://iili.io/f7GOsse.jpg"
          alt="QRIS"
          style={{ width: 20, borderRadius: 4, objectFit: "cover" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        SAWERIA ✨
      </button>

      <button className="nx-sidebar-btn nx-clear-btn" onClick={onClearChat}>
        <span>🗑️</span>
        CLEAR CHAT 🗑️
      </button>

      <div className="nx-model-selector">
        <span className="nx-model-label">SELECT AI MODEL:</span>
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
