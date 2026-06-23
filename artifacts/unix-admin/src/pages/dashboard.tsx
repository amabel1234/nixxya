import { useState, useRef } from "react";

const SUGGESTIONS = [
  { icon: "✏️", text: "Bantu nulis essay atau artikel yang menarik" },
  { icon: "💡", text: "Jelaskan konsep yang susah dengan cara mudah" },
  { icon: "🎯", text: "Ajarkan cara coding Python yang menguntungkan" },
  { icon: "❤️", text: "Bantu buat bisnis online dengan mudah" },
];

const CSS = `
  @keyframes dbFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dbPop    { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
  @keyframes dbFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes dbDot    { 0%,80%,100%{transform:scale(.55);opacity:.35} 40%{transform:scale(1);opacity:1} }
  @keyframes dbCur    { 0%,100%{opacity:1} 50%{opacity:0} }

  .db-wrap {
    height:100%; display:flex; flex-direction:column; overflow:hidden;
    background:linear-gradient(160deg,#0c0820 0%,#130b30 40%,#0e0c2a 100%);
    font-family:'Inter',system-ui,sans-serif; color:#f1f0f5;
  }

  /* ── HERO BANNER ── */
  .db-hero {
    width:100%; height:230px; position:relative; overflow:hidden; flex-shrink:0;
  }
  .db-hero img {
    width:100%; height:100%; object-fit:cover; object-position:center 20%;
  }
  .db-hero-overlay {
    position:absolute; inset:0;
    background:linear-gradient(105deg,rgba(0,0,0,.1) 0%,rgba(80,10,160,.6) 42%,rgba(160,20,100,.88) 100%);
  }
  .db-hero-text {
    position:absolute; right:20px; bottom:22px; text-align:right;
  }
  .db-hero-title { color:#fff; font-weight:900; font-size:1.65rem; line-height:1.1; text-shadow:0 2px 14px rgba(0,0,0,.5); }
  .db-hero-sub   { color:rgba(255,255,255,.82); font-size:.8rem; margin-top:4px; text-shadow:0 1px 8px rgba(0,0,0,.4); }

  /* ── BODY ── */
  .db-body {
    flex:1; display:flex; flex-direction:column; align-items:center;
    overflow-y:auto; padding:24px 16px 8px;
  }
  .db-body::-webkit-scrollbar { width:4px; }
  .db-body::-webkit-scrollbar-thumb { background:rgba(124,58,237,.3); border-radius:4px; }

  .db-avatar {
    width:78px; height:78px; border-radius:50%;
    background:linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%);
    display:flex; align-items:center; justify-content:center; font-size:2.2rem;
    box-shadow:0 0 36px rgba(124,58,237,.65),0 0 80px rgba(124,58,237,.18);
    animation:dbPop .45s ease both, dbFloat 4.5s ease-in-out 1s infinite;
    margin-bottom:14px; flex-shrink:0;
  }
  .db-title {
    font-size:clamp(1.35rem,5vw,1.75rem); font-weight:900; color:#fff;
    text-align:center; line-height:1.25; margin-bottom:7px;
    animation:dbFadeUp .5s ease .1s both;
  }
  .db-title span { color:#a78bfa; }
  .db-sub {
    color:rgba(255,255,255,.42); font-size:.82rem; text-align:center;
    line-height:1.65; max-width:310px; margin-bottom:20px;
    animation:dbFadeUp .5s ease .18s both;
  }

  .db-suggestions {
    width:100%; max-width:480px; display:flex; flex-direction:column; gap:9px;
    animation:dbFadeUp .5s ease .26s both;
  }
  .db-suggestion-card {
    width:100%; display:flex; align-items:center; gap:14px;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.09);
    border-radius:13px; padding:13px 16px; cursor:pointer;
    transition:all .2s; font-family:inherit; color:#fff; text-align:left;
  }
  .db-suggestion-card:hover {
    background:rgba(124,58,237,.18); border-color:rgba(124,58,237,.38);
    transform:translateX(3px);
  }
  .db-sug-icon { font-size:1.4rem; flex-shrink:0; }
  .db-sug-text { font-size:.87rem; font-weight:600; color:rgba(255,255,255,.82); line-height:1.4; }

  /* ── MESSAGES ── */
  .db-messages {
    flex:1; overflow-y:auto; padding:14px 16px;
    display:flex; flex-direction:column; gap:10px;
    width:100%; max-width:600px; align-self:center;
  }
  .db-messages::-webkit-scrollbar { width:4px; }
  .db-messages::-webkit-scrollbar-thumb { background:rgba(124,58,237,.3); border-radius:4px; }

  .db-msg { display:flex; flex-direction:column; max-width:84%; animation:dbFadeUp .22s ease both; }
  .db-msg.user { align-self:flex-end; align-items:flex-end; }
  .db-msg.ai   { align-self:flex-start; align-items:flex-start; }
  .db-msg-label { font-size:.65rem; color:rgba(255,255,255,.38); margin-bottom:4px; }
  .db-msg-bubble { padding:11px 15px; border-radius:16px; font-size:.87rem; line-height:1.6; word-break:break-word; white-space:pre-wrap; }
  .db-msg.user .db-msg-bubble { background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; border-bottom-right-radius:4px; }
  .db-msg.ai   .db-msg-bubble { background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.9); border-bottom-left-radius:4px; }
  .db-msg-time { font-size:.6rem; color:rgba(255,255,255,.26); margin-top:4px; padding:0 4px; }

  .db-typing { display:flex; gap:5px; align-items:center; padding:12px 16px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); border-radius:16px; border-bottom-left-radius:4px; width:fit-content; }
  .db-dot { width:7px; height:7px; border-radius:50%; background:#a78bfa; animation:dbDot 1.4s ease-in-out infinite; }
  .db-dot:nth-child(2){animation-delay:.16s} .db-dot:nth-child(3){animation-delay:.32s}
  .db-cursor { display:inline-block; width:2px; height:.9em; background:#a78bfa; margin-left:2px; vertical-align:middle; animation:dbCur .7s step-end infinite; }

  /* ── INPUT BAR ── */
  .db-input-bar {
    flex-shrink:0; padding:10px 16px 16px;
    background:linear-gradient(0deg,rgba(12,8,32,1),rgba(12,8,32,.9));
    border-top:1px solid rgba(124,58,237,.15);
  }
  .db-input-row {
    display:flex; align-items:flex-end; gap:9px; max-width:600px; margin:0 auto;
    background:rgba(255,255,255,.07); border:1px solid rgba(124,58,237,.25);
    border-radius:28px; padding:8px 8px 8px 18px; transition:border-color .2s;
  }
  .db-input-row:focus-within { border-color:rgba(124,58,237,.55); }
  .db-textarea {
    flex:1; background:transparent; border:none; outline:none; resize:none;
    color:#fff; font-size:.9rem; font-family:inherit; line-height:1.5;
    min-height:24px; max-height:140px; overflow-y:hidden; padding:2px 0;
  }
  .db-textarea::placeholder { color:rgba(255,255,255,.32); }
  .db-send-btn {
    flex-shrink:0; height:42px; padding:0 18px; border-radius:22px;
    background:linear-gradient(135deg,#7c3aed,#a855f7);
    color:#fff; border:none; cursor:pointer; font-size:.82rem; font-weight:800;
    letter-spacing:.4px; display:flex; align-items:center; gap:6; white-space:nowrap;
    transition:all .18s; box-shadow:0 4px 18px rgba(124,58,237,.4); font-family:inherit;
  }
  .db-send-btn:hover:not(:disabled) { transform:scale(1.05); filter:brightness(1.1); }
  .db-send-btn:disabled { opacity:.45; cursor:not-allowed; box-shadow:none; }
`;

