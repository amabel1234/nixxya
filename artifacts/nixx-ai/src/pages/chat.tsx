import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { useTheme } from "@/App";
import ChatSidebar from "@/components/chat-sidebar";
import ChatThread from "@/components/chat-thread";

interface ModelDef { id: string; label: string; badge: string; icon: string; off: boolean; premium?: boolean }
interface PublicSettings { qrisLink: string; danaNumber: string; danaName: string; priceMonthly: number; priceQuarterly: number; priceYearly: number; dailyLimitFree: number; premiumModelIds: string[] }

const BASE_MODELS: ModelDef[] = [
  { id: "deepseekv3", label: "Nixx AI",       badge: "Fast",      icon: "🧠", off: false },
  { id: "christyai",  label: "Christy AI",    badge: "JKT48",     icon: "⭐", off: false },
  { id: "copilot",    label: "Copilot AI",    badge: "Microsoft", icon: "🤖", off: false },
  { id: "ripple",     label: "Ripple AI",     badge: "OFF",       icon: "🌊", off: true  },
  { id: "felo",       label: "Felo AI",       badge: "New",       icon: "🔍", off: false },
  { id: "turboseek",  label: "Turboseek AI",  badge: "Fast",      icon: "🚀", off: false },
  { id: "perplexed",  label: "Perplexed AI",  badge: "Advanced",  icon: "❓", off: false },
  { id: "muslim",     label: "Muslim AI",     badge: "Religious", icon: "🕌", off: false },
  { id: "gpt3",       label: "GPT-3",         badge: "OpenAI",    icon: "🤖", off: false },
  { id: "gpt4o",      label: "GPT-4o",        badge: "Latest",    icon: "🤖", off: false },
  { id: "perplexity", label: "Perplexity AI", badge: "Web",       icon: "🔍", off: false },
  { id: "groqmini",   label: "Groq Mini",     badge: "Fast",      icon: "⚡", off: false },
  { id: "llama4",     label: "Llama-4 Scout", badge: "17B",       icon: "💻", off: false },
  { id: "llama33",    label: "Llama-3.3",     badge: "70B",       icon: "🌿", off: false },
  { id: "gemma",      label: "Gemma 7B",      badge: "Light",     icon: "💎", off: false },
  { id: "mistral",    label: "Mistral 7B",    badge: "v0.1",      icon: "🌬️", off: false },
  { id: "aoyo",       label: "Aoyo AI",       badge: "New",       icon: "💬", off: false },
  { id: "gptoss120",  label: "GPT-OSS 120B",  badge: "120B",      icon: "💻", off: false },
  { id: "gptoss20",   label: "GPT-OSS 20B",   badge: "20B",       icon: "💻", off: false },
  { id: "gemini25v1", label: "Gemini 2.5 v1", badge: "Flash",     icon: "🤖", off: false },
  { id: "gemini25v2", label: "Gemini 2.5 v2", badge: "Flash",     icon: "🤖", off: false },
  { id: "grok4fast",  label: "Grok 4 Fast",   badge: "Fast",      icon: "⚡", off: false },
  { id: "grok3mini",  label: "Grok 3 Mini",   badge: "Mini",      icon: "⚡", off: false },
  { id: "grok3jail1", label: "Grok Jail v1",  badge: "JB",        icon: "🔓", off: false },
  { id: "grok3jail2", label: "Grok Jail v2",  badge: "JB",        icon: "🔓", off: false },
  { id: "venice",     label: "Venice AI",     badge: "New",       icon: "🌊", off: false },
];

