import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  id: string | number;
  role: "user" | "assistant" | string;
  content: string;
  createdAt?: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  userAvatarUrl?: string;
  userInitials?: string;
}

function formatTime(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "";
  }
}

export function MessageList({ messages, isLoading, userAvatarUrl, userInitials }: MessageListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (content: string, id: string | number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(String(id));
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (messages.length === 0 && !isLoading) return null;

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 space-y-5">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const time = formatTime(message.createdAt);

        return (
          <div
            key={message.id}
            className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
            data-testid={`message-${message.role}-${message.id}`}
          >
            {isUser ? (
              <div className="flex items-end gap-2 flex-row-reverse">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={userAvatarUrl} />
                  <AvatarFallback
                    className="text-white text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                  >
                    {userInitials || "K"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-end gap-1 max-w-[78%]">
                  <div
                    className="px-4 py-3 rounded-2xl rounded-tr-sm text-white text-sm leading-relaxed"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                  >
                    {message.content}
                  </div>
                  {time && (
                    <span className="text-[11px]" style={{ color: "hsl(248, 15%, 45%)" }}>
                      {time}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 flex-row group max-w-[90%]">
                <div
                  className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #c026d3)" }}
                >
                  🧠
                </div>
                <div className="flex flex-col gap-1">
                  <div
                    className="relative px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
                    style={{
                      background: "hsl(248, 28%, 13%)",
                      border: "1px solid hsl(248, 25%, 20%)",
                      color: "hsl(0, 0%, 92%)",
                    }}
                  >
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            const codeString = String(children).replace(/\n$/, "");
                            return !inline && match ? (
                              <div
                                className="relative group/code rounded-xl overflow-hidden my-3"
                                style={{ border: "1px solid hsl(248, 25%, 22%)" }}
                              >
                                <div
                                  className="flex items-center justify-between px-3 py-2"
                                  style={{
                                    background: "hsl(248, 30%, 8%)",
                                    borderBottom: "1px solid hsl(248, 25%, 22%)",
                                  }}
                                >
                                  <span className="text-xs font-mono" style={{ color: "hsl(248, 15%, 55%)" }}>
                                    {match[1]}
                                  </span>
                                  <button
                                    className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover/code:opacity-100 transition-opacity"
                                    style={{ color: "hsl(248, 15%, 60%)" }}
                                    onClick={() => navigator.clipboard.writeText(codeString)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                                <SyntaxHighlighter
                                  {...props}
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ margin: 0, padding: "1rem", background: "transparent" }}
                                >
                                  {codeString}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code
                                {...props}
                                className={`${className} px-1.5 py-0.5 rounded font-mono text-xs`}
                                style={{ background: "hsl(248, 30%, 8%)" }}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    <button
                      className="absolute -right-9 top-0 h-7 w-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "hsl(248, 15%, 55%)" }}
                      onClick={() => handleCopy(message.content, message.id)}
                      title="Salin pesan"
                    >
                      {copiedId === String(message.id) ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  {time && (
                    <span className="text-[11px] px-1" style={{ color: "hsl(248, 15%, 45%)" }}>
                      {time}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {isLoading && (
        <div className="flex items-start gap-2">
          <div
            className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm"
            style={{ background: "linear-gradient(135deg, #7c3aed, #c026d3)" }}
          >
            🧠
          </div>
          <div
            className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center h-11"
            style={{ background: "hsl(248, 28%, 13%)", border: "1px solid hsl(248, 25%, 20%)" }}
          >
            <div className="flex gap-1.5">
              {[0, 150, 300].map((delay) => (
                <div
                  key={delay}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "#a855f7", animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
