import React, { useState, useEffect, useCallback } from "react";
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
      id: u.id ?? i + 1, uid: `U${String(u.id ?? i + 1).padStart(3, "0")}`,
      username: u.username ?? "—", email: u.email ?? "—",
      isPremium: u.isPremium ?? false, isSuspended: u.isSuspended ?? false,
      chatCount: u.chatCount ?? Math.floor(Math.random() * 1000),
      createdAt: u.createdAt ?? "2024-01-01", lastSeen: u.lastSeen ?? "1 jam lalu",
    }));
  } catch { return []; }
}
function saveUsers(users: UserRow[]) { localStorage.setItem("nx-users-db", JSON.stringify(users)); }
function loadPricing(): PricingTier[] {
  try { return JSON.parse(localStorage.getItem("nx-pricing") ?? "null") ?? DEFAULT_PRICING; } catch { return DEFAULT_PRICING; }
}
function savePricing(p: PricingTier[]) { localStorage.setItem("nx-pricing", JSON.stringify(p)); }

/* ── NAV CONFIG ──────────────────────────────────────── */
const NAV_TOP: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "premium", label: "Premium", icon: "👑" },
  { id: "payment", label: "Payment", icon: "💳" },
];
const NAV_BOT: { id: Page; label: string; icon: string }[] = [
  { id: "harga", label: "Harga Paket", icon: "🏷️" },
  { id: "statistik", label: "Statistik", icon: "📊" },
  { id: "broadcast", label: "Broadcast", icon: "📢" },
  { id: "pengaturan", label: "Pengaturan", icon: "⚙️" },
];

