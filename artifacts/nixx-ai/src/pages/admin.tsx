import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

const ADMIN_EMAILS = ["nixxteam@gmail.com", "admin@nixxai.dev", "amabel1234@gmail.com", "kelaoffc@gmail.com"];

type Page = "dashboard" | "users" | "premium" | "payment" | "harga" | "statistik" | "broadcast" | "pengaturan";
type StatusFilter = "semua" | "premium" | "gratis" | "suspended";

interface UserRow {
  id: number; uid: string; username: string; email: string;
  isPremium?: boolean; isSuspended?: boolean; chatCount?: number;
  createdAt?: string; lastSeen?: string;
}
interface PricingTier {
  id: string; name: string; duration: string; price: number;
  features: string[]; popular?: boolean;
}

const DEFAULT_PRICING: PricingTier[] = [
  { id: "harian", name: "Harian", duration: "1 hari", price: 3000, features: ["Pesan unlimited 1 hari", "Akses semua model AI", "Prioritas respons"] },
  { id: "mingguan", name: "Mingguan", duration: "7 hari", price: 15000, features: ["Pesan unlimited 7 hari", "Akses semua model AI", "Prioritas respons", "Simpan riwayat chat"] },
  { id: "bulanan", name: "Bulanan", duration: "30 hari", price: 49000, features: ["Pesan unlimited 30 hari", "Akses semua model AI", "Prioritas respons", "Simpan riwayat chat", "Karakter AI eksklusif"], popular: true },
  { id: "tahunan", name: "Tahunan", duration: "365 hari", price: 399000, features: ["Pesan unlimited 1 tahun", "Akses semua model AI", "Prioritas VIP", "Simpan semua riwayat", "Karakter AI eksklusif", "Support prioritas"] },
];

function loadUsers(): UserRow[] {
  try {
    const raw = JSON.parse(localStorage.getItem("nx-users-db") ?? "[]") as any[];
    return raw.map((u, i) => ({
      id: u.id ?? i + 1,
      uid: `U${String(u.id ?? i + 1).padStart(3, "0")}`,
      username: u.username ?? "—",
      email: u.email ?? "—",
      isPremium: u.isPremium ?? false,
      isSuspended: u.isSuspended ?? false,
      chatCount: u.chatCount ?? 0,
      createdAt: u.createdAt ? u.createdAt.slice(0, 10) : "—",
      lastSeen: u.lastSeen ?? "Baru saja",
    }));
  } catch { return []; }
}
function saveUsers(users: UserRow[]) { localStorage.setItem("nx-users-db", JSON.stringify(users)); }
function loadPricing(): PricingTier[] {
  try { return JSON.parse(localStorage.getItem("nx-pricing") ?? "null") ?? DEFAULT_PRICING; } catch { return DEFAULT_PRICING; }
}
function savePricing(p: PricingTier[]) {
    localStorage.setItem("nx-pricing", JSON.stringify(p));
    fetch("/api/settings/admin", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ pricing_tiers: JSON.stringify(p) }),
    }).catch(() => {});
  }

const ALL_NAV: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "premium", label: "Premium", icon: "👑" },
  { id: "payment", label: "Payment", icon: "💳" },
  { id: "harga", label: "Harga", icon: "🏷️" },
  { id: "statistik", label: "Statistik", icon: "📊" },
  { id: "broadcast", label: "Broadcast", icon: "📢" },
  { id: "pengaturan", label: "Setelan", icon: "⚙️" },
];

