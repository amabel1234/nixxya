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
  onSelect,
  onNewChat,
  onDelete,
  onClearChat,
  onSelectModel,
}: ChatSidebarProps) {
  return (
    <>
      {/* New Chat */}
      <button
        className="nx-sidebar-btn"
        onClick={onNewChat}
        data-testid="button-new-chat"
      >
        <span>✏️</span>
        PERCAKAPAN BARU
      </button>

      {/* Conversations list */}
      {conversations.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className="nx-sidebar-btn"
              onClick={() => onSelect(conv.id)}
              data-testid={`button-conv-${conv.id}`}
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

      {/* Developer */}
      <button
        className="nx-sidebar-btn"
        onClick={() => alert("Developer: Nixx Team\nContact: t.me/nixsukakamu")}
        data-testid="button-developer"
      >
        <span>👤</span>
        DEVELOPER 🚀
      </button>

      {/* Store Menu */}
      <button
        className="nx-sidebar-btn"
        onClick={() => window.open("https://list.unix.biz.id", "_blank")}
        data-testid="button-store"
      >
        <span>📚</span>
        STORE MENU 🛍️
      </button>

      {/* Community */}
      <button
        className="nx-sidebar-btn"
        onClick={() => window.open("https://t.me/nixsukakamu", "_blank")}
        data-testid="button-community"
      >
        <span>💫</span>
        COMMUNITY 💫
      </button>

      {/* SAWERIA/Donation */}
      <button
        className="nx-sidebar-btn"
        onClick={() => window.open("https://iili.io/f7GFZcF.png", "_blank")}
        data-testid="button-saweria"
      >
        <img
          src="https://iili.io/f7GOsse.jpg"
          alt="QRIS"
          style={{ width: 20, borderRadius: 4, objectFit: "cover" }}
          onError={(e) => { (e.target as HTMLImageElement).replaceWith(document.createTextNode("💳")); }}
        />
        SAWERIA ✨
      </button>

      {/* Clear Chat */}
      <button
        className="nx-sidebar-btn nx-clear-btn"
        onClick={onClearChat}
        data-testid="button-clear-chat"
      >
        <span>🗑️</span>
        CLEAR CHAT 🗑️
      </button>

      {/* Model Selector */}
      <div className="nx-model-selector">
        <span className="nx-model-label">SELECT AI MODEL:</span>
        {models.map((model) => (
          <button
            key={model.id}
            className={`nx-model-option${model.id === selectedModel ? " active" : ""}${model.off ? " off" : ""}`}
            onClick={() => !model.off && onSelectModel(model.id)}
            data-testid={`button-model-${model.id}`}
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