export { BASE_MODELS as MODELS };

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState("deepseekv3");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [appSettings, setAppSettings] = useState<PublicSettings | null>(null);
  const [models, setModels] = useState<ModelDef[]>(BASE_MODELS);

  const { isDark, toggle: toggleTheme } = useTheme();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { data: conversations = [] } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();
  const deleteConversation = useDeleteOpenaiConversation();

  useEffect(() => {
    Promise.all([
      fetch("/api/user/me", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/user/usage", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/settings").then(r => r.ok ? r.json() : null),
    ]).then(([me, usageData, settings]) => {
      if (me) setIsPremium(!!me.isPremium);
      if (usageData) setUsage(usageData);
      if (settings) {
        setAppSettings(settings);
        const premiumIds: string[] = settings.premiumModelIds ?? [];
        setModels(BASE_MODELS.map(m => ({ ...m, premium: premiumIds.includes(m.id) })));
      }
    });
  }, [userId]);

  const refreshUsage = () => {
    fetch("/api/user/usage", { credentials: "include" }).then(r => r.ok ? r.json() : null).then(d => { if (d) setUsage(d); });
  };

  const handleNewChat = () => {
    if (createConversation.isPending) return;
    const activeModel = models.find(m => m.id === selectedModel);
    createConversation.mutate(
      { data: { title: `Percakapan Baru — ${activeModel?.label ?? "Nixx AI"}` } },
      {
        onSuccess: (newConv) => { queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() }); setActiveConvId(newConv.id); setSidebarOpen(false); },
        onError: (err) => { alert(`Gagal membuat percakapan baru:\n${err instanceof Error ? err.message : "Terjadi kesalahan"}\n\nCoba muat ulang halaman.`); },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteConversation.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() }); if (activeConvId === id) setActiveConvId(null); },
    });
  };

  const handleSelectModel = (modelId: string) => {
    const m = models.find(x => x.id === modelId);
    if (m?.premium && !isPremium) { setShowUpgrade(true); return; }
    setSelectedModel(modelId);
    setSidebarOpen(false);
  };

  return (
    <>
      <button className="nx-menu-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Buka sidebar">☰</button>
      <button className="nx-theme-toggle" onClick={toggleTheme} aria-label="Toggle tema">{isDark ? "☀️" : "🌙"}</button>

      <div className={`nx-sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div className={`nx-sidebar ${sidebarOpen ? "active" : ""}`}>
        <ChatSidebar
          conversations={conversations}
          activeId={activeConvId}
          selectedModel={selectedModel}
          models={models}
          isCreating={createConversation.isPending}
          isPremium={isPremium}
          usage={usage}
          onSelect={(id) => { setActiveConvId(id); setSidebarOpen(false); }}
          onNewChat={handleNewChat}
          onDelete={handleDelete}
          onClearChat={() => { if (activeConvId && confirm("Hapus percakapan ini?")) handleDelete(activeConvId); }}
          onSelectModel={handleSelectModel}
          onUpgrade={() => setShowUpgrade(true)}
        />
      </div>

      <div className="nx-main">
        <header className="nx-header">
          <div className="nx-logo-container">
            <img src="https://iili.io/f7nDq8X.jpg" alt="Nixx AI" className="nx-logo-img" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="nx-logo-text">
              <div className="nx-logo">Nixx AI</div>
              <div className="nx-tagline">
                {isPremium ? "👑 Premium — 26 Model Tanpa Batas" : `26 AI Models • ${usage ? `${usage.used}/${usage.limit} pesan hari ini` : "Free Assistant"}`}
              </div>
            </div>
          </div>
          {!isPremium && usage && usage.used >= usage.limit && (
            <button onClick={() => setShowUpgrade(true)} style={{
              padding: "6px 16px", borderRadius: 99, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontWeight: 700, fontSize: "0.82rem",
            }}>👑 Upgrade</button>
          )}
        </header>

        <div className="nx-chat-container">
          {activeConvId ? (
            <ChatThread conversationId={activeConvId} selectedModel={selectedModel} onLimitReached={() => { setShowUpgrade(true); refreshUsage(); }} />
          ) : (
            <div className="nx-chat-messages" style={{ justifyContent: "center", alignItems: "center", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="nx-ai-msg nx-message" style={{ maxWidth: "90%", alignSelf: "auto" }}>
                <div className="nx-msg-content">
                  Halo! Saya Nixx AI dengan 26 model berbeda.{" "}
                  {isPremium ? "Akun kamu sudah Premium 👑 — semua model aktif!" : `Akun gratis kamu punya ${usage ? `${usage.limit - usage.used} pesan tersisa` : "beberapa pesan"} hari ini.`}{" "}
                  Pilih model AI dari sidebar lalu mulai percakapan baru!
                </div>
              </div>
              <button className="nx-send-btn" style={{ minWidth: 180 }} onClick={handleNewChat} disabled={createConversation.isPending}>
                {createConversation.isPending ? "⏳ Membuat..." : "+ Percakapan Baru"}
              </button>
              {!isPremium && (
                <button onClick={() => setShowUpgrade(true)} style={{
                  padding: "9px 24px", borderRadius: 99, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontWeight: 700, fontSize: "0.88rem",
                }}>👑 Upgrade Premium — Unlock 26 Model</button>
              )}
            </div>
          )}
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          appSettings={appSettings}
          onClose={() => setShowUpgrade(false)}
          onSuccess={() => { setShowUpgrade(false); alert("Terima kasih! Pembayaran kamu sedang kami proses. Admin akan mengkonfirmasi dalam 1-24 jam. Cek status di profil."); }}
        />
      )}
    </>
  );
}

function UpgradeModal({ appSettings, onClose, onSuccess }: {
  appSettings: PublicSettings | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"plan" | "pay">("plan");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [danaInput, setDanaInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const plans = appSettings ? [
    { id: "monthly", label: "Bulanan", duration: "30 hari", price: appSettings.priceMonthly, icon: "📅" },
    { id: "quarterly", label: "3 Bulan", duration: "90 hari", price: appSettings.priceQuarterly, icon: "🗓️", popular: true },
    { id: "yearly", label: "Tahunan", duration: "365 hari", price: appSettings.priceYearly, icon: "🏆" },
  ] : [
    { id: "monthly", label: "Bulanan", duration: "30 hari", price: 15000, icon: "📅" },
    { id: "quarterly", label: "3 Bulan", duration: "90 hari", price: 40000, icon: "🗓️", popular: true },
    { id: "yearly", label: "Tahunan", duration: "365 hari", price: 120000, icon: "🏆" },
  ];

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  const handleSubmit = async () => {
    if (!selectedPlan || !danaInput.trim()) { alert("Masukkan nomor Dana kamu!"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan, danaNumber: danaInput.trim(), note: noteInput.trim() || undefined }),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error ?? "Gagal mengirim"); setSubmitting(false); return; }
      onSuccess();
    } catch { alert("Terjadi kesalahan. Coba lagi."); setSubmitting(false); }
  };

  const overlay: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
  const modal: React.CSSProperties = { background: "var(--card-bg,white)", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.4)", position: "relative" };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={{ padding: "24px 24px 0" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-muted)" }}>✕</button>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>👑</div>
            <div style={{ fontWeight: 900, fontSize: "1.3rem", background: "linear-gradient(135deg,#7c3aed,#db2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Upgrade ke Premium
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>Akses 26 model AI tanpa batas pesan harian</div>
          </div>
        </div>

        {step === "plan" ? (
          <div style={{ padding: "0 24px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {plans.map(plan => (
                <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} style={{
                  display: "flex", alignItems: "center", padding: "14px 18px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  border: selectedPlan === plan.id ? "2px solid #7c3aed" : "1.5px solid var(--border-color,#e8e4ff)",
                  background: selectedPlan === plan.id ? "rgba(124,58,237,0.07)" : "var(--primary-bg,#f8f9fa)",
                  position: "relative", transition: "all 0.15s",
                }}>
                  {"popular" in plan && plan.popular && (
                    <span style={{ position: "absolute", top: -8, right: 12, background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", borderRadius: 99, fontSize: "0.68rem", fontWeight: 800, padding: "2px 8px" }}>POPULER</span>
                  )}
                  <span style={{ fontSize: 24, marginRight: 12 }}>{plan.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{plan.label}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{plan.duration}</div>
                  </div>
                  <div style={{ fontWeight: 900, color: "#7c3aed", fontSize: "1.05rem" }}>Rp {plan.price.toLocaleString("id-ID")}</div>
                </button>
              ))}
            </div>
            <button onClick={() => { if (!selectedPlan) { alert("Pilih paket dulu!"); return; } setStep("pay"); }} style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontWeight: 800, fontSize: "0.95rem",
            }}>Lanjut Pembayaran →</button>
          </div>
        ) : (
          <div style={{ padding: "0 24px 24px" }}>
            <button onClick={() => setStep("plan")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 16, padding: 0 }}>← Ganti Paket</button>

            <div style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.08),rgba(219,39,119,0.08))", borderRadius: 12, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700 }}>Paket {selectedPlanData?.label}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{selectedPlanData?.duration}</div>
              </div>
              <div style={{ fontWeight: 900, color: "#7c3aed", fontSize: "1.15rem" }}>Rp {selectedPlanData?.price.toLocaleString("id-ID")}</div>
            </div>

            <div style={{ background: "var(--primary-bg,#f8f9fa)", borderRadius: 12, padding: 16, marginBottom: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, fontSize: "0.9rem" }}>📱 Transfer via Dana ke:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#7c3aed" }}>{appSettings?.danaNumber || "Belum diatur"}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>a.n. {appSettings?.danaName || "Nixx AI"}</div>
                </div>
                {appSettings?.danaNumber && (
                  <button onClick={() => { navigator.clipboard.writeText(appSettings.danaNumber); alert("Nomor disalin!"); }} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border-color,#e8e4ff)", background: "white", cursor: "pointer", fontSize: "0.75rem" }}>Salin</button>
                )}
              </div>
              {appSettings?.qrisLink ? (
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>atau scan QRIS:</div>
                  <img src={appSettings.qrisLink} alt="QRIS" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 10, border: "1px solid var(--border-color,#eee)", cursor: "pointer" }} onClick={() => window.open(appSettings.qrisLink, "_blank")} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              ) : null}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>Nomor Dana kamu (yang kamu pakai untuk transfer) *</label>
              <input
                type="tel" placeholder="0812-xxxx-xxxx"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border-color,#e8e4ff)", background: "var(--primary-bg,#f8f9fa)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                value={danaInput} onChange={e => setDanaInput(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>Catatan (opsional)</label>
              <input
                type="text" placeholder="Misal: sudah transfer jam 14.00"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid var(--border-color,#e8e4ff)", background: "var(--primary-bg,#f8f9fa)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                value={noteInput} onChange={e => setNoteInput(e.target.value)}
              />
            </div>

            <button onClick={handleSubmit} disabled={submitting || !danaInput.trim()} style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: submitting || !danaInput.trim() ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontWeight: 800, fontSize: "0.95rem",
              opacity: submitting || !danaInput.trim() ? 0.7 : 1,
            }}>{submitting ? "⏳ Mengirim konfirmasi..." : "✅ Saya Sudah Transfer"}</button>
            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", textAlign: "center", marginTop: 10 }}>Admin akan memverifikasi dan mengaktifkan premium kamu dalam 1–24 jam</div>
          </div>
        )}
      </div>
    </div>
  );
}
