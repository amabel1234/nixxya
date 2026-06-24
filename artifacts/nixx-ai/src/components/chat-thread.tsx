import React, { useState, useEffect, useRef } from "react";
  import { useQueryClient } from "@tanstack/react-query";
  import {
    useGetOpenaiConversation,
    useListOpenaiMessages,
    getGetOpenaiConversationQueryKey,
    getListOpenaiConversationsQueryKey,
    getListOpenaiMessagesQueryKey,
  } from "@workspace/api-client-react";

  const FREE_LIMIT = 20;
  const COUNT_KEY = "nx-free-count";
  const PREMIUM_KEY = "nx-is-premium";

  function getMsgCount(): number {
    return parseInt(localStorage.getItem(COUNT_KEY) ?? "0", 10);
  }
  function incMsgCount() {
    localStorage.setItem(COUNT_KEY, String(getMsgCount() + 1));
  }
  function isPremium(): boolean {
    return localStorage.getItem(PREMIUM_KEY) === "true";
  }

  /* ── Upgrade Modal ─────────────────────────────────── */
  function UpgradeModal({ count, onClose }: { count: number; onClose: () => void }) {
    const PLANS = [
      { name: "Harian", price: "Rp 3.000", duration: "1 hari", popular: false },
      { name: "Mingguan", price: "Rp 15.000", duration: "7 hari", popular: false },
      { name: "Bulanan", price: "Rp 49.000", duration: "30 hari", popular: true },
      { name: "Tahunan", price: "Rp 399.000", duration: "365 hari", popular: false },
    ];

    const waLink = `https://wa.me/6281234567890?text=${encodeURIComponent("Halo, saya ingin upgrade ke Nixx AI Premium!")}`;

    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 0 0",
      }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{
          background: "var(--nx-bg, #0f0f13)",
          borderRadius: "20px 20px 0 0",
          padding: "24px 20px 32px",
          width: "100%", maxWidth: 520,
          border: "1px solid rgba(124,58,237,.3)",
          animation: "nxSlideUp .3s ease",
          maxHeight: "90dvh",
          overflowY: "auto",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🚀</div>
              <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--nx-text, #fff)" }}>
                Upgrade ke Premium
              </div>
              <div style={{ color: "var(--nx-text-muted, #aaa)", fontSize: 13, marginTop: 4 }}>
                Kamu sudah kirim <strong style={{ color: "#f472b6" }}>{count} pesan</strong> — batas gratis tercapai!
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8,
              color: "#aaa", cursor: "pointer", fontSize: 18, padding: "4px 9px",
            }}>×</button>
          </div>

          {/* Progress bar */}
          <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 6, height: 6, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(90deg,#7c3aed,#ec4899)", height: 6, width: "100%", borderRadius: 6 }} />
          </div>

          {/* Features */}
          <div style={{ background: "rgba(124,58,237,.1)", borderRadius: 12, padding: "12px 14px", marginBottom: 20, border: "1px solid rgba(124,58,237,.2)" }}>
            <div style={{ fontWeight: 600, color: "var(--nx-text, #fff)", fontSize: 13, marginBottom: 8 }}>✨ Yang kamu dapat dengan Premium:</div>
            {["Pesan unlimited tanpa batas", "Akses semua 26 model AI", "Prioritas respons lebih cepat", "Simpan & ekspor riwayat chat", "Karakter AI eksklusif"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--nx-text-muted, #ccc)", marginBottom: 5 }}>
                <span style={{ color: "#a78bfa", flexShrink: 0 }}>✓</span>{f}
              </div>
            ))}
          </div>

          {/* Pricing plans */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {PLANS.map(p => (
              <div key={p.name} style={{
                borderRadius: 12, padding: "10px 12px", textAlign: "center",
                border: p.popular ? "2px solid #7c3aed" : "1px solid rgba(255,255,255,.12)",
                background: p.popular ? "rgba(124,58,237,.18)" : "rgba(255,255,255,.05)",
                position: "relative",
              }}>
                {p.popular && (
                  <div style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", background: "#7c3aed", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>⭐ Terpopuler</div>
                )}
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--nx-text, #fff)", marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontWeight: 800, color: "#a78bfa", fontSize: 15 }}>{p.price}</div>
                <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{p.duration}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
            display: "block", textAlign: "center",
            background: "linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)",
            color: "#fff", fontWeight: 700, fontSize: 15,
            padding: "14px", borderRadius: 14, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(124,58,237,.45)",
            marginBottom: 10,
          }}>
            💳 Bayar via DANA / GoPay / OVO
          </a>
          <div style={{ textAlign: "center", fontSize: 11, color: "#666" }}>
            Hubungi admin setelah bayar · Aktivasi otomatis dalam 5 menit
          </div>
        </div>
      </div>
    );
  }

  interface ChatThreadProps {
    conversationId: number;
    selectedModel: string;
  }

  function getCurrentTime() {
    const now = new Date();
    return (
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0")
    );
  }

  function getSystemPrompt(model: string): string {
    const base =
      "Gunakan bahasa Indonesia yang santai dan natural. Jangan gunakan LaTeX. Jawab langsung ke inti tanpa meta-talk. Jangan gunakan format markdown berlebihan. Jangan mulai jawaban dengan 'Okay', 'Sure', 'Baik', atau 'Tentu'.";
    const personas: Record<string, string> = {
      deepseekv3: `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas dan helpful. ${base}`,
      christyai: `Kamu adalah Christy AI, asisten AI dengan karakter idol JKT48 yang ceria, ramah, dan energik. ${base} Sesekali gunakan sapaan khas idol seperti "kak" atau kata-kata ceria khas idol.`,
      copilot: `Kamu adalah Copilot AI, asisten produktivitas bergaya Microsoft Copilot. ${base}`,
      muslim: `Kamu adalah Muslim AI, asisten AI berbasis nilai-nilai Islam. ${base}`,
      gpt4o: `Kamu adalah asisten AI canggih berbasis GPT-4o. ${base}`,
      turboseek: `Kamu adalah Turboseek AI, asisten super cepat dan ringkas. ${base} Jawab singkat.`,
      groqmini: `Kamu adalah Groq Mini, asisten AI yang efisien dan sangat cepat. ${base}`,
      grok4fast: `Kamu adalah Grok 4 Fast dari xAI. ${base} Berikan jawaban cepat dan witty.`,
      grok3mini: `Kamu adalah Grok 3 Mini dari xAI. ${base} Ringkas dan cerdas.`,
    };
    return personas[model] ?? `Kamu adalah Nixx AI, asisten AI pribadi yang cerdas. ${base}`;
  }

  function cleanResponse(text: string): string {
    let clean = text.trim();
    if (clean.includes("</think>")) clean = clean.split("</think>").pop()?.trim() ?? clean;
    clean = clean.replace(/\\boxed\{([\s\S]*?)\}/g, "$1");
    clean = clean.replace(/\\[|\\]|\\(|\\)/g, "");
    clean = clean.replace(/\*\*/g, "");
    clean = clean.replace(/^(okay|sure|baik|tentu)[,.]?\s*/i, "");
    return clean.trim();
  }

  export default function ChatThread({ conversationId, selectedModel }: ChatThreadProps) {
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const streamingAccumRef = useRef("");
    const contentAccumRef = useRef("");
    const inContentPhaseRef = useRef(false);

    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [hasText, setHasText] = useState(false);
    const [msgCount, setMsgCount] = useState(() => getMsgCount());
    const [showUpgrade, setShowUpgrade] = useState(false);

    const isLimitReached = !isPremium() && msgCount >= FREE_LIMIT;

    const { data: conversationData, isLoading: isLoadingConv } =
      useGetOpenaiConversation(conversationId, {
        query: { enabled: !!conversationId, queryKey: getGetOpenaiConversationQueryKey(conversationId) },
      });

    const { data: listMessages, isLoading: isLoadingMessages } =
      useListOpenaiMessages(conversationId, {
        query: { enabled: !!conversationId, queryKey: getListOpenaiMessagesQueryKey(conversationId) },
      });

    const isLoading = isLoadingConv || isLoadingMessages;
    const messages = listMessages ?? conversationData?.messages ?? [];

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingContent]);
    useEffect(() => { inputRef.current?.focus(); }, [conversationId]);

    const handleSend = async () => {
      if (!input.trim() || isStreaming) return;

      // Cek limit pesan gratis
      if (!isPremium() && getMsgCount() >= FREE_LIMIT) {
        setShowUpgrade(true);
        return;
      }

      const userMessage = input.trim();
      setInput("");
      setIsStreaming(true);
      setStreamingContent("");
      setHasText(false);
      streamingAccumRef.current = "";
      contentAccumRef.current = "";
      inContentPhaseRef.current = false;

      // Optimistic: tampilkan pesan user langsung
      queryClient.setQueryData(getGetOpenaiConversationQueryKey(conversationId), (old: any) => {
        if (!old) return old;
        return { ...old, messages: [...(old.messages ?? []), {
          id: Date.now(), conversationId, role: "user", content: userMessage,
          createdAt: new Date().toISOString(),
        }]};
      });

      let finalAIContent = "";

      try {
        const res = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: userMessage, model: selectedModel }),
        });

        if (!res.ok) throw new Error("Gagal mengirim pesan");

        const contentType = res.headers.get("content-type") ?? "";

        if (contentType.includes("text/event-stream")) {
          // === MODE CEPAT: Server streaming (GitHub Models / OpenAI) ===
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() ?? "";
            for (const part of parts) {
              const line = part.replace(/^data:\s*/, "").trim();
              if (!line || line === "[DONE]") continue;
              try {
                const evt = JSON.parse(line);
                if (evt.content) {
                  streamingAccumRef.current += evt.content;
                  setStreamingContent(streamingAccumRef.current);
                  setHasText(true);
                }
              } catch { /* skip */ }
            }
          }
          finalAIContent = streamingAccumRef.current;

        } else {
          // === MODE FALLBACK: Frontend stream langsung ke pollinations.ai ===
          const { history } = await res.json() as { history: Array<{ role: string; content: string }> };

          const chatMessages = [
            { role: "system", content: getSystemPrompt(selectedModel) },
            ...history.map((m) => ({ role: m.role, content: m.content })),
          ];

          const aiRes = await fetch("https://text.pollinations.ai/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "gpt-oss-20b", messages: chatMessages, max_tokens: 1024, stream: true }),
          });

          if (!aiRes.ok) throw new Error("AI tidak tersedia");

          const reader = aiRes.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let reasoningBuf = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.replace(/^data:\s*/, "").trim();
              if (!trimmed || trimmed === "[DONE]") continue;
              try {
                const evt = JSON.parse(trimmed);
                const delta = evt.choices?.[0]?.delta;
                if (!delta) continue;
                if (delta.content != null && delta.content !== "") {
                  if (!inContentPhaseRef.current) {
                    inContentPhaseRef.current = true;
                    reasoningBuf = "";
                    setStreamingContent("");
                  }
                  contentAccumRef.current += delta.content;
                  setStreamingContent(contentAccumRef.current);
                  setHasText(true);
                } else if (delta.reasoning && !inContentPhaseRef.current) {
                  reasoningBuf += delta.reasoning;
                  setStreamingContent(reasoningBuf);
                  setHasText(true);
                }
              } catch { /* skip */ }
            }
          }

          finalAIContent = cleanResponse(contentAccumRef.current);

          // Simpan ke DB via endpoint assistant
          if (finalAIContent) {
            await fetch(`/api/openai/conversations/${conversationId}/messages/assistant`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: finalAIContent }),
            }).catch(() => {});
          }
        }

      } catch {
        finalAIContent = "Server AI sedang sibuk. Coba lagi ya!";
        setStreamingContent(finalAIContent);
        setHasText(true);
      }

      // Update cache
      if (finalAIContent) {
        const aiMsg = { id: Date.now() + 1, conversationId, role: "assistant", content: finalAIContent, createdAt: new Date().toISOString() };
        queryClient.setQueryData(getGetOpenaiConversationQueryKey(conversationId), (old: any) => {
          if (!old) return old;
          return { ...old, messages: [...(old.messages ?? []), aiMsg] };
        });
        queryClient.setQueryData(getListOpenaiMessagesQueryKey(conversationId), (old: any) =>
          Array.isArray(old) ? [...old, aiMsg] : old
        );
      }

      // Increment counter setelah pesan berhasil dikirim
      incMsgCount();
      const newCount = getMsgCount();
      setMsgCount(newCount);
      // Kalau tepat mencapai limit, langsung tampilkan modal
      if (!isPremium() && newCount >= FREE_LIMIT) {
        setTimeout(() => setShowUpgrade(true), 800);
      }

      setIsStreaming(false);
      setStreamingContent("");
      setHasText(false);
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    if (isLoading) {
      return (
        <div className="nx-chat-messages" style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="nx-typing"><div className="nx-typing-dots"><span /><span /><span /></div></div>
        </div>
      );
    }

    const remaining = Math.max(0, FREE_LIMIT - msgCount);

    return (
      <>
        {showUpgrade && (
          <UpgradeModal count={msgCount} onClose={() => setShowUpgrade(false)} />
        )}

        <div className="nx-chat-messages">
          {messages.length === 0 && !isStreaming && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, marginTop: 40 }}>
              Ketik pesan untuk memulai percakapan.
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`nx-message ${msg.role === "user" ? "nx-user-msg" : "nx-ai-msg"}`}>
              <div className="nx-msg-content">{msg.content}</div>
              <div className="nx-msg-time">{getCurrentTime()}</div>
            </div>
          ))}

          {isStreaming && (
            <div className="nx-message nx-ai-msg">
              <div
                className="nx-msg-content"
                style={!inContentPhaseRef.current && hasText
                  ? { opacity: 0.4, fontStyle: "italic", fontSize: "0.9em" }
                  : undefined}
              >
                {hasText ? streamingContent : ""}
                <span className="nx-cursor" />
              </div>
            </div>
          )}

          {isStreaming && !hasText && (
            <div className="nx-typing"><div className="nx-typing-dots"><span /><span /><span /></div></div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area ── */}
        {isLimitReached ? (
          /* Blocked state: limit tercapai */
          <div className="nx-input-container" style={{ flexDirection: "column", gap: 10, padding: "14px 16px" }}>
            <div style={{
              background: "rgba(124,58,237,.12)",
              border: "1px solid rgba(124,58,237,.3)",
              borderRadius: 12,
              padding: "12px 16px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>🔒</div>
              <div style={{ fontWeight: 700, color: "var(--nx-text, #fff)", fontSize: 14, marginBottom: 4 }}>
                Batas pesan gratis tercapai ({FREE_LIMIT}/{FREE_LIMIT})
              </div>
              <div style={{ color: "var(--nx-text-muted, #aaa)", fontSize: 12, marginBottom: 12 }}>
                Upgrade ke Premium untuk pesan unlimited!
              </div>
              <button
                onClick={() => setShowUpgrade(true)}
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)",
                  color: "#fff", border: "none", borderRadius: 10,
                  padding: "10px 24px", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 4px 16px rgba(124,58,237,.4)",
                }}
              >
                🚀 Upgrade Premium
              </button>
            </div>
          </div>
        ) : (
          <div className="nx-input-container" style={{ flexDirection: "column", gap: 0 }}>
            {/* Counter bar - tampil kalau sisa ≤ 10 dan bukan premium */}
            {!isPremium() && remaining <= 10 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "5px 14px 2px",
                fontSize: 11,
              }}>
                <span style={{ color: remaining <= 3 ? "#f87171" : "#a78bfa" }}>
                  {remaining <= 3 ? "⚠️" : "💬"} Sisa {remaining} pesan gratis
                </span>
                <button
                  onClick={() => setShowUpgrade(true)}
                  style={{
                    background: "none", border: "none", color: "#a78bfa",
                    cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                    padding: 0,
                  }}
                >
                  Upgrade →
                </button>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, padding: "8px 12px 12px" }}>
              <textarea
                ref={inputRef}
                className="nx-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan Anda di sini..."
                rows={1}
                disabled={isStreaming}
                style={{ flex: 1 }}
              />
              <button
                className="nx-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
              >
                ✈ SEND
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
  