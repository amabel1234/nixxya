import React, { useState, useEffect, useRef } from "react";
import { useTheme, useAuth } from "@/App";

const MODELS = [
  { id: "deepseekv3", label: "Nixx AI",       badge: "Fast",      icon: "🧠", off: false },
  { id: "christyai",  label: "Christy AI",    badge: "JKT48",     icon: "⭐", off: false },
  { id: "copilot",    label: "Copilot AI",    badge: "Microsoft", icon: "🤖", off: false },
  { id: "gpt4o",      label: "GPT-4o",        badge: "Latest",    icon: "🤖", off: false },
  { id: "grok4fast",  label: "Grok 4 Fast",   badge: "Fast",      icon: "⚡", off: false },
  { id: "llama4",     label: "Llama-4 Scout", badge: "17B",       icon: "🌿", off: false },
  { id: "gemini25v1", label: "Gemini 2.5",    badge: "Flash",     icon: "💎", off: false },
  { id: "turboseek",  label: "Turboseek AI",  badge: "Fast",      icon: "🚀", off: false },
  { id: "felo",       label: "Felo AI",       badge: "New",       icon: "🔍", off: false },
  { id: "groqmini",   label: "Groq Mini",     badge: "Fast",      icon: "⚡", off: false },
  { id: "llama33",    label: "Llama-3.3",     badge: "70B",       icon: "🌿", off: false },
  { id: "gemma",      label: "Gemma 7B",      badge: "Light",     icon: "💎", off: false },
  { id: "mistral",    label: "Mistral 7B",    badge: "v0.1",      icon: "🌬️", off: false },
  { id: "gptoss120",  label: "GPT-OSS 120B",  badge: "120B",      icon: "💻", off: false },
  { id: "gptoss20",   label: "GPT-OSS 20B",   badge: "20B",       icon: "💻", off: false },
  { id: "gemini25v2", label: "Gemini 2.5 v2", badge: "Pro",       icon: "🤖", off: false },
  { id: "grok3mini",  label: "Grok 3 Mini",   badge: "Mini",      icon: "⚡", off: false },
  { id: "perplexity", label: "Perplexity AI", badge: "Web",       icon: "🔍", off: false },
  { id: "perplexed",  label: "Perplexed AI",  badge: "Advanced",  icon: "❓", off: false },
  { id: "muslim",     label: "Muslim AI",     badge: "Islami",    icon: "🕌", off: false },
  { id: "aoyo",       label: "Aoyo AI",       badge: "New",       icon: "💬", off: false },
  { id: "grok3jail1", label: "Grok Jail v1",  badge: "JB",        icon: "🔓", off: false },
  { id: "grok3jail2", label: "Grok Jail v2",  badge: "JB",        icon: "🔓", off: false },
  { id: "venice",     label: "Venice AI",     badge: "New",       icon: "🌊", off: false },
  { id: "gpt3",       label: "GPT-3",         badge: "OpenAI",    icon: "🤖", off: false },
  { id: "ripple",     label: "Ripple AI",     badge: "OFF",       icon: "🌊", off: true  },
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
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveConversations(c: LocalConversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}
function getTime() {
  const n = new Date();
  return n.getHours().toString().padStart(2,"0") + ":" + n.getMinutes().toString().padStart(2,"0");
}

const SUGGESTIONS = [
  { icon: "📝", text: "Buatkan cerita pendek yang menarik" },
  { icon: "💻", text: "Bantu saya belajar coding Python" },
  { icon: "🎨", text: "Ide bisnis online yang menguntungkan" },
  { icon: "📚", text: "Jelaskan konsep ini dengan mudah" },
];

/* ─────────────────────── CSS ─────────────────────── */
const DARK_CSS = `
  @keyframes nxFadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes nxPop     { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
  @keyframes nxFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes nxDot     { 0%,80%,100%{transform:scale(.55);opacity:.35} 40%{transform:scale(1);opacity:1} }
  @keyframes nxMsgIn   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes nxCur     { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes nxSlideIn { from{transform:translateX(-100%);opacity:0} to{transform:translateX(0);opacity:1} }

  * { box-sizing:border-box; margin:0; padding:0; }

  /* ── APP SHELL (DARK) ─────────────────── */
  .nx-app {
    height:100dvh; width:100%; display:flex; flex-direction:column;
    background:linear-gradient(160deg,#0c0820 0%,#130b30 40%,#0e0c2a 100%);
    font-family:'Inter',system-ui,sans-serif; position:relative; overflow:hidden;
    color:#f1f0f5;
  }

  /* ── HEADER (DARK) ────────────────────── */
  .nx-header {
    flex-shrink:0;
    background:linear-gradient(90deg,#1a0845 0%,#2d1170 40%,#3a1060 70%,#2a0a55 100%);
    padding:0 14px; height:62px;
    display:flex; align-items:center; justify-content:space-between;
    border-bottom:1px solid rgba(167,139,250,.2);
    box-shadow:0 2px 20px rgba(0,0,0,.4);
    position:relative; z-index:30;
  }
  .nx-header-title { font-weight:800; font-size:.98rem; color:#fff; line-height:1.1; }
  .nx-header-sub   { font-size:.68rem; color:rgba(255,255,255,.55); margin-top:1px; }

  .nx-hamburger {
    width:38px; height:38px; border-radius:10px; border:none;
    background:rgba(255,255,255,.1); color:#fff; font-size:1.1rem;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition:background .15s; flex-shrink:0;
  }
  .nx-hamburger:hover { background:rgba(255,255,255,.18); }

  .nx-header-avatar {
    width:40px; height:40px; border-radius:50%; overflow:hidden;
    border:2px solid rgba(167,139,250,.5); box-shadow:0 0 16px rgba(124,58,237,.5);
    flex-shrink:0; background:linear-gradient(135deg,#7c3aed,#ec4899);
    display:flex; align-items:center; justify-content:center; font-size:1.3rem;
  }

  .nx-theme-btn {
    width:38px; height:38px; border-radius:50%;
    border:2px solid rgba(255,255,255,.15);
    background:rgba(255,255,255,.08); cursor:pointer; font-size:1.15rem;
    display:flex; align-items:center; justify-content:center;
    transition:all .18s; flex-shrink:0;
  }
  .nx-theme-btn:hover { background:rgba(255,255,255,.16); border-color:rgba(255,255,255,.28); transform:scale(1.06); }

  /* ── OVERLAY ──────────────────────────── */
  .nx-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); opacity:0; pointer-events:none; transition:opacity .25s; z-index:40; }
  .nx-overlay.open { opacity:1; pointer-events:all; }

  /* ── SIDEBAR (DARK) ───────────────────── */
  .nx-sidebar {
    position:fixed; top:0; left:0; bottom:0; width:290px; z-index:50;
    background:linear-gradient(160deg,#0f0823 0%,#1a0e42 100%);
    border-right:1px solid rgba(124,58,237,.2);
    transform:translateX(-100%); transition:transform .28s cubic-bezier(.4,0,.2,1);
    display:flex; flex-direction:column; overflow:hidden;
  }
  .nx-sidebar.open { transform:translateX(0); }
  .nx-sidebar-inner { flex:1; overflow-y:auto; padding:16px 12px 12px; }
  .nx-sidebar-inner::-webkit-scrollbar { width:4px; }
  .nx-sidebar-inner::-webkit-scrollbar-thumb { background:rgba(124,58,237,.35); border-radius:4px; }

  .nx-sidebar-logo {
    display:flex; align-items:center; gap:10; padding-bottom:14px;
    border-bottom:1px solid rgba(124,58,237,.2); margin-bottom:14px;
  }
  .nx-sidebar-logo-avatar {
    width:38px; height:38px; border-radius:50%; overflow:hidden;
    background:linear-gradient(135deg,#7c3aed,#ec4899);
    display:flex; align-items:center; justify-content:center; font-size:1.25rem;
    box-shadow:0 0 14px rgba(124,58,237,.5); flex-shrink:0;
  }
  .nx-sidebar-logo-text { font-weight:800; color:#fff; font-size:.98rem; }
  .nx-sidebar-logo-sub  { font-size:.65rem; color:rgba(255,255,255,.4); }

  .nx-sb-btn {
    width:100%; display:flex; align-items:center; gap:9; padding:10px 12px;
    border-radius:10px; border:none; background:transparent; color:rgba(255,255,255,.75);
    font-size:.82rem; font-weight:600; cursor:pointer; text-align:left;
    transition:background .15s,color .15s; font-family:inherit; margin-bottom:3px;
  }
  .nx-sb-btn:hover       { background:rgba(124,58,237,.18); color:#fff; }
  .nx-sb-btn.active      { background:rgba(124,58,237,.28); color:#c4b5fd; }
  .nx-sb-btn.danger:hover{ background:rgba(239,68,68,.15); color:#fca5a5; }

  .nx-sb-new {
    background:linear-gradient(90deg,rgba(124,58,237,.25),rgba(236,72,153,.15));
    border:1px solid rgba(124,58,237,.3); color:#c4b5fd; margin-bottom:12px;
  }
  .nx-sb-new:hover { background:linear-gradient(90deg,rgba(124,58,237,.4),rgba(236,72,153,.25)) !important; }

  .nx-sb-section {
    font-size:.62rem; color:rgba(255,255,255,.3); letter-spacing:.1em;
    text-transform:uppercase; font-weight:700; padding:8px 12px 4px;
  }

  .nx-model-btn {
    width:100%; display:flex; align-items:center; gap:8; padding:8px 12px;
    border-radius:9px; border:1px solid transparent; background:transparent;
    color:rgba(255,255,255,.65); font-size:.78rem; cursor:pointer; text-align:left;
    transition:all .15s; font-family:inherit; margin-bottom:2px;
  }
  .nx-model-btn:hover:not(:disabled)  { background:rgba(124,58,237,.15); color:#fff; }
  .nx-model-btn.active                { background:rgba(124,58,237,.25); border-color:rgba(124,58,237,.45); color:#c4b5fd; font-weight:700; }
  .nx-model-btn:disabled              { opacity:.4; cursor:not-allowed; }
  .nx-model-badge { margin-left:auto; font-size:.6rem; background:rgba(255,255,255,.07); border-radius:4px; padding:2px 6px; color:rgba(255,255,255,.4); }
  .nx-model-btn.active .nx-model-badge { background:rgba(124,58,237,.3); color:#a78bfa; }

  /* ── MAIN AREA ────────────────────────── */
  .nx-main { flex:1; display:flex; flex-direction:column; overflow:hidden; position:relative; }

  /* ── WELCOME SCREEN (DARK) ────────────── */
  .nx-welcome {
    flex:1; display:flex; flex-direction:column; align-items:center;
    overflow-y:auto; padding:28px 16px 8px; justify-content:center;
  }
  .nx-welcome::-webkit-scrollbar { width:4px; }
  .nx-welcome::-webkit-scrollbar-thumb { background:rgba(124,58,237,.3); border-radius:4px; }

  .nx-welcome-avatar {
    width:84px; height:84px; border-radius:50%;
    background:linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%);
    display:flex; align-items:center; justify-content:center; font-size:2.5rem;
    box-shadow:0 0 40px rgba(124,58,237,.65),0 0 80px rgba(124,58,237,.2);
    animation:nxPop .5s ease both, nxFloat 4.5s ease-in-out 1s infinite;
    margin-bottom:16px; flex-shrink:0;
  }
  .nx-welcome-title {
    font-size:clamp(1.45rem,5vw,1.9rem); font-weight:900; color:#fff;
    text-align:center; line-height:1.25; margin-bottom:8px;
    animation:nxFadeUp .5s ease .1s both;
  }
  .nx-welcome-title span { color:#a78bfa; }
  .nx-welcome-sub {
    color:rgba(255,255,255,.42); font-size:.84rem; text-align:center;
    line-height:1.6; max-width:320px; margin-bottom:20px;
    animation:nxFadeUp .5s ease .18s both;
  }

  /* tombol mulai percakapan */
  .nx-start-btn {
    background:linear-gradient(135deg,#7c3aed,#a855f7);
    color:#fff; border:none; border-radius:14px;
    padding:13px 28px; font-size:.92rem; font-weight:800;
    cursor:pointer; font-family:inherit; letter-spacing:.3px;
    display:flex; align-items:center; gap:8; margin-bottom:20px;
    box-shadow:0 4px 20px rgba(124,58,237,.5);
    transition:all .2s; animation:nxFadeUp .5s ease .2s both;
  }
  .nx-start-btn:hover { transform:translateY(-2px) scale(1.03); filter:brightness(1.1); box-shadow:0 8px 28px rgba(124,58,237,.65); }
  .nx-start-btn:active { transform:scale(.98); }

  .nx-suggestions {
    width:100%; max-width:460px; display:flex; flex-direction:column; gap:9px;
    animation:nxFadeUp .5s ease .28s both;
  }
  .nx-suggestion-card {
    width:100%; display:flex; align-items:center; gap:14px;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.09);
    border-radius:13px; padding:13px 16px; cursor:pointer;
    transition:all .2s; font-family:inherit; color:#fff; text-align:left;
  }
  .nx-suggestion-card:hover {
    background:rgba(124,58,237,.18); border-color:rgba(124,58,237,.38);
    transform:translateX(3px);
  }
  .nx-suggestion-icon { font-size:1.45rem; flex-shrink:0; }
  .nx-suggestion-text { font-size:.87rem; font-weight:600; color:rgba(255,255,255,.82); line-height:1.4; }

  /* ── MESSAGES (DARK) ──────────────────── */
  .nx-messages { flex:1; overflow-y:auto; padding:14px 12px; display:flex; flex-direction:column; gap:10; }
  .nx-messages::-webkit-scrollbar { width:4px; }
  .nx-messages::-webkit-scrollbar-thumb { background:rgba(124,58,237,.3); border-radius:4px; }
  .nx-msg { animation:nxMsgIn .22s ease both; display:flex; flex-direction:column; max-width:84%; }
  .nx-msg.user { align-self:flex-end; align-items:flex-end; }
  .nx-msg.ai   { align-self:flex-start; align-items:flex-start; }
  .nx-msg-label { font-size:.65rem; color:rgba(255,255,255,.38); margin-bottom:4px; display:flex; align-items:center; gap:5; }
  .nx-msg-bubble { padding:11px 15px; border-radius:16px; font-size:.87rem; line-height:1.6; word-break:break-word; white-space:pre-wrap; }
  .nx-msg.user .nx-msg-bubble { background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; border-bottom-right-radius:4px; }
  .nx-msg.ai   .nx-msg-bubble { background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.9); border-bottom-left-radius:4px; }
  .nx-msg-time { font-size:.6rem; color:rgba(255,255,255,.26); margin-top:4px; padding:0 4px; }

  .nx-typing { display:flex; gap:5; align-items:center; padding:12px 16px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); border-radius:16px; border-bottom-left-radius:4px; width:fit-content; }
  .nx-dot { width:7px; height:7px; border-radius:50%; background:#a78bfa; animation:nxDot 1.4s ease-in-out infinite; }
  .nx-dot:nth-child(2){animation-delay:.16s} .nx-dot:nth-child(3){animation-delay:.32s}
  .nx-cursor { display:inline-block; width:2px; height:.9em; background:#a78bfa; margin-left:2px; vertical-align:middle; animation:nxCur .7s step-end infinite; }

  /* ── INPUT BAR (DARK) ─────────────────── */
  .nx-input-bar {
    flex-shrink:0; padding:10px 12px 14px;
    background:linear-gradient(0deg,rgba(12,8,32,1),rgba(12,8,32,.9));
    border-top:1px solid rgba(124,58,237,.15);
  }
  .nx-input-row {
    display:flex; align-items:flex-end; gap:9;
    background:rgba(255,255,255,.07); border:1px solid rgba(124,58,237,.25);
    border-radius:28px; padding:8px 8px 8px 18px; transition:border-color .2s;
  }
  .nx-input-row:focus-within { border-color:rgba(124,58,237,.55); }
  .nx-textarea {
    flex:1; background:transparent; border:none; outline:none; resize:none;
    color:#fff; font-size:.9rem; font-family:inherit; line-height:1.5;
    min-height:24px; max-height:140px; overflow-y:hidden; padding:2px 0;
  }
  .nx-textarea::placeholder { color:rgba(255,255,255,.32); }
  .nx-send-btn {
    flex-shrink:0; height:42px; padding:0 18px; border-radius:22px;
    background:linear-gradient(135deg,#7c3aed,#a855f7);
    color:#fff; border:none; cursor:pointer; font-size:.82rem; font-weight:800;
    letter-spacing:.4px; display:flex; align-items:center; gap:6; white-space:nowrap;
    transition:all .18s; box-shadow:0 4px 18px rgba(124,58,237,.4); font-family:inherit;
  }
  .nx-send-btn:hover:not(:disabled) { transform:scale(1.05); filter:brightness(1.1); box-shadow:0 6px 24px rgba(124,58,237,.6); }
  .nx-send-btn:active:not(:disabled){ transform:scale(.97); }
  .nx-send-btn:disabled             { opacity:.45; cursor:not-allowed; box-shadow:none; }
`;

/* ─────── CSS TERANG ─────── */
const LIGHT_CSS = `
  .nx-app {
    background: linear-gradient(160deg,#f0eeff 0%,#ede9fe 40%,#f5f0ff 100%) !important;
    color: #1a1625 !important;
  }
  .nx-header {
    background: linear-gradient(90deg,#7c3aed 0%,#8b5cf6 40%,#9333ea 70%,#7c3aed 100%) !important;
    border-bottom: 1px solid rgba(124,58,237,.25) !important;
  }
  .nx-hamburger { background: rgba(255,255,255,.2) !important; }
  .nx-hamburger:hover { background: rgba(255,255,255,.35) !important; }
  .nx-theme-btn { border-color: rgba(255,255,255,.3) !important; background: rgba(255,255,255,.2) !important; }
  .nx-theme-btn:hover { background: rgba(255,255,255,.38) !important; }

  .nx-sidebar {
    background: linear-gradient(160deg,#f5f3ff 0%,#ede9fe 100%) !important;
    border-right: 1px solid rgba(124,58,237,.15) !important;
  }
  .nx-sidebar-logo { border-bottom: 1px solid rgba(124,58,237,.15) !important; }
  .nx-sidebar-logo-text { color: #1a1625 !important; }
  .nx-sidebar-logo-sub  { color: rgba(26,22,37,.45) !important; }
  .nx-sb-section  { color: rgba(26,22,37,.35) !important; }
  .nx-sb-btn      { color: rgba(26,22,37,.7) !important; }
  .nx-sb-btn:hover { background: rgba(124,58,237,.12) !important; color: #1a1625 !important; }
  .nx-sb-btn.active{ background: rgba(124,58,237,.18) !important; color: #7c3aed !important; }
  .nx-sb-new      { background: linear-gradient(90deg,rgba(124,58,237,.15),rgba(236,72,153,.08)) !important; border: 1px solid rgba(124,58,237,.25) !important; color: #7c3aed !important; }

  .nx-model-btn   { color: rgba(26,22,37,.6) !important; }
  .nx-model-btn:hover:not(:disabled) { background: rgba(124,58,237,.1) !important; color: #1a1625 !important; }
  .nx-model-btn.active { background: rgba(124,58,237,.18) !important; border-color: rgba(124,58,237,.35) !important; color: #7c3aed !important; }
  .nx-model-badge { background: rgba(124,58,237,.08) !important; color: rgba(26,22,37,.45) !important; }

  .nx-welcome-title { color: #1a1625 !important; }
  .nx-welcome-title span { color: #7c3aed !important; }
  .nx-welcome-sub { color: rgba(26,22,37,.48) !important; }

  .nx-suggestion-card { background: rgba(255,255,255,.7) !important; border: 1px solid rgba(124,58,237,.12) !important; color: #1a1625 !important; }
  .nx-suggestion-card:hover { background: rgba(124,58,237,.1) !important; border-color: rgba(124,58,237,.3) !important; }
  .nx-suggestion-text { color: rgba(26,22,37,.82) !important; }

  .nx-msg-label { color: rgba(26,22,37,.42) !important; }
  .nx-msg.ai .nx-msg-bubble { background: rgba(255,255,255,.85) !important; border: 1px solid rgba(124,58,237,.12) !important; color: #1a1625 !important; }
  .nx-msg-time { color: rgba(26,22,37,.3) !important; }
  .nx-typing { background: rgba(255,255,255,.8) !important; border: 1px solid rgba(124,58,237,.12) !important; }

  .nx-input-bar { background: linear-gradient(0deg,#ede9fe,rgba(237,233,254,.9)) !important; border-top: 1px solid rgba(124,58,237,.12) !important; }
  .nx-input-row { background: rgba(255,255,255,.8) !important; border: 1px solid rgba(124,58,237,.22) !important; }
  .nx-input-row:focus-within { border-color: rgba(124,58,237,.5) !important; }
  .nx-textarea { color: #1a1625 !important; }
  .nx-textarea::placeholder { color: rgba(26,22,37,.35) !important; }
  .nx-header-sub { color: rgba(255,255,255,.65) !important; }
`;

export default function ChatPage() {
  const { isDark, toggle: toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [conversations, setConversations] = useState<LocalConversation[]>([]);
  const [activeConvId, setActiveConvId]   = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("deepseekv3");
  const [input, setInput]         = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");

  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setConversations(loadConversations()); }, []);

  const activeConv  = conversations.find(c => c.id === activeConvId) ?? null;
  const messages    = activeConv?.messages ?? [];
  const activeModel = MODELS.find(m => m.id === selectedModel);

  const scroll = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scroll, [messages, streamContent]);

  const handleNewChat = (initialText?: string) => {
    const model  = MODELS.find(m => m.id === selectedModel);
    const now    = new Date();
    const timeStr = now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0");
    const newConv: LocalConversation = {
      id: Date.now().toString(),
      title: initialText ? initialText.slice(0,40) : `${model?.icon ?? "💬"} ${model?.label ?? "Nixx AI"} · ${timeStr}`,
      model: selectedModel,
      createdAt: now.toISOString(),
      messages: [],
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    saveConversations(updated);
    setActiveConvId(newConv.id);
    setSidebarOpen(false);
    return newConv;
  };

  const handleDelete = (id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveConversations(updated);
      return updated;
    });
    if (activeConvId === id) setActiveConvId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  /* ── system prompts per model ──────────────────────────────────── */
  const getSystemPrompt = (modelId: string): string => {
    const base = "Kamu menjawab dalam bahasa Indonesia yang santai dan natural. Jangan gunakan LaTeX atau rumus matematika formal. Jawab langsung dan padat tanpa basa-basi.";
    const map: Record<string, string> = {
      deepseekv3: `Kamu adalah Nixx AI, asisten pribadi yang cerdas dan helpful. ${base}`,
      christyai:  `Kamu adalah Christy AI, karakter idol JKT48 yang ceria dan ramah. ${base} Sesekali pakai sapaan 'kak'.`,
      copilot:    `Kamu adalah Copilot AI bergaya Microsoft, fokus produktivitas. ${base}`,
      muslim:     `Kamu adalah Muslim AI. ${base} Sertakan sapaan Islami jika relevan.`,
      gpt4o:      `Kamu adalah asisten GPT-4o yang canggih dan detail. ${base}`,
      grok4fast:  `Kamu adalah Grok 4 Fast dari xAI, cepat dan sedikit witty. ${base}`,
      grok3mini:  `Kamu adalah Grok 3 Mini, ringkas dan cerdas. ${base}`,
      turboseek:  `Kamu adalah Turboseek AI, super cepat dan langsung ke inti. ${base}`,
    };
    return map[modelId] ?? `Kamu adalah Nixx AI, asisten AI yang cerdas dan helpful. ${base}`;
  };

  /* ── panggil Pollinations langsung dari browser ─────────────────── */
  const callAI = async (
    msgs: { role: string; content: string }[],
    modelId: string,
    onToken: (t: string) => void,
  ): Promise<string> => {
    const systemMsg = { role: "system", content: getSystemPrompt(modelId) };
    const payload   = {
      model:   "openai-large",
      messages: [systemMsg, ...msgs],
      stream:  true,
      seed:    Math.floor(Math.random() * 99999),
      private: true,
    };

    /* — coba streaming — */
    try {
      const res = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok && res.body) {
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.replace(/^data:\s?/, "").trim();
            if (!line || line === "[DONE]") continue;
            try {
              const evt = JSON.parse(line) as { choices?: { delta?: { content?: string } }[] };
              const tok = evt.choices?.[0]?.delta?.content;
              if (tok) { full += tok; onToken(tok); }
            } catch { /* skip */ }
          }
        }
        if (full) return full;
      }
    } catch { /* fallthrough */ }

    /* — fallback: non-streaming, emit per kata — */
    try {
      const res2 = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, stream: false }),
      });
      if (res2.ok) {
        const data = await res2.json() as { choices?: { message?: { content?: string } }[] };
        const text  = data.choices?.[0]?.message?.content ?? "";
        if (text) {
          const tokens = text.split(/(\s+)/);
          for (const tok of tokens) {
            if (tok) { onToken(tok); await new Promise(r => setTimeout(r, 12)); }
          }
          return text;
        }
      }
    } catch { /* fallthrough */ }

    /* — fallback via API server kalau browser juga gagal — */
    try {
      const res3 = await fetch("/api/openai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, model: modelId }),
      });
      if (res3.ok && res3.body) {
        const reader = res3.body.getReader();
        const dec    = new TextDecoder();
        let buf = "";
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.replace(/^data: /, "").trim();
            if (!line) continue;
            try {
              const evt = JSON.parse(line) as { content?: string; done?: boolean };
              if (evt.content) { full += evt.content; onToken(evt.content); }
            } catch { /* skip */ }
          }
        }
        if (full) return full;
      }
    } catch { /* noop */ }

    return "Maaf, AI sedang sibuk. Coba lagi sebentar ya! 😊";
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    let convId      = activeConvId;
    let currentConv = activeConv;

    if (!convId || !currentConv) {
      const newConv = handleNewChat(text);
      convId        = newConv.id;
      currentConv   = newConv;
    }

    const userMsg: LocalMessage = { id: Date.now().toString(), role: "user", content: text.trim(), time: getTime() };
    const nextMsgs = [...(currentConv.messages), userMsg];
    setConversations(prev => {
      const updated = prev.map(c => c.id === convId ? { ...c, messages: nextMsgs } : c);
      saveConversations(updated);
      return updated;
    });

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsStreaming(true);
    setStreamContent("");

    const apiMessages = nextMsgs.map(m => ({ role: m.role, content: m.content }));
    let fullResponse  = "";

    fullResponse = await callAI(apiMessages, selectedModel, (tok) => {
      setStreamContent(s => s + tok);
    });

    const aiMsg: LocalMessage = { id: (Date.now()+1).toString(), role: "assistant", content: fullResponse, time: getTime() };
    const finalMsgs = [...nextMsgs, aiMsg];
    setConversations(prev => {
      const updated = prev.map(c => c.id === convId ? { ...c, messages: finalMsgs } : c);
      saveConversations(updated);
      return updated;
    });
    setIsStreaming(false);
    setStreamContent("");
  };

  const handleSend       = () => sendMessage(input);
  const handleKey        = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };
  const handleSuggestion = (text: string) => sendMessage(text);
  const showWelcome      = !activeConvId || !activeConv;

  return (
    <>
      <style>{DARK_CSS}</style>
      {!isDark && <style>{LIGHT_CSS}</style>}

      <div className="nx-app">

        {/* ── HEADER ── */}
        <header className="nx-header">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button className="nx-hamburger" onClick={() => setSidebarOpen(v => !v)} aria-label="Menu">☰</button>
            <div className="nx-header-avatar">
              <img src="https://iili.io/f7nDq8X.jpg" alt="Nixx"
                style={{ width:"100%",height:"100%",objectFit:"cover" }}
                onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
            </div>
          </div>

          <div style={{ flex:1, paddingLeft:10 }}>
            <div className="nx-header-title">Nixx AI</div>
            <div className="nx-header-sub">
              {activeModel ? `${activeModel.icon} ${activeModel.label}` : "26 Model AI · Gratis Selamanya"}
            </div>
          </div>

          <button className="nx-theme-btn" onClick={toggleTheme} aria-label="Ganti tema" title={isDark ? "Mode Terang" : "Mode Gelap"}>
            {isDark ? "☀️" : "🌙"}
          </button>
        </header>

        {/* ── OVERLAY ── */}
        <div className={`nx-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />

        {/* ── SIDEBAR ── */}
        <aside className={`nx-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="nx-sidebar-inner">
            {/* Logo */}
            <div className="nx-sidebar-logo">
              <div className="nx-sidebar-logo-avatar">
                <img src="https://iili.io/f7nDq8X.jpg" alt="Nixx"
                  style={{ width:"100%",height:"100%",objectFit:"cover" }}
                  onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
              </div>
              <div>
                <div className="nx-sidebar-logo-text">Nixx AI</div>
                <div className="nx-sidebar-logo-sub">26 AI Models · Gratis</div>
              </div>
            </div>

            {/* Percakapan Baru */}
            <button className="nx-sb-btn nx-sb-new"
              onClick={() => { setActiveConvId(null); setSidebarOpen(false); }}>
              ✏️ &nbsp;PERCAKAPAN BARU
            </button>

            {/* Riwayat */}
            {conversations.length > 0 && (
              <>
                <div className="nx-sb-section">Riwayat Percakapan</div>
                {conversations.map(conv => (
                  <button key={conv.id}
                    className={`nx-sb-btn${activeConvId === conv.id ? " active" : ""}`}
                    onClick={() => { setActiveConvId(conv.id); setSidebarOpen(false); }}
                    style={{ justifyContent:"space-between", paddingRight:8 }}>
                    <span style={{ display:"flex",alignItems:"center",gap:8,flex:1,overflow:"hidden" }}>
                      <span>💬</span>
                      <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>
                        {conv.title}
                      </span>
                    </span>
                    <span role="button"
                      onClick={e => { e.stopPropagation(); if (confirm("Hapus percakapan ini?")) handleDelete(conv.id); }}
                      style={{ fontSize:".75rem",opacity:.5,cursor:"pointer",padding:"2px 5px",flexShrink:0 }}>
                      🗑
                    </span>
                  </button>
                ))}
              </>
            )}

            {/* User Info + Logout */}
            {user && (
              <>
                <div className="nx-sb-section" style={{ marginTop:12 }}>Akun</div>
                <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(124,58,237,.1)",borderRadius:12,marginBottom:4 }}>
                  <div style={{ width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".9rem",fontWeight:800,color:"#fff",flexShrink:0 }}>
                    {user.avatar}
                  </div>
                  <div style={{ flex:1,overflow:"hidden" }}>
                    <div style={{ fontSize:".8rem",fontWeight:700,color:"#c4b5fd",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user.name}</div>
                    <div style={{ fontSize:".68rem",color:"rgba(255,255,255,.38)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user.email}</div>
                  </div>
                </div>
                <button className="nx-sb-btn danger" onClick={() => { if (confirm("Keluar dari Nixx AI?")) signOut(); }}>🚪 &nbsp;Keluar</button>
              </>
            )}

            {/* Links */}
            <div className="nx-sb-section" style={{ marginTop:12 }}>Link</div>
            <button className="nx-sb-btn" onClick={() => alert("Developer: Nixx Team\nContact: t.me/nixsukakamu")}>👤 Developer 🚀</button>
            <button className="nx-sb-btn" onClick={() => window.open("https://list.unix.biz.id","_blank")}>📚 Store Menu 🛍️</button>
            <button className="nx-sb-btn" onClick={() => window.open("https://t.me/nixsukakamu","_blank")}>💫 Community</button>

            {/* Pilih Model */}
            <div className="nx-sb-section" style={{ marginTop:12 }}>Pilih Model AI</div>
            {MODELS.map(m => (
              <button key={m.id}
                className={`nx-model-btn${selectedModel === m.id ? " active" : ""}`}
                onClick={() => { if (!m.off) { setSelectedModel(m.id); setSidebarOpen(false); } }}
                disabled={m.off}>
                <span>{m.icon}</span>
                <span style={{ flex:1 }}>{m.label}</span>
                <span className="nx-model-badge">{m.badge}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="nx-main">

          {showWelcome ? (
            <div className="nx-welcome">
              <div className="nx-welcome-avatar">🧠</div>
              <h2 className="nx-welcome-title">
                Halo! Ada yang bisa <span>dibantu?</span>
              </h2>
              <p className="nx-welcome-sub">
                Ketik pesan atau klik salah satu saran di bawah
              </p>

              {/* ── TOMBOL MULAI PERCAKAPAN ── */}
              <button className="nx-start-btn" onClick={() => {
                handleNewChat();
                setTimeout(() => textareaRef.current?.focus(), 100);
              }}>
                <span>✨</span>
                Mulai Percakapan
                <span style={{ fontSize:".85rem",opacity:.75 }}>→</span>
              </button>

              <div className="nx-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="nx-suggestion-card" onClick={() => handleSuggestion(s.text)}>
                    <span className="nx-suggestion-icon">{s.icon}</span>
                    <span className="nx-suggestion-text">{s.text}</span>
                  </button>
                ))}
              </div>
              <div style={{ height:16 }} />
            </div>
          ) : (
            <div className="nx-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`nx-msg ${msg.role === "user" ? "user" : "ai"}`}>
                  {msg.role === "assistant" && (
                    <div className="nx-msg-label">🧠 {activeModel?.label ?? "Nixx AI"}</div>
                  )}
                  <div className="nx-msg-bubble">{msg.content}</div>
                  <div className="nx-msg-time">{msg.time}</div>
                </div>
              ))}

              {isStreaming && streamContent && (
                <div className="nx-msg ai">
                  <div className="nx-msg-label">🧠 {activeModel?.label ?? "Nixx AI"}</div>
                  <div className="nx-msg-bubble">{streamContent}<span className="nx-cursor" /></div>
                </div>
              )}

              {isStreaming && !streamContent && (
                <div className="nx-msg ai">
                  <div className="nx-msg-label">🧠 {activeModel?.label ?? "Nixx AI"}</div>
                  <div className="nx-typing">
                    <div className="nx-dot" /><div className="nx-dot" /><div className="nx-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* ── INPUT BAR ── */}
          <div className="nx-input-bar">
            <div className="nx-input-row">
              <textarea
                ref={textareaRef}
                className="nx-textarea"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKey}
                placeholder="Ketik pesan Anda di sini..."
                rows={1}
                disabled={isStreaming}
              />
              <button
                className="nx-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}>
                {isStreaming ? "⏳ Memproses..." : "Kirim ▶"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
