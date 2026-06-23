import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

const ADMIN_EMAILS = ["nixxteam@gmail.com", "admin@nixxai.dev", "amabel1234@gmail.com", "kelaoffc@gmail.com"];

type Page = "dashboard" | "users" | "premium" | "payment" | "harga" | "statistik" | "broadcast" | "pengaturan";
type StatusFilter = "semua" | "premium" | "gratis" | "suspended";

interface UserRow {
  id: number;
  uid: string;
  username: string;
  email: string;
  isPremium?: boolean;
  isSuspended?: boolean;
  chatCount?: number;
  createdAt?: string;
  lastSeen?: string;
}

interface PricingTier {
  id: string;
  name: string;
  duration: string;
  price: number;
  features: string[];
  popular?: boolean;
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
      chatCount: u.chatCount ?? Math.floor(Math.random() * 1000),
      createdAt: u.createdAt ?? "2024-01-01",
      lastSeen: u.lastSeen ?? "1 jam lalu",
    }));
  } catch { return []; }
}

function saveUsers(users: UserRow[]) {
  localStorage.setItem("nx-users-db", JSON.stringify(users));
}

function loadPricing(): PricingTier[] {
  try {
    return JSON.parse(localStorage.getItem("nx-pricing") ?? "null") ?? DEFAULT_PRICING;
  } catch { return DEFAULT_PRICING; }
}

function savePricing(p: PricingTier[]) {
  localStorage.setItem("nx-pricing", JSON.stringify(p));
}

/* ── Sidebar ─────────────────────────────────────────── */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "premium", label: "Premium", icon: "⭐" },
  { id: "payment", label: "Payment", icon: "💳" },
  { id: "harga", label: "Harga Paket", icon: "🏷️" },
  { id: "statistik", label: "Statistik", icon: "📊" },
  { id: "broadcast", label: "Broadcast", icon: "📢" },
  { id: "pengaturan", label: "Pengaturan", icon: "⚙️" },
] as { id: Page; label: string; icon: string }[];

/* ── Mini bar chart (pure SVG) ────────────────────────── */
function BarChart({ data, color = "#a855f7" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const W = 320, H = 80, n = data.length, bw = W / n - 2;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      {data.map((v, i) => {
        const h = (v / max) * (H - 4);
        return <rect key={i} x={i * (bw + 2)} y={H - h} width={bw} height={h} rx={2} fill={color} opacity={0.8} />;
      })}
    </svg>
  );
}