interface Msg { id: string; role: "user" | "ai"; content: string; time: string; }

function getTime() {
  const n = new Date();
  return n.getHours().toString().padStart(2,"0") + ":" + n.getMinutes().toString().padStart(2,"0");
}

const SYSTEM = "Kamu adalah Nixx AI, asisten admin yang cerdas. Bantu admin memantau dan mengelola platform UNIX AI. Jawab dalam bahasa Indonesia yang santai dan profesional.";

export default function DashboardPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);

  const showWelcome = messages.length === 0;

  const scroll = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: Msg = { id: Date.now().toString(), role: "user", content: text.trim(), time: getTime() };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsStreaming(true);
    setStreamContent("");
    scroll();

    const apiMsgs = nextMsgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
    let full = "";

    try {
      const res = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai-large",
          messages: [{ role: "system", content: SYSTEM }, ...apiMsgs],
          stream: true, seed: Math.floor(Math.random() * 99999), private: true,
        }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const parts = buf.split("\n\n"); buf = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.replace(/^data:\s?/, "").trim();
            if (!line || line === "[DONE]") continue;
            try {
              const evt = JSON.parse(line) as { choices?: { delta?: { content?: string } }[] };
              const tok = evt.choices?.[0]?.delta?.content;
              if (tok) { full += tok; setStreamContent(s => s + tok); scroll(); }
            } catch { /* skip */ }
          }
        }
      }
    } catch { /* noop */ }

    if (!full) full = "Maaf, AI sedang sibuk. Coba lagi sebentar ya! 😊";
    const aiMsg: Msg = { id: (Date.now()+1).toString(), role: "ai", content: full, time: getTime() };
    setMessages(prev => [...prev, aiMsg]);
    setIsStreaming(false);
    setStreamContent("");
    scroll();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="db-wrap">

        {/* ── HERO BANNER ── */}
        {showWelcome && (
          <div className="db-hero">
            <img src="https://iili.io/f7nDq8X.jpg" alt="Nixx AI"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="db-hero-overlay" />
            <div className="db-hero-text">
              <div className="db-hero-title">Nixx AI</div>
              <div className="db-hero-sub">Asisten AI gratis untuk semua</div>
            </div>
          </div>
        )}

        {/* ── WELCOME or MESSAGES ── */}
        {showWelcome ? (
          <div className="db-body">
            <div className="db-avatar">🧠</div>
            <h2 className="db-title">Halo! Ada yang bisa <span>dibantu?</span></h2>
            <p className="db-sub">Pilih salah satu pertanyaan di bawah atau ketik sendiri</p>
            <div className="db-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="db-suggestion-card" onClick={() => sendMessage(s.text)}>
                  <span className="db-sug-icon">{s.icon}</span>
                  <span className="db-sug-text">{s.text}</span>
                </button>
              ))}
            </div>
            <div style={{ height: 16 }} />
          </div>
        ) : (
          <div className="db-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`db-msg ${msg.role}`}>
                {msg.role === "ai" && <div className="db-msg-label">🧠 Nixx AI</div>}
                <div className="db-msg-bubble">{msg.content}</div>
                <div className="db-msg-time">{msg.time}</div>
              </div>
            ))}

            {isStreaming && streamContent && (
              <div className="db-msg ai">
                <div className="db-msg-label">🧠 Nixx AI</div>
                <div className="db-msg-bubble">{streamContent}<span className="db-cursor" /></div>
              </div>
            )}
            {isStreaming && !streamContent && (
              <div className="db-msg ai">
                <div className="db-msg-label">🧠 Nixx AI</div>
                <div className="db-typing">
                  <div className="db-dot" /><div className="db-dot" /><div className="db-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* ── INPUT BAR ── */}
        <div className="db-input-bar">
          <div className="db-input-row">
            <textarea
              ref={textareaRef}
              className="db-textarea"
              value={input}
              onChange={handleChange}
              onKeyDown={handleKey}
              placeholder="Ketik pesan Anda di sini..."
              rows={1}
              disabled={isStreaming}
            />
            <button
              className="db-send-btn"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}>
              {isStreaming ? "⏳" : "➤ KIRIM"}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
