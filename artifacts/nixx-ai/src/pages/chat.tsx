import React, { useState, useEffect } from "react";
  import { useTheme } from "@/App";
  import ChatSidebar from "@/components/chat-sidebar";
  import ChatThread from "@/components/chat-thread";

  const MODELS = [
    { id: "deepseekv3", label: "Nixx AI",        badge: "Fast",      icon: "🧠", off: false },
    { id: "christyai",  label: "Christy AI",     badge: "JKT48",     icon: "⭐", off: false },
    { id: "copilot",    label: "Copilot AI",     badge: "Microsoft", icon: "🤖", off: false },
    { id: "ripple",     label: "Ripple AI",      badge: "OFF",       icon: "🌊", off: true  },
    { id: "felo",       label: "Felo AI",        badge: "New",       icon: "🔍", off: false },
    { id: "turboseek",  label: "Turboseek AI",   badge: "Fast",      icon: "🚀", off: false },
    { id: "perplexed",  label: "Perplexed AI",   badge: "Advanced",  icon: "❓", off: false },
    { id: "muslim",     label: "Muslim AI",      badge: "Religious", icon: "🕌", off: false },
    { id: "gpt3",       label: "GPT-3",          badge: "OpenAI",    icon: "🤖", off: false },
    { id: "gpt4o",      label: "GPT-4o",         badge: "Latest",    icon: "🤖", off: false },
    { id: "perplexity", label: "Perplexity AI",  badge: "Web",       icon: "🔍", off: false },
    { id: "groqmini",   label: "Groq Mini",      badge: "Fast",      icon: "⚡", off: false },
    { id: "llama4",     label: "Llama-4 Scout",  badge: "17B",       icon: "💻", off: false },
    { id: "llama33",    label: "Llama-3.3",      badge: "70B",       icon: "🌿", off: false },
    { id: "gemma",      label: "Gemma 7B",       badge: "Light",     icon: "💎", off: false },
    { id: "mistral",    label: "Mistral 7B",     badge: "v0.1",      icon: "🌬️", off: false },
    { id: "aoyo",       label: "Aoyo AI",        badge: "New",       icon: "💬", off: false },
    { id: "gptoss120",  label: "GPT-OSS 120B",   badge: "120B",      icon: "💻", off: false },
    { id: "gptoss20",   label: "GPT-OSS 20B",    badge: "20B",       icon: "💻", off: false },
    { id: "gemini25v1", label: "Gemini 2.5 v1",  badge: "Flash",     icon: "🤖", off: false },
    { id: "gemini25v2", label: "Gemini 2.5 v2",  badge: "Flash",     icon: "🤖", off: false },
    { id: "grok4fast",  label: "Grok 4 Fast",    badge: "Fast",      icon: "⚡", off: false },
    { id: "grok3mini",  label: "Grok 3 Mini",    badge: "Mini",      icon: "⚡", off: false },
    { id: "grok3jail1", label: "Grok Jail v1",   badge: "JB",        icon: "🔓", off: false },
    { id: "grok3jail2", label: "Grok Jail v2",   badge: "JB",        icon: "🔓", off: false },
    { id: "venice",     label: "Venice AI",      badge: "New",       icon: "🌊", off: false },
  ];

  export { MODELS };

  export interface LocalMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    time: string;
  }

  export interface LocalConversation {
    id: string;
    title: string;
    model: string;
    createdAt: string;
    messages: LocalMessage[];
  }

  const STORAGE_KEY = "nixx-ai-conversations";

  function loadConversations(): LocalConversation[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  }
  function saveConversations(convs: LocalConversation[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  }

  const ANIM = `
    @keyframes nxA { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(35px,-45px) scale(1.12)} 75%{transform:translate(-20px,25px) scale(.92)} }
    @keyframes nxB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-45px,-30px) scale(1.18)} }
    @keyframes nxC { 0%,100%{transform:translate(0,0)} 33%{transform:translate(20px,-35px)} 66%{transform:translate(-25px,20px)} }
    @keyframes nxUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes nxGlow { 0%,100%{box-shadow:0 8px 32px rgba(124,58,237,.55)} 50%{box-shadow:0 12px 44px rgba(124,58,237,.9),0 0 60px rgba(236,72,153,.3)} }
    @keyframes nxSpin { to{transform:rotate(360deg)} }
    @keyframes nxPop { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
    .nx-cta{animation:nxUp .5s ease .35s both,nxGlow 2.8s ease-in-out 1s infinite;transition:transform .18s,opacity .18s}
    .nx-cta:hover:not(:disabled){transform:translateY(-3px)!important}
    .nx-cta:disabled{animation:none!important;opacity:.6;cursor:wait}
    .nx-pill{transition:all .15s}
    .nx-pill:hover{opacity:1!important;transform:scale(1.05)}
    .nx-hero-card{animation:nxPop .5s ease both}
  `;

  export default function ChatPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [conversations, setConversations] = useState<LocalConversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState("deepseekv3");

    const { isDark, toggle: toggleTheme } = useTheme();

    useEffect(() => { setConversations(loadConversations()); }, []);

    const handleNewChat = () => {
      const model = MODELS.find(m => m.id === selectedModel);
      const now = new Date();
      const timeStr = now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0");
      const newConv: LocalConversation = {
        id: Date.now().toString(),
        title: `${model?.icon ?? "💬"} ${model?.label ?? "Nixx AI"} · ${timeStr}`,
        model: selectedModel,
        createdAt: now.toISOString(),
        messages: [],
      };
      const updated = [newConv, ...conversations];
      setConversations(updated);
      saveConversations(updated);
      setActiveConvId(newConv.id);
      setSidebarOpen(false);
    };

    const handleUpdateMessages = (convId: string, messages: LocalMessage[]) => {
      setConversations(prev => {
        const updated = prev.map(c => c.id === convId ? { ...c, messages } : c);
        saveConversations(updated);
        return updated;
      });
    };

    const handleDelete = (id: string) => {
      setConversations(prev => {
        const updated = prev.filter(c => c.id !== id);
        saveConversations(updated);
        return updated;
      });
      if (activeConvId === id) setActiveConvId(null);
    };

    const handleSelectModel = (modelId: string) => {
      setSelectedModel(modelId);
      setSidebarOpen(false);
    };

    const activeModel = MODELS.find(m => m.id === selectedModel);
    const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
    const availableModels = MODELS.filter(m => !m.off);

    return (
      <>
        <style>{ANIM}</style>

        <button className="nx-menu-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Menu">☰</button>
        <button className="nx-theme-toggle" onClick={toggleTheme} aria-label="Tema">{isDark ? "☀️" : "🌙"}</button>

        <div className={`nx-sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />
        <div className={`nx-sidebar ${sidebarOpen ? "active" : ""}`}>
          <ChatSidebar
            conversations={conversations}
            activeId={activeConvId}
            selectedModel={selectedModel}
            models={MODELS}
            onSelect={id => { setActiveConvId(id); setSidebarOpen(false); }}
            onNewChat={handleNewChat}
            onDelete={handleDelete}
            onClearChat={() => { if (activeConvId && confirm("Hapus percakapan ini?")) handleDelete(activeConvId); }}
            onSelectModel={handleSelectModel}
          />
        </div>

        <div className="nx-main">
          {/* Header */}
          <header className="nx-header">
            <div className="nx-logo-container">
              <img src="https://iili.io/f7nDq8X.jpg" alt="Nixx AI" className="nx-logo-img"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="nx-logo-text">
                <div className="nx-logo">Nixx AI</div>
                <div className="nx-tagline">
                  {activeModel ? `${activeModel.icon} ${activeModel.label} · ${activeModel.badge}` : "26 AI Models · Gratis ✨"}
                </div>
              </div>
            </div>
          </header>

          <div className="nx-chat-container">
            {activeConvId && activeConv ? (
              <ChatThread
                conversation={activeConv}
                onUpdateMessages={msgs => handleUpdateMessages(activeConvId, msgs)}
              />
            ) : (
              /* ──── WELCOME SCREEN ──── */
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", padding:"12px 16px" }}>
                {/* Orbs */}
                {[
                  { w:360,h:360,t:"-110px",l:"-110px",c:"rgba(124,58,237,.3)",a:"nxA 9s ease-in-out infinite" },
                  { w:280,h:280,b:"-70px",r:"-70px",c:"rgba(59,130,246,.22)",a:"nxB 12s ease-in-out infinite" },
                  { w:200,h:200,t:"38%",r:"4%",c:"rgba(236,72,153,.18)",a:"nxC 15s ease-in-out infinite" },
                ].map((o, i) => (
                  <div key={i} style={{ position:"absolute", width:o.w, height:o.h, borderRadius:"50%",
                    background:`radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
                    top:o.t, left:o.l, bottom:o.b, right:o.r,
                    animation:o.a, pointerEvents:"none" }} />
                ))}

                <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:14, maxWidth:500, width:"100%", textAlign:"center" }}>

                  {/* Brand */}
                  <div className="nx-hero-card" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                    <div style={{
                      width:76, height:76, borderRadius:"50%", overflow:"hidden",
                      background:"linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)",
                      boxShadow:"0 0 30px rgba(124,58,237,.7), 0 0 70px rgba(124,58,237,.2)",
                      border:"3px solid rgba(255,255,255,.18)", flexShrink:0,
                    }}>
                      <img src="https://iili.io/f7nDq8X.jpg" alt="Nixx"
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}
                        onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                    </div>
                    <span style={{
                      fontSize:"2rem", fontWeight:900, letterSpacing:"-.5px", lineHeight:1,
                      background:"linear-gradient(135deg,#a78bfa 0%,#f472b6 50%,#60a5fa 100%)",
                      WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
                    }}>Nixx AI</span>
                  </div>

                  {/* Headline */}
                  <div style={{ animation:"nxUp .5s ease .1s both" }}>
                    <h2 style={{ color:"var(--nx-text)", fontSize:"clamp(1.15rem,3.5vw,1.4rem)", fontWeight:800, margin:"0 0 5px", lineHeight:1.25 }}>
                      Apa yang bisa saya bantu hari ini?
                    </h2>
                    <p style={{ color:"var(--nx-text-muted)", fontSize:".82rem", margin:0 }}>
                      26 model AI · Gratis selamanya · Bahasa Indonesia
                    </p>
                  </div>

                  {/* Badge row */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center", animation:"nxUp .5s ease .18s both" }}>
                    {([["⚡","Cepat"],["🔒","Privat"],["🆓","Gratis"],["🇮🇩","Indonesia"]] as [string,string][]).map(([ic,lb]) => (
                      <span key={lb} style={{
                        background:"var(--nx-ai-bubble)", border:"1px solid var(--nx-border)",
                        borderRadius:20, padding:"4px 11px", fontSize:".74rem",
                        color:"var(--nx-text-muted)", display:"inline-flex", alignItems:"center", gap:4,
                      }}>{ic} {lb}</span>
                    ))}
                  </div>

                  {/* Active model */}
                  <div style={{
                    background:"rgba(124,58,237,.12)", border:"1px solid rgba(124,58,237,.28)",
                    borderRadius:10, padding:"9px 14px", display:"flex", alignItems:"center", gap:8,
                    fontSize:".8rem", color:"var(--nx-text)", width:"100%", animation:"nxUp .5s ease .25s both",
                  }}>
                    <span style={{ fontSize:"1.1rem" }}>{activeModel?.icon}</span>
                    <span>Model aktif: <strong style={{ color:"#a78bfa" }}>{activeModel?.label}</strong></span>
                    <span style={{ marginLeft:"auto", color:"var(--nx-text-muted)", fontSize:".71rem" }}>Ganti ☰</span>
                  </div>

                  {/* CTA */}
                  <button className="nx-cta" onClick={handleNewChat} style={{
                    background:"linear-gradient(135deg,#7c3aed 0%,#a855f7 55%,#ec4899 100%)",
                    color:"#fff", border:"none", borderRadius:14,
                    padding:"14px 28px", fontSize:"1rem", fontWeight:700,
                    cursor:"pointer", display:"inline-flex", alignItems:"center", gap:9,
                    width:"100%", maxWidth:310, justifyContent:"center",
                    letterSpacing:".2px", fontFamily:"inherit",
                  }}>
                    <span>✨</span> Mulai Percakapan
                  </button>

                  {/* Quick models */}
                  <div style={{ width:"100%", animation:"nxUp .5s ease .4s both" }}>
                    <p style={{ color:"var(--nx-text-muted)", fontSize:".68rem", margin:"0 0 7px", textTransform:"uppercase", letterSpacing:".08em", fontWeight:700, textAlign:"left" }}>
                      Model Tersedia:
                    </p>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {availableModels.slice(0,10).map(m => (
                        <button key={m.id} className="nx-pill" onClick={() => setSelectedModel(m.id)} style={{
                          background: selectedModel===m.id ? "rgba(124,58,237,.3)" : "var(--nx-ai-bubble)",
                          border: selectedModel===m.id ? "1px solid rgba(124,58,237,.6)" : "1px solid var(--nx-border)",
                          borderRadius:8, padding:"4px 9px", fontSize:".71rem",
                          color: selectedModel===m.id ? "#c4b5fd" : "var(--nx-text-muted)",
                          cursor:"pointer", fontFamily:"inherit", opacity: selectedModel===m.id ? 1 : .7,
                        }}>{m.icon} {m.label}</button>
                      ))}
                      {availableModels.length > 10 && (
                        <span style={{ fontSize:".71rem", color:"var(--nx-text-muted)", alignSelf:"center" }}>
                          +{availableModels.length-10} lagi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
  