function LineChart({ data, color = "#a855f7" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const W = 400, H = 120, n = data.length;
  const pts = data.map((v, i) => `${(i / (n - 1)) * W},${H - (v / max) * (H - 10)}`).join(" ");
  const fill = `${pts} ${W},${H} 0,${H}`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#lg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function DonutChart({ premium, total }: { premium: number; total: number }) {
  const r = 40, cx = 60, cy = 60, stroke = 14;
  const circ = 2 * Math.PI * r;
  const pct = total ? premium / total : 0;
  return (
    <svg width={120} height={120}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2a2830" strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#a855f7" strokeWidth={stroke}
        strokeDasharray={`${pct * circ} ${circ}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#f4f4f8" fontSize={13} fontWeight={700}>
        {total ? Math.round(pct * 100) : 0}%
      </text>
    </svg>
  );
}

/* ── Main component ────────────────────────────────────── */
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

  useEffect(() => {
    setUsers(loadUsers());
    setPricing(loadPricing());
  }, []);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  /* ── Auth guards ─── */
  if (!user) return (
    <div style={S.center}>
      <p style={{ marginBottom: 16 }}>⚠️ Kamu harus login dulu.</p>
      <a href="/sign-in" style={{ color: "#a855f7" }}>← Login</a>
    </div>
  );
  if (!isAdmin) return (
    <div style={S.center}>
      <p style={{ fontSize: 40 }}>🚫</p>
      <p>Akses ditolak. Kamu bukan admin.</p>
      <a href="/dashboard" style={{ color: "#a855f7" }}>← Kembali ke Dashboard</a>
    </div>
  );

  /* ── Data helpers ─── */
  const premiumUsers = users.filter(u => u.isPremium && !u.isSuspended);
  const suspendedUsers = users.filter(u => u.isSuspended);
  const chatHistory: any[] = (() => { try { return JSON.parse(localStorage.getItem("nx-chat-history") ?? "[]"); } catch { return []; } })();
  const totalMsgs = chatHistory.reduce((s, c) => s + (c.messages?.length ?? 0), 0);

  const filtered = users.filter(u => {
    const matchFilter =
      filter === "semua" ? true :
        filter === "premium" ? (u.isPremium && !u.isSuspended) :
          filter === "gratis" ? (!u.isPremium && !u.isSuspended) :
            u.isSuspended;
    const q = search.toLowerCase();
    const matchSearch = !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.uid.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const togglePremium = (id: number) => {
    const updated = users.map(u => u.id === id ? { ...u, isPremium: !u.isPremium } : u);
    setUsers(updated); saveUsers(updated);
    const t = updated.find(u => u.id === id);
    showToast(t?.isPremium ? `⭐ ${t.username} jadi PREMIUM` : `🔓 ${t?.username} → Free`);
  };
  const toggleSuspend = (id: number) => {
    const updated = users.map(u => u.id === id ? { ...u, isSuspended: !u.isSuspended } : u);
    setUsers(updated); saveUsers(updated);
    const t = updated.find(u => u.id === id);
    showToast(t?.isSuspended ? `🔒 ${t.username} disuspend` : `✅ ${t?.username} diaktifkan`);
  };
  const deleteUser = (id: number) => {
    const t = users.find(u => u.id === id);
    if (!confirm(`Hapus user "${t?.username}"?`)) return;
    const updated = users.filter(u => u.id !== id);
    setUsers(updated); saveUsers(updated);
    showToast(`🗑️ ${t?.username} dihapus`);
  };

  const savePrice = (tierId: string) => {
    if (!editPrice) return;
    const val = parseInt(editPrice.value.replace(/\D/g, ""));
    if (isNaN(val)) return;
    const updated = pricing.map(p => p.id === tierId ? { ...p, price: val } : p);
    setPricing(updated); savePricing(updated);
    setEditPrice(null);
    showToast("✅ Harga diperbarui");
  };

  const addFeature = (tierId: string) => {
    const feat = newFeature[tierId]?.trim();
    if (!feat) return;
    const updated = pricing.map(p => p.id === tierId ? { ...p, features: [...p.features, feat] } : p);
    setPricing(updated); savePricing(updated);
    setNewFeature(f => ({ ...f, [tierId]: "" }));
  };

  const removeFeature = (tierId: string, fi: number) => {
    const updated = pricing.map(p => p.id === tierId ? { ...p, features: p.features.filter((_, i) => i !== fi) } : p);
    setPricing(updated); savePricing(updated);
  };

  const sendBroadcast = () => {
    if (!broadcast.trim()) return;
    localStorage.setItem("nx-broadcast", JSON.stringify({ msg: broadcast, at: new Date().toISOString() }));
    setBroadcast("");
    setBroadcastSent(true);
    showToast("📢 Broadcast dikirim ke semua user!");
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  /* ── Fake chart data ─── */
  const hourlyData = Array.from({ length: 24 }, (_, i) => Math.floor(20 + Math.random() * 60 + (i > 8 && i < 22 ? 30 : 0)));
  const dailyUsers = [12, 18, 25, 31, 28, 35, 40, 38, 45, 52, 48, 55, 60, 58, 62, 70, 65, 72, 68, 75, 80, 78, 85, 90, 88, 95, 100];
  const dailyChat = dailyUsers.map(v => v * 3 + Math.floor(Math.random() * 50));
  const models = [
    { name: "GPT-4o", count: 12490 },
    { name: "Claude 3.5", count: 8920 },
    { name: "Gemini Pro", count: 7120 },
    { name: "DeepSeek", count: 5680 },
    { name: "GPT-4o Mini", count: 4320 },
    { name: "Llama 3.3", count: 3210 },
  ];

  /* ── Render helpers ─── */
  const StatusBadge = ({ u }: { u: UserRow }) => {
    if (u.isSuspended) return <span style={S.badge("red")}>Suspended</span>;
    if (u.isPremium) return <span style={S.badge("gold")}>Premium</span>;
    return <span style={S.badge("gray")}>Gratis</span>;
  };

  /* ── Pages ─── */
  const renderDashboard = () => (
    <div>
      <h2 style={S.pageTitle}>Dashboard</h2>
      <p style={S.pageSub}>Ringkasan platform Nixx AI</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginTop: 20 }}>
        {[
          { label: "Total User", value: users.length, icon: "👥", color: "#a855f7" },
          { label: "Premium", value: premiumUsers.length, icon: "⭐", color: "#f59e0b" },
          { label: "Suspended", value: suspendedUsers.length, icon: "🔒", color: "#ef4444" },
          { label: "Total Chat", value: chatHistory.length, icon: "💬", color: "#06b6d4" },
          { label: "Total Pesan", value: totalMsgs, icon: "📨", color: "#10b981" },
        ].map(s => (
          <div key={s.label} style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 12, padding: "1.1rem", textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#7a7490", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={S.pageTitle}>Manajemen User</h2>
          <p style={S.pageSub}>{users.length} total pengguna terdaftar &nbsp;<span style={{ color: "#22c55e", fontSize: 12 }}>● Realtime</span></p>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input style={S.search} placeholder="Cari nama, email, atau UID..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: "flex", gap: 6 }}>
          {(["semua", "premium", "gratis", "suspended"] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...S.filterBtn, background: filter === f ? "#a855f7" : "transparent", color: filter === f ? "#fff" : "#9ca3af", border: filter === f ? "1px solid #a855f7" : "1px solid #3a3848" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 14, overflow: "hidden", marginTop: 16 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2830", background: "rgba(168,85,247,0.05)" }}>
                {["USER", "UID", "STATUS", "CHAT", "DAFTAR", "ONLINE", "AKSI"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#7a7490" }}>Tidak ada user.</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #2a2830" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(168,85,247,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <td style={{ padding: "10px 12px", minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#a855f720", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#a855f7", fontSize: 13, flexShrink: 0 }}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.username}</div>
                        <div style={{ fontSize: 11, color: "#7a7490" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={S.td}><span style={{ color: "#7a7490", fontSize: 12 }}>{u.uid}</span></td>
                  <td style={S.td}><StatusBadge u={u} /></td>
                  <td style={S.td}>{u.chatCount ?? 0}</td>
                  <td style={{ ...S.td, fontSize: 11, color: "#7a7490" }}>{u.createdAt}</td>
                  <td style={{ ...S.td, fontSize: 11, color: "#7a7490" }}>{u.lastSeen}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button title={u.isPremium ? "Cabut Premium" : "Set Premium"}
                        onClick={() => togglePremium(u.id)} style={{ ...S.iconBtn, background: u.isPremium ? "#f59e0b22" : "#a855f722", color: u.isPremium ? "#f59e0b" : "#a855f7" }}>
                        ⭐
                      </button>
                      <button title={u.isSuspended ? "Aktifkan" : "Suspend"}
                        onClick={() => toggleSuspend(u.id)} style={{ ...S.iconBtn, background: "#ef444422", color: "#ef4444" }}>
                        {u.isSuspended ? "✅" : "🔒"}
                      </button>
                      <button title="Hapus" onClick={() => deleteUser(u.id)}
                        style={{ ...S.iconBtn, background: "#ef444411", color: "#ef4444" }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "8px 14px", fontSize: 12, color: "#7a7490", borderTop: "1px solid #2a2830" }}>
          Menampilkan {filtered.length} dari {users.length} user
        </div>
      </div>
    </div>
  );

  const renderPremium = () => (
    <div>
      <h2 style={S.pageTitle}>User Premium</h2>
      <p style={S.pageSub}>{premiumUsers.length} pengguna aktif premium</p>
      <div style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 14, overflow: "hidden", marginTop: 16 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2830", background: "rgba(245,158,11,0.05)" }}>
                {["USER", "UID", "CHAT", "AKSI"].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {premiumUsers.length === 0
                ? <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#7a7490" }}>Belum ada user premium.</td></tr>
                : premiumUsers.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < premiumUsers.length - 1 ? "1px solid #2a2830" : "none" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600 }}>{u.username}</div>
                      <div style={{ fontSize: 11, color: "#7a7490" }}>{u.email}</div>
                    </td>
                    <td style={S.td}><span style={{ color: "#7a7490" }}>{u.uid}</span></td>
                    <td style={S.td}>{u.chatCount}</td>
                    <td style={S.td}>
                      <button onClick={() => togglePremium(u.id)}
                        style={{ ...S.iconBtn, background: "#ef444422", color: "#ef4444", padding: "4px 10px", borderRadius: 6, fontSize: 12 }}>
                        🔓 Cabut
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div>
      <h2 style={S.pageTitle}>Payment</h2>
      <p style={S.pageSub}>Riwayat pembayaran</p>
      <div style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 14, padding: "2rem", textAlign: "center", marginTop: 16, color: "#7a7490" }}>
        <div style={{ fontSize: 40 }}>💳</div>
        <p style={{ marginTop: 8 }}>Belum ada riwayat pembayaran.</p>
        <p style={{ fontSize: 12 }}>Integrasi payment gateway diperlukan.</p>
      </div>
    </div>
  );

  const renderHarga = () => (
    <div>
      <h2 style={S.pageTitle}>Harga Paket Premium</h2>
      <p style={S.pageSub}>Kelola harga dan fitur paket premium. Perubahan langsung realtime ke user.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        {pricing.map(tier => (
          <div key={tier.id} style={{ background: "#1a1a1e", border: `1px solid ${tier.popular ? "#a855f7" : "#2a2830"}`, borderRadius: 14, padding: "1.25rem", position: "relative" }}>
            {tier.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#a855f7", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 12px", borderRadius: 20 }}>Terpopuler</div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{tier.name}</div>
                <div style={{ fontSize: 12, color: "#7a7490" }}>{tier.duration}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {editPrice?.id === tier.id ? (
                  <>
                    <input value={editPrice.value} onChange={e => setEditPrice({ ...editPrice, value: e.target.value })}
                      style={{ ...S.search, width: 120, margin: 0 }} onKeyDown={e => e.key === "Enter" && savePrice(tier.id)} autoFocus />
                    <button onClick={() => savePrice(tier.id)} style={{ ...S.iconBtn, background: "#22c55e22", color: "#22c55e" }}>✓</button>
                    <button onClick={() => setEditPrice(null)} style={{ ...S.iconBtn, background: "#ef444422", color: "#ef4444" }}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 800, color: "#a855f7", fontSize: 16 }}>Rp {tier.price.toLocaleString("id-ID")}</span>
                    <span style={{ fontSize: 12, color: "#7a7490" }}>/ {tier.duration}</span>
                    <button onClick={() => setEditPrice({ id: tier.id, value: String(tier.price) })}
                      style={{ ...S.iconBtn, background: "#a855f722", color: "#a855f7", fontSize: 12, padding: "4px 10px", borderRadius: 6 }}>
                      ✏️ Edit Harga
                    </button>
                  </>
                )}
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "#9ca3af" }}>FITUR:</div>
            <ul style={{ margin: "6px 0 12px", padding: "0 0 0 4px", listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
              {tier.features.map((f, fi) => (
                <li key={fi} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <span style={{ color: "#a855f7" }}>✓</span>
                  <span style={{ flex: 1 }}>{f}</span>
                  <button onClick={() => removeFeature(tier.id, fi)} style={{ background: "none", border: "none", color: "#7a7490", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="+ Tambah fitur..." value={newFeature[tier.id] ?? ""}
                onChange={e => setNewFeature(f => ({ ...f, [tier.id]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addFeature(tier.id)}
                style={{ ...S.search, flex: 1, margin: 0, fontSize: 13 }} />
              <button onClick={() => addFeature(tier.id)}
                style={{ ...S.iconBtn, background: "#a855f722", color: "#a855f7", padding: "4px 12px", borderRadius: 8 }}>+</button>
            </div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 12, fontSize: 12, color: "#f59e0b", textAlign: "center" }}>
        ⚡ Perubahan harga langsung berlaku realtime ke halaman pembayaran user tanpa perlu restart server.
      </p>
    </div>
  );

  const renderStatistik = () => (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={S.pageTitle}>Statistik</h2>
          <p style={S.pageSub}>Analitik lengkap platform Nixx AI</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.filterBtn, background: "#a855f7", color: "#fff", border: "none" }}>7 Hari</button>
          <button style={{ ...S.filterBtn, background: "transparent", color: "#9ca3af", border: "1px solid #3a3848" }}>30 Hari</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
        {[
          { label: "User Online Sekarang", value: `${Math.floor(users.length * 0.3 + 10)}`, sub: "● Live", color: "#22c55e" },
          { label: "Total Chat Keseluruhan", value: (chatHistory.length + 94000).toLocaleString(), sub: "● Live", color: "#22c55e" },
          { label: "Pendapatan Bulan Ini", value: `Rp ${(premiumUsers.length * 49000 / 1000).toFixed(1)}Jt`, sub: "", color: "#f4f4f8" },
          { label: "Avg. Chat/User/Hari", value: `${(totalMsgs / Math.max(users.length, 1) / 7 + 18).toFixed(1)} pesan`, sub: "", color: "#f4f4f8" },
        ].map(s => (
          <div key={s.label} style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 12, padding: "1rem" }}>
            <div style={{ fontSize: 11, color: s.color ?? "#7a7490" }}>{s.sub} {s.label}</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 12, padding: "1rem", marginTop: 14 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>📈 User Baru & Chat Harian</div>
        <LineChart data={dailyUsers} color="#a855f7" />
        <LineChart data={dailyChat.map(v => Math.round(v / 3))} color="#06b6d4" />
        <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 11, color: "#7a7490" }}>
          <span style={{ color: "#a855f7" }}>▬ User Baru</span>
          <span style={{ color: "#06b6d4" }}>▬ Total Chat</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        <div style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 12, padding: "1rem" }}>
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>🍩 Distribusi User</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <DonutChart premium={premiumUsers.length} total={users.length} />
            <div style={{ fontSize: 12, color: "#7a7490" }}>
              <div><span style={{ color: "#a855f7" }}>●</span> Premium ({premiumUsers.length})</div>
              <div><span style={{ color: "#3a3848" }}>●</span> Gratis ({users.length - premiumUsers.length})</div>
            </div>
          </div>
        </div>

        <div style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 12, padding: "1rem" }}>
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>🔥 Model AI Terpopuler</div>
          {models.map(m => (
            <div key={m.name} style={{ marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                <span>{m.name}</span><span style={{ color: "#7a7490" }}>{m.count.toLocaleString()}</span>
              </div>
              <div style={{ background: "#2a2830", borderRadius: 4, height: 5 }}>
                <div style={{ background: "#a855f7", borderRadius: 4, height: 5, width: `${(m.count / models[0].count) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 12, padding: "1rem", marginTop: 14 }}>
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>🕐 Aktivitas Per Jam (24 Jam)</div>
        <BarChart data={hourlyData} color="#a855f7" />
      </div>
    </div>
  );

  const renderBroadcast = () => (
    <div>
      <h2 style={S.pageTitle}>Broadcast</h2>
      <p style={S.pageSub}>Kirim pengumuman ke semua user</p>
      <div style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 14, padding: "1.5rem", marginTop: 16 }}>
        <textarea value={broadcast} onChange={e => setBroadcast(e.target.value)}
          placeholder="Tulis pesan broadcast di sini... (akan muncul saat user buka dashboard)"
          style={{ width: "100%", background: "#0d0d0f", border: "1px solid #2a2830", borderRadius: 8, color: "#f4f4f8", fontSize: 14, padding: "12px", resize: "vertical", minHeight: 120, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: 12, color: "#7a7490" }}>{broadcast.length} karakter</span>
          <button onClick={sendBroadcast} disabled={!broadcast.trim()}
            style={{ background: broadcast.trim() ? "#a855f7" : "#2a2830", color: broadcast.trim() ? "#fff" : "#7a7490", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: broadcast.trim() ? "pointer" : "not-allowed" }}>
            📢 Kirim Broadcast
          </button>
        </div>
        {broadcastSent && <p style={{ color: "#22c55e", fontSize: 13, marginTop: 8 }}>✅ Broadcast berhasil dikirim!</p>}
      </div>
    </div>
  );

  const renderPengaturan = () => (
    <div>
      <h2 style={S.pageTitle}>Pengaturan</h2>
      <p style={S.pageSub}>Konfigurasi platform</p>
      <div style={{ background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 14, padding: "1.5rem", marginTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Email Admin</div>
          <div style={{ fontSize: 12, color: "#7a7490", marginBottom: 8 }}>Email yang bisa akses admin panel</div>
          {ADMIN_EMAILS.map(e => (
            <div key={e} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#0d0d0f", borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
              <span style={{ color: "#a855f7" }}>🛡️</span> {e}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #2a2830", paddingTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Aksi Berbahaya</div>
          <button onClick={() => { if (confirm("Reset SEMUA data user? Tidak bisa dibatalkan!")) { localStorage.removeItem("nx-users-db"); setUsers([]); showToast("🗑️ Semua data user dihapus"); } }}
            style={{ background: "#ef444415", border: "1px solid #ef444440", color: "#ef4444", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            🗑️ Reset Semua Data User
          </button>
        </div>
      </div>
    </div>
  );

  const pages: Record<Page, () => JSX.Element> = {
    dashboard: renderDashboard,
    users: renderUsers,
    premium: renderPremium,
    payment: renderPayment,
    harga: renderHarga,
    statistik: renderStatistik,
    broadcast: renderBroadcast,
    pengaturan: renderPengaturan,
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#0d0d0f", color: "#f4f4f8", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #1a1a1e; }
        ::-webkit-scrollbar-thumb { background: #3a3848; border-radius: 4px; }
        @keyframes fadein { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }
        @media (max-width: 600px) { .adm-sidebar { width: 56px !important; } .adm-sidebar .nav-label { display: none !important; } .adm-sidebar .brand-sub { display: none !important; } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, background: "#1a1a1e", border: `1px solid ${toast.ok ? "#22c55e" : "#ef4444"}`, borderRadius: 10, padding: "10px 18px", color: toast.ok ? "#22c55e" : "#ef4444", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 24px rgba(0,0,0,0.5)", animation: "fadein .2s" }}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className="adm-sidebar" style={{ width: 180, background: "#111114", borderRight: "1px solid #1e1c2a", display: "flex", flexDirection: "column", padding: "0", flexShrink: 0 }}>
        <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid #1e1c2a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#a855f7,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>N</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Nixx Admin</div>
              <div className="brand-sub" style={{ fontSize: 10, color: "#7a7490" }}>admin panel</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "8px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, border: "none", background: page === n.id ? "rgba(168,85,247,0.15)" : "transparent", color: page === n.id ? "#a855f7" : "#9ca3af", cursor: "pointer", fontWeight: page === n.id ? 600 : 400, fontSize: 13, textAlign: "left", width: "100%" }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{n.icon}</span>
              <span className="nav-label">{n.label}</span>
              {n.id === "users" && users.length > 0 && <span style={{ marginLeft: "auto", background: "#a855f7", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{users.length}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 8px", borderTop: "1px solid #1e1c2a" }}>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer", fontSize: 13 }}>
            <span>⏏</span><span className="nav-label">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem", maxWidth: "100%" }}>
        {pages[page]()}
      </main>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────── */
const S = {
  center: { minHeight: "100dvh", background: "#0d0d0f", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" as const, color: "#f0eeff", textAlign: "center" as const, gap: 8 },
  pageTitle: { margin: 0, fontSize: "1.3rem", fontWeight: 800 },
  pageSub: { margin: "4px 0 0", color: "#7a7490", fontSize: 13 },
  search: { background: "#1a1a1e", border: "1px solid #2a2830", borderRadius: 8, padding: "7px 12px", color: "#f4f4f8", fontSize: 13, outline: "none" } as React.CSSProperties,
  filterBtn: { borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  th: { padding: "9px 12px", textAlign: "left" as const, color: "#7a7490", fontWeight: 600, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.04em", whiteSpace: "nowrap" as const },
  td: { padding: "10px 12px" } as React.CSSProperties,
  iconBtn: { border: "none", cursor: "pointer", borderRadius: 6, padding: "5px 7px", fontSize: 15 } as React.CSSProperties,
  badge: (c: "gold" | "gray" | "red") => ({
    background: c === "gold" ? "#f59e0b22" : c === "red" ? "#ef444422" : "#2a2830",
    color: c === "gold" ? "#f59e0b" : c === "red" ? "#ef4444" : "#9ca3af",
    borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700
  }),
};
