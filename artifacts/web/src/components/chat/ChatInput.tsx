import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  return (
    <div
      className="px-4 py-3"
      style={{ background: "hsl(248, 30%, 6%)", borderTop: "1px solid hsl(248, 25%, 14%)" }}
    >
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <div
          className="flex-1 flex items-end rounded-full px-4 py-2"
          style={{ background: "hsl(248, 28%, 13%)", border: "1px solid hsl(248, 25%, 20%)" }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan Anda di sini..."
            disabled={disabled}
            className="flex-1 max-h-[160px] min-h-[24px] bg-transparent resize-none outline-none text-white text-sm placeholder:text-sm py-1 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: "white", placeholderColor: "hsl(248, 15%, 45%)" }}
            rows={1}
            data-testid="input-chat"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="shrink-0 px-5 py-3 rounded-full text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          data-testid="button-send"
        >
          ➤ SEND
        </button>
      </div>
    </div>
  );
}