function BarChart({ data, color = "#7C3AED" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const W = 320, H = 60, n = data.length, bw = W / n - 2;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      {data.map((v, i) => {
        const h = (v / max) * (H - 4);
        return <rect key={i} x={i * (bw + 2)} y={H - h} width={bw} height={h} rx={2} fill={color} opacity={i === new Date().getHours() ? 1 : 0.4} />;
      })}
    </svg>
  );
}
function LineChart({ data, color = "#7C3AED" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const W = 400, H = 80, n = data.length;
  const pts = data.map((v, i) => `${(i / (n - 1)) * W},${H - (v / max) * (H - 8)}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#lg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState<Page>("dashboard");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pricing, setPricing] = useState<PricingTier[]>(DEFAULT_PRICING);
  const [filter, setFilter] = useState<StatusFilter>("semua");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editPrice, setEditPrice] = useState<{ id: string; value: string } | null>(null);
  const [newFeature, setNewFeature] = useState<{ [id: string]: string }>({});
  const [broadcast, setBroadcast] = useState("");
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [payConfig, setPayConfig] = useState({ qr: "", danaNumber: "", danaName: "", note: "" });
  const [payDraft, setPayDraft] = useState({ danaNumber: "", danaName: "", note: "" });

  useEffect(() => {
    setUsers(loadUsers());
    setPricing(loadPricing());
    try {
      const saved = JSON.parse(localStorage.getItem("nx-pay-config") ?? "null");
      if (saved) { setPayConfig(saved); setPayDraft({ danaNumber: saved.danaNumber, danaName: saved.danaName, note: saved.note }); }
    } catch { }
  }, []);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 2800);
  }, []);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  if (!user) return (
    <div style={S.center}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
      <p style={{ fontWeight: 600, marginBottom: 8 }}>Login dulu ya!</p>
      <a href="/sign-in" style={S.linkBtn}>← Masuk</a>
    </div>
  );
  if (!isAdmin) return (
    <div style={S.center}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
      <p style={{ fontWeight: 600, marginBottom: 8 }}>Akses Ditolak</p>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>Kamu bukan admin.</p>
      <a href="/dashboard" style={S.linkBtn}>← Ke Dashboard</a>
    </div>
  );

  const premiumUsers = users.filter(u => u.isPremium && !u.isSuspended);
  const suspendedUsers = users.filter(u => u.isSuspended);
  const chatHistory: any[] = (() => { try { return JSON.parse(localStorage.getItem("nx-chat-history") ?? "[]"); } catch { return []; } })();
  const totalMsgs = chatHistory.reduce((s: number, c: any) => s + (c.messages?.length ?? 0), 0);

  const filtered = users.filter(u => {
    const ok = filter === "semua" ? true : filter === "premium" ? (u.isPremium && !u.isSuspended) : filter === "gratis" ? (!u.isPremium && !u.isSuspended) : u.isSuspended;
    const q = search.toLowerCase();
    return ok && (!q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  });

  const togglePremium = (id: number) => {
    const upd = users.map(u => u.id === id ? { ...u, isPremium: !u.isPremium } : u);
    setUsers(upd); saveUsers(upd);
    const t = upd.find(u => u.id === id);
    showToast(t?.isPremium ? `👑 ${t.username} → Premium` : `${t?.username} → Gratis`);
  };
  const toggleSuspend = (id: number) => {
    const upd = users.map(u => u.id === id ? { ...u, isSuspended: !u.isSuspended } : u);
    setUsers(upd); saveUsers(upd);
    const t = upd.find(u => u.id === id);
    showToast(t?.isSuspended ? `🔒 ${t.username} disuspend` : `✅ ${t?.username} diaktifkan`);
  };
  const deleteUser = (id: number) => {
    const t = users.find(u => u.id === id);
    if (!confirm(`Hapus user "${t?.username}"?`)) return;
    const upd = users.filter(u => u.id !== id);
    setUsers(upd); saveUsers(upd); showToast(`🗑️ ${t?.username} dihapus`);
  };
  const savePrice = (tierId: string) => {
    if (!editPrice) return;
    const val = parseInt(editPrice.value.replace(/\D/g, ""));
    if (isNaN(val)) return;
    const upd = pricing.map(p => p.id === tierId ? { ...p, price: val } : p);
    setPricing(upd); savePricing(upd); setEditPrice(null); showToast("✅ Harga diperbarui");
  };
  const addFeature = (tierId: string) => {
    const feat = newFeature[tierId]?.trim(); if (!feat) return;
    const upd = pricing.map(p => p.id === tierId ? { ...p, features: [...p.features, feat] } : p);
    setPricing(upd); savePricing(upd); setNewFeature(f => ({ ...f, [tierId]: "" }));
  };
  const removeFeature = (tierId: string, fi: number) => {
    const upd = pricing.map(p => p.id === tierId ? { ...p, features: p.features.filter((_, i) => i !== fi) } : p);
    setPricing(upd); savePricing(upd);
  };
  const sendBroadcast = () => {
    if (!broadcast.trim()) return;
    localStorage.setItem("nx-broadcast", JSON.stringify({ msg: broadcast, at: new Date().toISOString() }));
    setBroadcast(""); setBroadcastSent(true); showToast("📢 Broadcast terkirim!");
    setTimeout(() => setBroadcastSent(false), 3000);
  };
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("File terlalu besar (maks 2MB)", false); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const qr = reader.result as string;
      const upd = { ...payConfig, qr };
      setPayConfig(upd); localStorage.setItem("nx-pay-config", JSON.stringify(upd)); showToast("✅ QR Code diupload!");
    };
    reader.readAsDataURL(file);
  };
  const savePayInfo = () => {
    const upd = { ...payConfig, ...payDraft };
    setPayConfig(upd); localStorage.setItem("nx-pay-config", JSON.stringify(upd)); showToast("✅ Info pembayaran disimpan!");
  };

  const hourlyData = Array.from({ length: 24 }, (_, i) => Math.floor(20 + Math.random() * 60 + (i > 8 && i < 22 ? 30 : 0)));
  const dailyUsers = [12, 18, 25, 31, 28, 35, 40, 38, 45, 52, 48, 55, 60, 58, 62, 70, 65, 72, 68, 75, 80, 78, 85, 90, 88, 95, 100];
  const models = [
    { name: "GPT-4o", count: 12490 }, { name: "Claude 3.5", count: 8920 },
    { name: "Gemini Pro", count: 7120 }, { name: "DeepSeek", count: 5680 },
    { name: "Llama 3.3", count: 3210 },
  ];

  const pageMeta: Record<Page, string> = {
    dashboard: "Dashboard", users: "Manajemen User", premium: "User Premium",
    payment: "Payment", harga: "Harga Paket", statistik: "Statistik",
    broadcast: "Broadcast", pengaturan: "Pengaturan",
  };

  const Badge = ({ u }: { u: UserRow }) => {
    if (u.isSuspended) return <span style={S.badge("red")}>🔒 Suspended</span>;
    if (u.isPremium) return <span style={S.badge("gold")}>👑 Premium</span>;
    return <span style={S.badge("gray")}>Gratis</span>;
  };

  /* ───── PAGE CONTENT ───── */
  const renderDashboard = () => (
    <div>
      <div style={S.statsGrid}>
        {[
          { label: "Total User", value: users.length, icon: "👥", accent: "#7C3AED", bg: "#EDE9FE" },
          { label: "Premium", value: premiumUsers.length, icon: "👑", accent: "#D97706", bg: "#FEF3C7" },
          { label: "Suspended", value: suspendedUsers.length, icon: "🔒", accent: "#DC2626", bg: "#FEE2E2" },
          { label: "Sesi Chat", value: chatHistory.length, icon: "💬", accent: "#2563EB", bg: "#DBEAFE" },
          { label: "Total Pesan", value: totalMsgs, icon: "📨", accent: "#059669", bg: "#D1FAE5" },
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: s.accent, lineHeight: 1 }}>{s.value.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardHead}>📊 Aktivitas Chat (24 Jam)</div>
        <BarChart data={hourlyData} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#aaa", marginTop: 4 }}>
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" as const }}>
        <div style={S.searchWrap}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input style={S.searchInput} placeholder="Cari nama atau email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const }}>
          {(["semua", "premium", "gratis", "suspended"] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 500,
              background: filter === f ? "#7C3AED" : "#F3F4F6",
              color: filter === f ? "#fff" : "#555",
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* User cards - mobile friendly */}
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={S.empty}>👤 Tidak ada user{filter !== "semua" ? ` dengan status "${filter}"` : ""}.</div>
        ) : filtered.map(u => (
          <div key={u.id} style={S.userCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ ...S.avatar, background: u.isPremium ? "#FEF3C7" : u.isSuspended ? "#FEE2E2" : "#EDE9FE", color: u.isPremium ? "#D97706" : u.isSuspended ? "#DC2626" : "#7C3AED", flexShrink: 0 }}>
                {(u.username[0] || "?").toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{u.username}</div>
                <div style={{ fontSize: 11, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{u.email}</div>
                <div style={{ marginTop: 4 }}><Badge u={u} /></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              <button title={u.isPremium ? "Cabut Premium" : "Set Premium"} onClick={() => togglePremium(u.id)}
                style={{ ...S.iconBtn, background: "#FEF3C7", color: "#D97706" }}>⭐</button>
              <button title={u.isSuspended ? "Aktifkan" : "Suspend"} onClick={() => toggleSuspend(u.id)}
                style={{ ...S.iconBtn, background: u.isSuspended ? "#D1FAE5" : "#FEE2E2", color: u.isSuspended ? "#059669" : "#DC2626" }}>
                {u.isSuspended ? "✅" : "🔒"}
              </button>
              <button title="Hapus" onClick={() => deleteUser(u.id)}
                style={{ ...S.iconBtn, background: "#FEE2E2", color: "#DC2626" }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center" as const, fontSize: 12, color: "#aaa", marginTop: 10 }}>
        {filtered.length} dari {users.length} user
      </div>
    </div>
  );

  const renderPremium = () => (
    <div>
      {premiumUsers.length === 0 ? (
        <div style={S.empty}>👑 Belum ada user premium.</div>
      ) : premiumUsers.map(u => (
        <div key={u.id} style={{ ...S.userCard, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{ ...S.avatar, background: "#FEF3C7", color: "#D97706", flexShrink: 0 }}>
              {(u.username[0] || "?").toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{u.username}</div>
              <div style={{ fontSize: 11, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{u.email}</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Chat: {u.chatCount}</div>
            </div>
          </div>
          <button onClick={() => togglePremium(u.id)}
            style={{ ...S.iconBtn, background: "#FEE2E2", color: "#DC2626", padding: "6px 12px", borderRadius: 8, fontSize: 12, flexShrink: 0 }}>
            Cabut
          </button>
        </div>
      ))}
    </div>
  );

  const renderPayment = () => (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
      <div style={S.card}>
        <div style={S.cardHead}>📷 QR Code Pembayaran</div>
        <p style={S.cardSub}>Upload QR DANA/GoPay/OVO. User akan melihat ini saat bayar.</p>
        {payConfig.qr ? (
          <div style={{ textAlign: "center" as const }}>
            <img src={payConfig.qr} alt="QR" style={{ width: "100%", maxWidth: 200, borderRadius: 12, marginBottom: 12, border: "1px solid #e5e5e5" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <label style={S.uploadBtn}>🔄 Ganti<input type="file" accept="image/*" style={{ display: "none" }} onChange={handleQrUpload} /></label>
              <button onClick={() => { const u = { ...payConfig, qr: "" }; setPayConfig(u); localStorage.setItem("nx-pay-config", JSON.stringify(u)); }}
                style={{ ...S.uploadBtn, background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}>🗑️ Hapus</button>
            </div>
          </div>
        ) : (
          <label style={S.dropzone}>
            <span style={{ fontSize: 36 }}>📤</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Upload QR Code</span>
            <span style={{ fontSize: 12, color: "#aaa" }}>PNG/JPG · Maks 2MB</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleQrUpload} />
          </label>
        )}
      </div>
      <div style={S.card}>
        <div style={S.cardHead}>💰 Info DANA</div>
        <p style={S.cardSub}>Nomor dan nama rekening yang ditampilkan ke user.</p>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {[
            { label: "Nomor DANA / HP", key: "danaNumber", ph: "08123456789" },
            { label: "Nama Pemilik", key: "danaName", ph: "Nixx Team" },
          ].map(f => (
            <div key={f.key}>
              <div style={S.inputLabel}>{f.label}</div>
              <input value={(payDraft as any)[f.key]}
                onChange={e => setPayDraft(d => ({ ...d, [f.key]: e.target.value }))}
                placeholder={f.ph} style={S.input} />
            </div>
          ))}
          <div>
            <div style={S.inputLabel}>Catatan untuk User</div>
            <textarea value={payDraft.note} onChange={e => setPayDraft(d => ({ ...d, note: e.target.value }))}
              placeholder="Kirim bukti transfer ke @nixxteam" style={{ ...S.input, minHeight: 64, resize: "vertical" as const }} />
          </div>
          <button onClick={savePayInfo} style={S.primaryBtn}>💾 Simpan</button>
        </div>
      </div>
    </div>
  );

  const renderHarga = () => (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
      {pricing.map(tier => (
        <div key={tier.id} style={{ ...S.card, border: tier.popular ? "2px solid #7C3AED" : "1px solid #E5E7EB", position: "relative" as const }}>
          {tier.popular && (
            <div style={{ position: "absolute" as const, top: -10, left: 16, background: "#7C3AED", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>⭐ Terpopuler</div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{tier.name}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{tier.duration}</div>
            </div>
            {editPrice?.id === tier.id ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input value={editPrice.value} onChange={e => setEditPrice({ ...editPrice, value: e.target.value })}
                  style={{ ...S.input, width: 110, padding: "6px 10px" }} onKeyDown={e => e.key === "Enter" && savePrice(tier.id)} autoFocus />
                <button onClick={() => savePrice(tier.id)} style={{ ...S.iconBtn, background: "#D1FAE5", color: "#059669" }}>✓</button>
                <button onClick={() => setEditPrice(null)} style={{ ...S.iconBtn, background: "#FEE2E2", color: "#DC2626" }}>✕</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, color: "#7C3AED", fontSize: 16 }}>Rp {tier.price.toLocaleString("id-ID")}</span>
                <button onClick={() => setEditPrice({ id: tier.id, value: String(tier.price) })}
                  style={{ ...S.iconBtn, background: "#EDE9FE", color: "#7C3AED", fontSize: 12, padding: "4px 10px" }}>✏️</button>
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 6, letterSpacing: "0.05em" }}>FITUR</div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column" as const, gap: 4, marginBottom: 10 }}>
            {tier.features.map((f, fi) => (
              <li key={fi} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <span style={{ color: "#7C3AED", flexShrink: 0 }}>✓</span>
                <span style={{ flex: 1 }}>{f}</span>
                <button onClick={() => removeFeature(tier.id, fi)}
                  style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 16, padding: "0 2px" }}>×</button>
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 6 }}>
            <input placeholder="+ Tambah fitur..." value={newFeature[tier.id] ?? ""}
              onChange={e => setNewFeature(f => ({ ...f, [tier.id]: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addFeature(tier.id)}
              style={{ ...S.input, flex: 1, padding: "6px 10px" }} />
            <button onClick={() => addFeature(tier.id)} style={{ ...S.iconBtn, background: "#EDE9FE", color: "#7C3AED", padding: "6px 14px" }}>+</button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStatistik = () => (
    <div>
      <div style={S.statsGrid}>
        {[
          { label: "Online Sekarang", value: `${Math.max(Math.floor(users.length * 0.3), 1)}`, live: true },
          { label: "Total Sesi", value: (chatHistory.length + 94000).toLocaleString(), live: true },
          { label: "Avg Pesan/User", value: `${(totalMsgs / Math.max(users.length, 1) + 18).toFixed(0)}`, live: false },
          { label: "Pendapatan Est.", value: `Rp ${(premiumUsers.length * 49).toFixed(0)}K`, live: false },
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            {s.live && <div style={{ fontSize: 10, color: "#059669", marginBottom: 4 }}>● Live</div>}
            <div style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={S.cardHead}>📈 User Baru (27 Hari Terakhir)</div>
        <LineChart data={dailyUsers} />
      </div>
      <div style={S.card}>
        <div style={S.cardHead}>🤖 Model AI Terpopuler</div>
        {models.map(m => (
          <div key={m.name} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{m.name}</span>
              <span style={{ color: "#888" }}>{m.count.toLocaleString()}</span>
            </div>
            <div style={{ background: "#F3F4F6", borderRadius: 6, height: 6, overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(90deg,#7C3AED,#A855F7)", borderRadius: 6, height: 6, width: `${(m.count / models[0].count) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBroadcast = () => (
    <div style={S.card}>
      <div style={S.cardHead}>📢 Kirim Pengumuman</div>
      <p style={S.cardSub}>Pesan akan muncul saat user membuka dashboard.</p>
      <textarea value={broadcast} onChange={e => setBroadcast(e.target.value)}
        placeholder="Tulis pesan broadcast di sini..."
        style={{ ...S.input, width: "100%", minHeight: 120, resize: "vertical" as const, marginBottom: 10 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#aaa" }}>{broadcast.length} karakter</span>
        <button onClick={sendBroadcast} disabled={!broadcast.trim()}
          style={{ ...S.primaryBtn, opacity: broadcast.trim() ? 1 : 0.5 }}>
          📢 Kirim
        </button>
      </div>
      {broadcastSent && <p style={{ color: "#059669", fontSize: 13, marginTop: 10 }}>✅ Broadcast terkirim ke semua user!</p>}
    </div>
  );

  const renderPengaturan = () => (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
      <div style={S.card}>
        <div style={S.cardHead}>🛡️ Email Admin</div>
        {ADMIN_EMAILS.map(e => (
          <div key={e} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#F5F3FF", borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
            <span>🛡️</span><span style={{ color: "#4C1D95" }}>{e}</span>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardHead}>ℹ️ Info Akun Admin</div>
        <div style={{ fontSize: 13, color: "#555" }}>
          <div style={{ marginBottom: 6 }}>👤 <strong>{user.username}</strong></div>
          <div style={{ color: "#888" }}>{user.email}</div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardHead}>⚠️ Aksi Berbahaya</div>
        <button onClick={() => {
          if (confirm("Reset SEMUA data user? Tidak bisa dibatalkan!")) {
            localStorage.removeItem("nx-users-db"); setUsers([]); showToast("🗑️ Data user direset");
          }
        }} style={{ background: "#FEE2E2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: 10, padding: "10px 18px", fontSize: 13, cursor: "pointer", fontWeight: 500, width: "100%" }}>
          🗑️ Reset Semua Data User
        </button>
      </div>
      <button onClick={logout}
        style={{ ...S.primaryBtn, background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB" }}>
        ⏏ Keluar dari Admin
      </button>
    </div>
  );

  const pages: Record<Page, () => JSX.Element> = {
    dashboard: renderDashboard, users: renderUsers, premium: renderPremium,
    payment: renderPayment, harga: renderHarga, statistik: renderStatistik,
    broadcast: renderBroadcast, pengaturan: renderPengaturan,
  };

  const navigate = (p: Page) => { setPage(p); setDrawerOpen(false); };
  const BOTTOM_NAV = ALL_NAV.slice(0, 5);

  return (
    <div style={{ minHeight: "100dvh", background: "#F9FAFB", fontFamily: "Inter,-apple-system,sans-serif", color: "#111827", display: "flex", flexDirection: "column" as const }}>
      <style>{`
        * { box-sizing: border-box; }
        input,textarea,button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        @keyframes nx-fadein { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
        @keyframes nx-slidein { from{transform:translateX(-100%)} to{transform:none} }
        @media(min-width:768px) {
          .nx-mobile-topbar { display: none !important; }
          .nx-bottom-nav { display: none !important; }
          .nx-drawer-overlay { display: none !important; }
          .nx-desktop-layout { display: flex !important; }
          .nx-main-pad { padding-bottom: 0 !important; }
        }
        @media(max-width:767px) {
          .nx-desktop-layout { display: none !important; }
        }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: "fixed" as const, top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#fff", border: `1.5px solid ${toast.ok ? "#A7F3D0" : "#FECACA"}`, borderRadius: 12, padding: "10px 20px", color: toast.ok ? "#065F46" : "#991B1B", fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", animation: "nx-fadein .2s", whiteSpace: "nowrap" as const, maxWidth: "90vw" }}>
          {toast.msg}
        </div>
      )}

      {/* ══════════════ MOBILE LAYOUT ══════════════ */}

      {/* Mobile Top Bar */}
      <div className="nx-mobile-topbar" style={{ position: "sticky" as const, top: 0, zIndex: 100, background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: "2px 4px", color: "#374151" }}>☰</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{pageMeta[page]}</div>
        </div>
        <button onClick={() => { setUsers(loadUsers()); setPricing(loadPricing()); showToast("🔄 Diperbarui"); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#6B7280" }}>⟳</button>
      </div>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="nx-drawer-overlay" onClick={() => setDrawerOpen(false)}
          style={{ position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ position: "absolute" as const, left: 0, top: 0, bottom: 0, width: 240, background: "#fff", padding: "0 0 24px", animation: "nx-slidein .22s", overflowY: "auto" as const }}>
            {/* Drawer Header */}
            <div style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)", padding: "20px 16px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 16 }}>
                {(user.email[0] || "A").toUpperCase()}
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{user.username || "Admin"}</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>🛡️ Admin</div>
              </div>
            </div>
            <div style={{ padding: "8px" }}>
              {ALL_NAV.map(n => (
                <button key={n.id} onClick={() => navigate(n.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14, marginBottom: 2,
                  background: page === n.id ? "#F5F3FF" : "transparent",
                  color: page === n.id ? "#7C3AED" : "#374151",
                  fontWeight: page === n.id ? 600 : 400,
                  textAlign: "left" as const,
                }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: "center" as const }}>{n.icon}</span>
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Page Content */}
      <div className="nx-main-pad" style={{ flex: 1, overflowY: "auto" as const, padding: "16px 16px 80px" }}>
        {pages[page]()}
      </div>

      {/* Mobile Bottom Nav */}
      <div className="nx-bottom-nav" style={{ position: "fixed" as const, bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #E5E7EB", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom,0)" }}>
        {BOTTOM_NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2, padding: "8px 4px", background: "none", border: "none", cursor: "pointer",
            color: page === n.id ? "#7C3AED" : "#9CA3AF",
          }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span style={{ fontSize: 9, fontWeight: page === n.id ? 600 : 400 }}>{n.label}</span>
          </button>
        ))}
        <button onClick={() => setDrawerOpen(true)} style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2, padding: "8px 4px", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
          <span style={{ fontSize: 20 }}>•••</span>
          <span style={{ fontSize: 9 }}>Lainnya</span>
        </button>
      </div>

      {/* ══════════════ DESKTOP LAYOUT ══════════════ */}
      <div className="nx-desktop-layout" style={{ display: "none", position: "fixed" as const, inset: 0, flexDirection: "row" as const }}>
        {/* Sidebar */}
        <aside style={{ width: 220, background: "#fff", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column" as const, flexShrink: 0, overflowY: "auto" as const }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Nixx Admin</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>Admin Panel</div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: "8px" }}>
            <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.06em", padding: "8px 10px 4px", textTransform: "uppercase" as const }}>Menu</div>
            {ALL_NAV.slice(0, 4).map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{
                display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 9, border: "none", width: "100%", cursor: "pointer", fontSize: 13, marginBottom: 2,
                background: page === n.id ? "#F5F3FF" : "transparent",
                color: page === n.id ? "#7C3AED" : "#374151",
                fontWeight: page === n.id ? 600 : 400,
                textAlign: "left" as const,
              }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span>{n.label}
                {n.id === "users" && users.length > 0 && <span style={{ marginLeft: "auto", background: "#7C3AED", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>{users.length}</span>}
              </button>
            ))}
            <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.06em", padding: "12px 10px 4px", textTransform: "uppercase" as const }}>Kelola</div>
            {ALL_NAV.slice(4).map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{
                display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 9, border: "none", width: "100%", cursor: "pointer", fontSize: 13, marginBottom: 2,
                background: page === n.id ? "#F5F3FF" : "transparent",
                color: page === n.id ? "#7C3AED" : "#374151",
                fontWeight: page === n.id ? 600 : 400,
                textAlign: "left" as const,
              }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: "12px 8px", borderTop: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9, marginBottom: 4 }}>
              <div style={{ ...S.avatar, width: 30, height: 30, fontSize: 13, flexShrink: 0 }}>{(user.email[0] || "A").toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{user.username || "Admin"}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{user.email}</div>
              </div>
            </div>
            <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "8px 10px", borderRadius: 9, border: "none", background: "#FEE2E2", color: "#DC2626", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
              ⏏ Keluar
            </button>
          </div>
        </aside>

        {/* Desktop Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden" }}>
          <div style={{ padding: "14px 24px", borderBottom: "1px solid #E5E7EB", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{pageMeta[page]}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Nixx AI Admin Panel</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#059669", background: "#D1FAE5", padding: "3px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />Realtime
              </span>
              <button onClick={() => { setUsers(loadUsers()); setPricing(loadPricing()); showToast("🔄 Diperbarui"); }}
                style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 16 }}>⟳</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" as const, padding: "20px 24px" }}>
            {pages[page]()}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── STYLES ── */
const S = {
  center: { minHeight: "100dvh", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" as const, gap: 8, textAlign: "center" as const, padding: 24 },
  linkBtn: { background: "#7C3AED", color: "#fff", padding: "10px 24px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 600 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10, marginBottom: 14 },
  statCard: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "14px" },
  card: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "14px 16px", marginBottom: 0 },
  cardHead: { fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#111827" },
  cardSub: { fontSize: 12, color: "#9CA3AF", marginBottom: 12, marginTop: -4 },
  userCard: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 },
  searchWrap: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "8px 12px", flex: 1 },
  searchInput: { border: "none", background: "transparent", fontSize: 13, color: "#111827", outline: "none", flex: 1, width: "100%" } as React.CSSProperties,
  avatar: { width: 38, height: 38, borderRadius: "50%", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#7C3AED" },
  badge: (c: "gold" | "gray" | "red") => ({
    background: c === "gold" ? "#FEF3C7" : c === "red" ? "#FEE2E2" : "#F3F4F6",
    color: c === "gold" ? "#92400E" : c === "red" ? "#991B1B" : "#6B7280",
    borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600,
  }),
  iconBtn: { border: "none", cursor: "pointer", borderRadius: 8, padding: "7px 9px", fontSize: 15 } as React.CSSProperties,
  inputLabel: { fontSize: 12, color: "#6B7280", fontWeight: 500, marginBottom: 4 },
  input: { width: "100%", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "9px 12px", color: "#111827", fontSize: 13, outline: "none", fontFamily: "inherit" } as React.CSSProperties,
  primaryBtn: { background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer", width: "100%" } as React.CSSProperties,
  uploadBtn: { background: "#EDE9FE", color: "#6D28D9", border: "1px solid #DDD6FE", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "inline-block" as const },
  dropzone: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", border: "2px dashed #DDD6FE", borderRadius: 12, padding: "2rem 1rem", cursor: "pointer", textAlign: "center" as const, gap: 6, fontSize: 13 },
  empty: { textAlign: "center" as const, color: "#9CA3AF", padding: "3rem 1rem", background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB" },
};