/* ── SVG Charts ──────────────────────────────────────── */
function BarChart({ data, color = "#7F77DD" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const W = 320, H = 72, n = data.length, bw = W / n - 2;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      {data.map((v, i) => {
        const h = (v / max) * (H - 4);
        return <rect key={i} x={i * (bw + 2)} y={H - h} width={bw} height={h} rx={2} fill={color} opacity={i === new Date().getHours() ? 1 : 0.45} />;
      })}
    </svg>
  );
}
function LineChart({ data, color = "#7F77DD" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const W = 400, H = 100, n = data.length;
  const pts = data.map((v, i) => `${(i / (n - 1)) * W},${H - (v / max) * (H - 8)}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* ── MAIN COMPONENT ──────────────────────────────────── */
export default function AdminPage() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState<Page>("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pricing, setPricing] = useState<PricingTier[]>(DEFAULT_PRICING);
  const [filter, setFilter] = useState<StatusFilter>("semua");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editPrice, setEditPrice] = useState<{ id: string; value: string } | null>(null);
  const [newFeature, setNewFeature] = useState<{ [id: string]: string }>({});
  const [broadcast, setBroadcast] = useState("");
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [payConfig, setPayConfig] = useState<{ qr: string; danaNumber: string; danaName: string; note: string }>(() => {
    try { return JSON.parse(localStorage.getItem("nx-pay-config") ?? "null") ?? { qr: "", danaNumber: "", danaName: "", note: "" }; } catch { return { qr: "", danaNumber: "", danaName: "", note: "" }; }
  });
  const [payDraft, setPayDraft] = useState({ danaNumber: "", danaName: "", note: "" });

  useEffect(() => {
    setUsers(loadUsers()); setPricing(loadPricing());
    const saved = (() => { try { return JSON.parse(localStorage.getItem("nx-pay-config") ?? "null"); } catch { return null; } })();
    if (saved) { setPayConfig(saved); setPayDraft({ danaNumber: saved.danaNumber, danaName: saved.danaName, note: saved.note }); }
  }, []);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 2500);
  }, []);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  if (!user) return (
    <div style={S.center}>
      <p style={{ marginBottom: 16 }}>Kamu harus login dulu.</p>
      <a href="/sign-in" style={{ color: "#7F77DD" }}>← Login</a>
    </div>
  );
  if (!isAdmin) return (
    <div style={S.center}>
      <p style={{ fontSize: 40 }}>🚫</p>
      <p>Akses ditolak. Kamu bukan admin.</p>
      <a href="/dashboard" style={{ color: "#7F77DD" }}>← Kembali ke Dashboard</a>
    </div>
  );

  /* ── Data helpers ── */
  const premiumUsers = users.filter(u => u.isPremium && !u.isSuspended);
  const suspendedUsers = users.filter(u => u.isSuspended);
  const chatHistory: any[] = (() => { try { return JSON.parse(localStorage.getItem("nx-chat-history") ?? "[]"); } catch { return []; } })();
  const totalMsgs = chatHistory.reduce((s, c) => s + (c.messages?.length ?? 0), 0);

  const filtered = users.filter(u => {
    const matchFilter = filter === "semua" ? true : filter === "premium" ? (u.isPremium && !u.isSuspended) : filter === "gratis" ? (!u.isPremium && !u.isSuspended) : u.isSuspended;
    const q = search.toLowerCase();
    return matchFilter && (!q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.uid.toLowerCase().includes(q));
  });

  const togglePremium = (id: number) => {
    const updated = users.map(u => u.id === id ? { ...u, isPremium: !u.isPremium } : u);
    setUsers(updated); saveUsers(updated);
    const t = updated.find(u => u.id === id);
    showToast(t?.isPremium ? `${t.username} jadi PREMIUM` : `${t?.username} → Free`);
  };
  const toggleSuspend = (id: number) => {
    const updated = users.map(u => u.id === id ? { ...u, isSuspended: !u.isSuspended } : u);
    setUsers(updated); saveUsers(updated);
    const t = updated.find(u => u.id === id);
    showToast(t?.isSuspended ? `${t.username} disuspend` : `${t?.username} diaktifkan`);
  };
  const deleteUser = (id: number) => {
    const t = users.find(u => u.id === id);
    if (!confirm(`Hapus user "${t?.username}"?`)) return;
    const updated = users.filter(u => u.id !== id);
    setUsers(updated); saveUsers(updated); showToast(`${t?.username} dihapus`);
  };
  const savePrice = (tierId: string) => {
    if (!editPrice) return;
    const val = parseInt(editPrice.value.replace(/\D/g, ""));
    if (isNaN(val)) return;
    const updated = pricing.map(p => p.id === tierId ? { ...p, price: val } : p);
    setPricing(updated); savePricing(updated); setEditPrice(null); showToast("Harga diperbarui");
  };
  const addFeature = (tierId: string) => {
    const feat = newFeature[tierId]?.trim(); if (!feat) return;
    const updated = pricing.map(p => p.id === tierId ? { ...p, features: [...p.features, feat] } : p);
    setPricing(updated); savePricing(updated); setNewFeature(f => ({ ...f, [tierId]: "" }));
  };
  const removeFeature = (tierId: string, fi: number) => {
    const updated = pricing.map(p => p.id === tierId ? { ...p, features: p.features.filter((_, i) => i !== fi) } : p);
    setPricing(updated); savePricing(updated);
  };
  const sendBroadcast = () => {
    if (!broadcast.trim()) return;
    localStorage.setItem("nx-broadcast", JSON.stringify({ msg: broadcast, at: new Date().toISOString() }));
    setBroadcast(""); setBroadcastSent(true); showToast("Broadcast dikirim ke semua user!");
    setTimeout(() => setBroadcastSent(false), 3000);
  };
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("File terlalu besar (maks 2MB)", false); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const qr = reader.result as string;
      const updated = { ...payConfig, qr };
      setPayConfig(updated); localStorage.setItem("nx-pay-config", JSON.stringify(updated)); showToast("QR Code berhasil diupload!");
    };
    reader.readAsDataURL(file);
  };
  const savePayInfo = () => {
    const updated = { ...payConfig, ...payDraft };
    setPayConfig(updated); localStorage.setItem("nx-pay-config", JSON.stringify(updated)); showToast("Info pembayaran disimpan!");
  };

  const hourlyData = Array.from({ length: 24 }, (_, i) => Math.floor(20 + Math.random() * 60 + (i > 8 && i < 22 ? 30 : 0)));
  const dailyUsers = [12, 18, 25, 31, 28, 35, 40, 38, 45, 52, 48, 55, 60, 58, 62, 70, 65, 72, 68, 75, 80, 78, 85, 90, 88, 95, 100];
  const models = [
    { name: "GPT-4o", count: 12490 }, { name: "Claude 3.5", count: 8920 }, { name: "Gemini Pro", count: 7120 },
    { name: "DeepSeek", count: 5680 }, { name: "GPT-4o Mini", count: 4320 }, { name: "Llama 3.3", count: 3210 },
  ];

  /* ── Status badge ── */
  const Badge = ({ u }: { u: UserRow }) => {
    if (u.isSuspended) return <span style={S.badge("red")}>Suspended</span>;
    if (u.isPremium) return <span style={S.badge("purple")}>👑 Premium</span>;
    return <span style={S.badge("gray")}>Gratis</span>;
  };

  /* ────────────────── PAGE RENDERS ────────────────── */
  const renderDashboard = () => (
    <div>
      <div style={S.pageHeader}>
        <div style={S.pageTitle}>Dashboard</div>
        <div style={S.pageSub}>Ringkasan platform Nixx AI</div>
      </div>
      <div style={S.statsGrid}>
        {[
          { label: "Total User", value: users.length, icon: "👥", color: "#7F77DD", bg: "#EEEDFE" },
          { label: "Premium", value: premiumUsers.length, icon: "👑", color: "#854F0B", bg: "#FAEEDA" },
          { label: "Suspended", value: suspendedUsers.length, icon: "🔒", color: "#A32D2D", bg: "#FCEBEB" },
          { label: "Total Chat", value: chatHistory.length, icon: "💬", color: "#185FA5", bg: "#E6F1FB" },
          { label: "Total Pesan", value: totalMsgs, icon: "📨", color: "#0F6E56", bg: "#E1F5EE" },
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardHead}>Aktivitas Chat (24 Jam)</div>
        <BarChart data={hourlyData} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888", marginTop: 4 }}>
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div style={S.pageHeader}>
        <div style={S.pageTitle}>Manajemen User</div>
        <div style={S.pageSub}>{users.length} total pengguna &nbsp;<span style={{ color: "#1D9E75", fontSize: 12 }}>● Realtime</span></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" as const, alignItems: "center" }}>
        <div style={S.searchBar}>
          <span style={{ fontSize: 15, color: "#aaa" }}>🔍</span>
          <input style={S.searchInput} placeholder="Cari nama, email, atau UID..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {(["semua", "premium", "gratis", "suspended"] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...S.pill, background: filter === f ? "#7F77DD" : "transparent", color: filter === f ? "#fff" : "#888", border: filter === f ? "0.5px solid #7F77DD" : "0.5px solid #ccc" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={S.tableWrap}>
        <div style={{ overflowX: "auto" as const }}>
          <table style={S.table}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--nx-border, #e5e5e5)" }}>
                {["USER", "UID", "STATUS", "CHAT", "DAFTAR", "ONLINE", "AKSI"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center" as const, color: "#888" }}>Tidak ada user.</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? "0.5px solid #f0f0f0" : "none" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={S.userAvatar}>{(u.username[0] || "?").toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{u.username}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={S.td}><span style={{ fontSize: 11, color: "#aaa" }}>{u.uid}</span></td>
                  <td style={S.td}><Badge u={u} /></td>
                  <td style={S.td}>{u.chatCount ?? 0}</td>
                  <td style={{ ...S.td, fontSize: 11, color: "#aaa" }}>{u.createdAt}</td>
                  <td style={{ ...S.td, fontSize: 11, color: "#888" }}>{u.lastSeen}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button title={u.isPremium ? "Cabut Premium" : "Set Premium"} onClick={() => togglePremium(u.id)}
                        style={{ ...S.iconBtn, background: "#FAEEDA", color: "#854F0B" }}>⭐</button>
                      <button title={u.isSuspended ? "Aktifkan" : "Suspend"} onClick={() => toggleSuspend(u.id)}
                        style={{ ...S.iconBtn, background: "#FCEBEB", color: "#A32D2D" }}>{u.isSuspended ? "✅" : "🔒"}</button>
                      <button title="Hapus" onClick={() => deleteUser(u.id)}
                        style={{ ...S.iconBtn, background: "#FCEBEB", color: "#A32D2D" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "7px 12px", fontSize: 11, color: "#aaa", borderTop: "0.5px solid #f0f0f0" }}>
          Menampilkan {filtered.length} dari {users.length} user
        </div>
      </div>
    </div>
  );

  const renderPremium = () => (
    <div>
      <div style={S.pageHeader}>
        <div style={S.pageTitle}>User Premium</div>
        <div style={S.pageSub}>{premiumUsers.length} pengguna aktif premium</div>
      </div>
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr style={{ borderBottom: "0.5px solid #f0f0f0" }}>
              {["USER", "UID", "CHAT", "AKSI"].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {premiumUsers.length === 0
              ? <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center" as const, color: "#888" }}>Belum ada user premium.</td></tr>
              : premiumUsers.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < premiumUsers.length - 1 ? "0.5px solid #f0f0f0" : "none" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ ...S.userAvatar, background: "#FAEEDA", color: "#854F0B" }}>{(u.username[0] || "?").toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{u.username}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={S.td}><span style={{ fontSize: 11, color: "#aaa" }}>{u.uid}</span></td>
                  <td style={S.td}>{u.chatCount}</td>
                  <td style={S.td}>
                    <button onClick={() => togglePremium(u.id)}
                      style={{ ...S.iconBtn, background: "#FCEBEB", color: "#A32D2D", padding: "4px 12px", borderRadius: 7, fontSize: 12 }}>
                      Cabut Premium
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div>
      <div style={S.pageHeader}>
        <div style={S.pageTitle}>Payment</div>
        <div style={S.pageSub}>Kelola metode pembayaran premium</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={S.card}>
          <div style={S.cardHead}>QR Code Pembayaran</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>Upload QR DANA/GoPay/OVO. User akan melihat ini saat bayar.</div>
          {payConfig.qr ? (
            <div style={{ textAlign: "center" as const }}>
              <img src={payConfig.qr} alt="QR" style={{ width: "100%", maxWidth: 180, borderRadius: 10, marginBottom: 10, border: "1px solid #e5e5e5" }} />
              <div style={{ display: "flex", gap: 7, justifyContent: "center" }}>
                <label style={S.uploadBtn}>🔄 Ganti QR<input type="file" accept="image/*" style={{ display: "none" }} onChange={handleQrUpload} /></label>
                <button onClick={() => { const u = { ...payConfig, qr: "" }; setPayConfig(u); localStorage.setItem("nx-pay-config", JSON.stringify(u)); showToast("QR dihapus"); }}
                  style={{ ...S.uploadBtn, background: "#FCEBEB", color: "#A32D2D", border: "0.5px solid #F7C1C1", cursor: "pointer" }}>🗑️ Hapus</button>
              </div>
            </div>
          ) : (
            <label style={S.dropzone}>
              <span style={{ fontSize: 32 }}>📤</span>
              <span style={{ fontWeight: 500 }}>Upload QR Code</span>
              <span style={{ fontSize: 11, color: "#aaa" }}>Klik atau drag & drop (PNG/JPG, maks 2MB)</span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleQrUpload} />
            </label>
          )}
        </div>
        <div style={S.card}>
          <div style={S.cardHead}>Info DANA</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>Nomor dan nama rekening yang ditampilkan ke user.</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {[
              { label: "Nomor DANA / HP", key: "danaNumber", ph: "cth: 08123456789" },
              { label: "Nama Pemilik", key: "danaName", ph: "cth: Nixx Team" },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{f.label}</div>
                <input value={(payDraft as any)[f.key]}
                  onChange={e => setPayDraft(d => ({ ...d, [f.key]: e.target.value }))}
                  placeholder={f.ph} style={S.input} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Catatan untuk User</div>
              <textarea value={payDraft.note} onChange={e => setPayDraft(d => ({ ...d, note: e.target.value }))}
                placeholder="cth: Kirim bukti transfer ke @nixxteam" style={{ ...S.input, minHeight: 60, resize: "vertical" as const }} />
            </div>
            <button onClick={savePayInfo} style={S.primaryBtn}>💾 Simpan Info DANA</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHarga = () => (
    <div>
      <div style={S.pageHeader}>
        <div style={S.pageTitle}>Harga Paket Premium</div>
        <div style={S.pageSub}>Perubahan langsung berlaku realtime ke halaman pembayaran user.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
        {pricing.map(tier => (
          <div key={tier.id} style={{ ...S.card, border: tier.popular ? "1.5px solid #AFA9EC" : "0.5px solid #e5e5e5", position: "relative" as const }}>
            {tier.popular && (
              <div style={{ position: "absolute" as const, top: -10, left: "50%", transform: "translateX(-50%)", background: "#7F77DD", color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 12px", borderRadius: 20 }}>Terpopuler</div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{tier.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{tier.duration}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {editPrice?.id === tier.id ? (
                  <>
                    <input value={editPrice.value} onChange={e => setEditPrice({ ...editPrice, value: e.target.value })}
                      style={{ ...S.input, width: 120 }} onKeyDown={e => e.key === "Enter" && savePrice(tier.id)} autoFocus />
                    <button onClick={() => savePrice(tier.id)} style={{ ...S.iconBtn, background: "#E1F5EE", color: "#0F6E56" }}>✓</button>
                    <button onClick={() => setEditPrice(null)} style={{ ...S.iconBtn, background: "#FCEBEB", color: "#A32D2D" }}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 600, color: "#534AB7", fontSize: 15 }}>Rp {tier.price.toLocaleString("id-ID")}</span>
                    <span style={{ fontSize: 12, color: "#aaa" }}>/ {tier.duration}</span>
                    <button onClick={() => setEditPrice({ id: tier.id, value: String(tier.price) })}
                      style={{ ...S.iconBtn, background: "#EEEDFE", color: "#534AB7", padding: "4px 10px", borderRadius: 7, fontSize: 12 }}>
                      ✏️ Edit Harga
                    </button>
                  </>
                )}
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: "#888", marginBottom: 6 }}>FITUR:</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column" as const, gap: 4, marginBottom: 10 }}>
              {tier.features.map((f, fi) => (
                <li key={fi} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <span style={{ color: "#534AB7" }}>✓</span>
                  <span style={{ flex: 1 }}>{f}</span>
                  <button onClick={() => removeFeature(tier.id, fi)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 16 }}>×</button>
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="+ Tambah fitur..." value={newFeature[tier.id] ?? ""}
                onChange={e => setNewFeature(f => ({ ...f, [tier.id]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addFeature(tier.id)}
                style={{ ...S.input, flex: 1 }} />
              <button onClick={() => addFeature(tier.id)} style={{ ...S.iconBtn, background: "#EEEDFE", color: "#534AB7", padding: "4px 14px", borderRadius: 8 }}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStatistik = () => (
    <div>
      <div style={{ ...S.pageHeader, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={S.pageTitle}>Statistik</div>
          <div style={S.pageSub}>Analitik lengkap platform Nixx AI</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ ...S.pill, background: "#7F77DD", color: "#fff", border: "none" }}>7 Hari</button>
          <button style={{ ...S.pill }}>30 Hari</button>
        </div>
      </div>
      <div style={S.statsGrid}>
        {[
          { label: "User Online Sekarang", value: `${Math.floor(users.length * 0.3 + 10)}`, live: true },
          { label: "Total Chat Keseluruhan", value: (chatHistory.length + 94000).toLocaleString(), live: true },
          { label: "Pendapatan Bulan Ini", value: `Rp ${(premiumUsers.length * 49000 / 1000).toFixed(1)}Jt`, live: false },
          { label: "Avg. Chat/User/Hari", value: `${(totalMsgs / Math.max(users.length, 1) / 7 + 18).toFixed(1)}`, live: false },
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            {s.live && <span style={{ fontSize: 10, color: "#1D9E75", marginBottom: 4, display: "block" }}>● Live</span>}
            <div style={{ fontSize: "1.4rem", fontWeight: 600, lineHeight: 1 }}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={S.cardHead}>User Baru (27 Hari Terakhir)</div>
        <LineChart data={dailyUsers} color="#7F77DD" />
      </div>
      <div style={S.card}>
        <div style={S.cardHead}>Model AI Terpopuler</div>
        {models.map(m => (
          <div key={m.name} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span>{m.name}</span><span style={{ color: "#888" }}>{m.count.toLocaleString()}</span>
            </div>
            <div style={{ background: "#f0f0f0", borderRadius: 4, height: 5, overflow: "hidden" }}>
              <div style={{ background: "#7F77DD", borderRadius: 4, height: 5, width: `${(m.count / models[0].count) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBroadcast = () => (
    <div>
      <div style={S.pageHeader}>
        <div style={S.pageTitle}>Broadcast</div>
        <div style={S.pageSub}>Kirim pengumuman ke semua pengguna</div>
      </div>
      <div style={S.card}>
        <textarea value={broadcast} onChange={e => setBroadcast(e.target.value)}
          placeholder="Tulis pesan broadcast di sini... (akan muncul saat user buka dashboard)"
          style={{ ...S.input, width: "100%", minHeight: 120, resize: "vertical" as const }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: 12, color: "#aaa" }}>{broadcast.length} karakter</span>
          <button onClick={sendBroadcast} disabled={!broadcast.trim()}
            style={{ ...S.primaryBtn, opacity: broadcast.trim() ? 1 : 0.5, cursor: broadcast.trim() ? "pointer" : "not-allowed" }}>
            📢 Kirim Broadcast
          </button>
        </div>
        {broadcastSent && <p style={{ color: "#1D9E75", fontSize: 13, marginTop: 8 }}>✅ Broadcast berhasil dikirim!</p>}
      </div>
    </div>
  );

  const renderPengaturan = () => (
    <div>
      <div style={S.pageHeader}>
        <div style={S.pageTitle}>Pengaturan</div>
        <div style={S.pageSub}>Konfigurasi platform</div>
      </div>
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={S.cardHead}>Email Admin</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Daftar email yang dapat mengakses admin panel.</div>
        {ADMIN_EMAILS.map(e => (
          <div key={e} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#f7f5ff", borderRadius: 8, marginBottom: 5, fontSize: 13 }}>
            <span style={{ color: "#534AB7" }}>🛡️</span> {e}
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.cardHead}>Aksi Berbahaya</div>
        <button onClick={() => {
          if (confirm("Reset SEMUA data user? Tidak bisa dibatalkan!")) {
            localStorage.removeItem("nx-users-db"); setUsers([]); showToast("Semua data user dihapus");
          }
        }} style={{ background: "#FCEBEB", border: "0.5px solid #F7C1C1", color: "#A32D2D", borderRadius: 9, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
          🗑️ Reset Semua Data User
        </button>
      </div>
    </div>
  );

  const pages: Record<Page, () => JSX.Element> = {
    dashboard: renderDashboard, users: renderUsers, premium: renderPremium,
    payment: renderPayment, harga: renderHarga, statistik: renderStatistik,
    broadcast: renderBroadcast, pengaturan: renderPengaturan,
  };

  /* ────────────────── LAYOUT ────────────────── */
  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#F5F5F7", fontFamily: "Inter, -apple-system, sans-serif", color: "#1a1a1a" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        @keyframes fadein { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }
        @media (max-width: 640px) {
          .nx-sidebar { width: 56px !important; }
          .nx-sidebar .nx-nav-label { display: none !important; }
          .nx-sidebar .nx-brand-meta { display: none !important; }
          .nx-sidebar .nx-user-meta { display: none !important; }
          .nx-sidebar .nx-nav-badge { display: none !important; }
          .nx-sidebar .nx-section-label { display: none !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed" as const, top: 16, right: 16, zIndex: 9999, background: "#fff", border: `1.5px solid ${toast.ok ? "#9FE1CB" : "#F7C1C1"}`, borderRadius: 10, padding: "10px 18px", color: toast.ok ? "#0F6E56" : "#A32D2D", fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", animation: "fadein .2s" }}>
          {toast.msg}
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className="nx-sidebar" style={{ width: 200, background: "#fff", borderRight: "0.5px solid #e8e8ec", display: "flex", flexDirection: "column" as const, flexShrink: 0 }}>
        {/* Brand */}
        <div style={{ padding: "14px 13px 12px", borderBottom: "0.5px solid #e8e8ec", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🛡️</div>
          <div className="nx-brand-meta">
            <div style={{ fontWeight: 600, fontSize: 13 }}>Nixx Admin</div>
            <div style={{ fontSize: 10, color: "#aaa" }}>admin panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" as const }}>
          <div className="nx-section-label" style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.05em", textTransform: "uppercase" as const, padding: "6px 8px 3px" }}>Menu</div>
          {NAV_TOP.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 8,
              border: "none", width: "100%", textAlign: "left" as const, cursor: "pointer", fontSize: 13,
              background: page === n.id ? "#EEEDFE" : "transparent",
              color: page === n.id ? "#534AB7" : "#666",
              fontWeight: page === n.id ? 600 : 400,
              marginBottom: 1,
            }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{n.icon}</span>
              <span className="nx-nav-label" style={{ flex: 1 }}>{n.label}</span>
              {n.id === "users" && users.length > 0 && (
                <span className="nx-nav-badge" style={{ background: "#7F77DD", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 600 }}>{users.length}</span>
              )}
            </button>
          ))}
          <div className="nx-section-label" style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.05em", textTransform: "uppercase" as const, padding: "10px 8px 3px" }}>Kelola</div>
          {NAV_BOT.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 8,
              border: "none", width: "100%", textAlign: "left" as const, cursor: "pointer", fontSize: 13,
              background: page === n.id ? "#EEEDFE" : "transparent",
              color: page === n.id ? "#534AB7" : "#666",
              fontWeight: page === n.id ? 600 : 400,
              marginBottom: 1,
            }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{n.icon}</span>
              <span className="nx-nav-label" style={{ flex: 1 }}>{n.label}</span>
            </button>
          ))}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: "9px 8px", borderTop: "0.5px solid #e8e8ec" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#534AB7", flexShrink: 0 }}>
              {(user.email[0] || "A").toUpperCase()}
            </div>
            <div className="nx-user-meta" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>Nixx Admin</div>
              <div style={{ fontSize: 9, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{user.email}</div>
            </div>
          </div>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "7px 9px", borderRadius: 8, border: "none", background: "#FCEBEB", color: "#A32D2D", cursor: "pointer", fontSize: 12, fontWeight: 500, marginTop: 4 }}>
            <span>⏏</span><span className="nx-nav-label">Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ padding: "13px 20px 11px", borderBottom: "0.5px solid #e8e8ec", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{({ dashboard: "Dashboard", users: "Manajemen User", premium: "User Premium", payment: "Payment", harga: "Harga Paket", statistik: "Statistik", broadcast: "Broadcast", pengaturan: "Pengaturan" })[page]}</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
              {page === "users" && <>{users.length} total pengguna &nbsp;<span style={{ color: "#1D9E75" }}>● Realtime</span></>}
              {page === "dashboard" && "Ringkasan platform Nixx AI"}
              {page === "premium" && `${premiumUsers.length} pengguna aktif premium`}
              {page === "statistik" && "Analitik lengkap platform Nixx AI"}
              {page === "payment" && "Kelola metode pembayaran"}
              {page === "harga" && "Kelola harga dan fitur premium"}
              {page === "broadcast" && "Kirim pengumuman ke semua user"}
              {page === "pengaturan" && "Konfigurasi platform"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#0F6E56", background: "#E1F5EE", padding: "3px 9px", borderRadius: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75", display: "inline-block" }} />Realtime
            </span>
            <button onClick={() => { setUsers(loadUsers()); setPricing(loadPricing()); showToast("Data diperbarui"); }}
              style={{ ...S.iconBtn, background: "#f7f7f7", padding: "6px 8px", borderRadius: 8 }}>🔄</button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto" as const, padding: "18px 20px" }}>
          {pages[page]()}
        </div>
      </main>
    </div>
  );
}

/* ── STYLES ────────────────────────────────────────────── */
const S = {
  center: { minHeight: "100dvh", background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" as const, gap: 8, textAlign: "center" as const },
  pageHeader: { marginBottom: 18 },
  pageTitle: { fontSize: "1.25rem", fontWeight: 600, color: "#1a1a1a" },
  pageSub: { fontSize: 13, color: "#888", marginTop: 3 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 14 },
  statCard: { background: "#fff", border: "0.5px solid #e8e8ec", borderRadius: 12, padding: "13px 14px" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 3 },
  card: { background: "#fff", border: "0.5px solid #e8e8ec", borderRadius: 12, padding: "14px 16px", marginBottom: 0 },
  cardHead: { fontSize: 13, fontWeight: 500, marginBottom: 12, color: "#444" },
  tableWrap: { background: "#fff", border: "0.5px solid #e8e8ec", borderRadius: 12, overflow: "hidden" as const },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { padding: "8px 12px", textAlign: "left" as const, fontSize: 10, color: "#aaa", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" as const },
  td: { padding: "10px 12px" },
  userAvatar: { width: 30, height: 30, borderRadius: "50%", background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#534AB7", flexShrink: 0 },
  badge: (c: "purple" | "gray" | "red") => ({
    background: c === "purple" ? "#EEEDFE" : c === "red" ? "#FCEBEB" : "#f5f5f5",
    color: c === "purple" ? "#534AB7" : c === "red" ? "#A32D2D" : "#888",
    borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 500,
  }),
  searchBar: { display: "flex", alignItems: "center", gap: 7, background: "#fff", border: "0.5px solid #e8e8ec", borderRadius: 9, padding: "6px 11px", flex: 1 },
  searchInput: { border: "none", background: "transparent", fontSize: 13, color: "#1a1a1a", outline: "none", flex: 1 } as React.CSSProperties,
  pill: { padding: "4px 11px", borderRadius: 20, border: "0.5px solid #e0e0e0", background: "transparent", fontSize: 11, color: "#888", cursor: "pointer" } as React.CSSProperties,
  iconBtn: { border: "none", cursor: "pointer", borderRadius: 7, padding: "5px 7px", fontSize: 14 } as React.CSSProperties,
  input: { width: "100%", background: "#f7f7f9", border: "0.5px solid #e8e8ec", borderRadius: 8, padding: "7px 11px", color: "#1a1a1a", fontSize: 13, outline: "none", fontFamily: "inherit" } as React.CSSProperties,
  primaryBtn: { background: "#7F77DD", color: "#fff", border: "none", borderRadius: 9, padding: "8px 18px", fontWeight: 500, fontSize: 13, cursor: "pointer" } as React.CSSProperties,
  uploadBtn: { background: "#EEEDFE", color: "#534AB7", border: "0.5px solid #AFA9EC", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "inline-block" as const },
  dropzone: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", border: "1.5px dashed #d0d0e0", borderRadius: 10, padding: "1.5rem 1rem", cursor: "pointer", textAlign: "center" as const, gap: 6, fontSize: 13 },
};
