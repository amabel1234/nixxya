import React, { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";

type Section = "dashboard" | "payments" | "users" | "settings";
interface Stats { totalUsers: number; premiumUsers: number; pendingPayments: number; todayMessages: number }
interface Payment { id: number; userId: string; planId: string; amountRp: number; status: string; danaNumber: string | null; note: string | null; confirmedAt: string | null; createdAt: string; userEmail: string | null; userName: string | null }
interface AdminUser { id: string; email: string; name: string | null; isPremium: boolean; premiumUntil: string | null; createdAt: string }
interface AppSettings { qris_link: string; dana_number: string; dana_name: string; price_monthly: string; price_quarterly: string; price_yearly: string; daily_limit_free: string; premium_model_ids: string }

const MENU: { id: Section; icon: string; label: string }[] = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "payments", icon: "💳", label: "Pembayaran" },
  { id: "users", icon: "👑", label: "Premium Users" },
  { id: "settings", icon: "⚙️", label: "Pengaturan" },
];

const planLabel: Record<string, string> = { monthly: "Bulanan", quarterly: "3 Bulan", yearly: "Tahunan" };

function formatRp(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }
function formatDate(s: string | null) {
  if (!s) return "-";
  return new Date(s).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1.5px solid var(--border-color, #e8e4ff)",
  background: "var(--card-bg, white)", color: "var(--text-primary, #1a1a2e)",
  fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
};
const thStyle: React.CSSProperties = {
  padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: "0.75rem",
  textTransform: "uppercase", letterSpacing: "0.05em",
  color: "var(--text-muted, #888)", borderBottom: "2px solid var(--border-color, #eee)",
  background: "var(--card-bg, white)",
};
const tdStyle: React.CSSProperties = { padding: "10px 14px", borderBottom: "1px solid var(--border-color, #f0f0f0)", verticalAlign: "middle" };
const statusBadge = (s: string): React.CSSProperties => ({
  display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: "0.73rem", fontWeight: 700,
  background: s === "confirmed" ? "#d1fae5" : s === "rejected" ? "#fee2e2" : "#fef3c7",
  color: s === "confirmed" ? "#065f46" : s === "rejected" ? "#991b1b" : "#92400e",
});
const actionBtn = (color: "green" | "red" | "purple" | "gray"): React.CSSProperties => ({
  padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, marginRight: 4,
  background: color === "green" ? "#10b981" : color === "red" ? "#ef4444" : color === "purple" ? "linear-gradient(135deg,#7c3aed,#db2777)" : "#e5e7eb",
  color: color === "gray" ? "#374151" : "white",
});
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "var(--card-bg,white)", borderRadius: 16, border: "1.5px solid var(--border-color,#e8e4ff)", ...style }}>{children}</div>;
}
function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 900, color: "var(--text-primary)" }}>{title}</h1>
      {sub && <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const [section, setSection] = useState<Section>("dashboard");
  const [pendingCount, setPendingCount] = useState(0);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) { if (isLoaded) setLoading(false); return; }
    fetch("/api/admin/stats", { credentials: "include" })
      .then(r => {
        if (!r.ok) { setAccessError(r.status === 403 ? "Akses ditolak. Kamu bukan admin. Set ADMIN_USER_IDS di environment." : "Gagal terhubung ke server."); setLoading(false); return null; }
        return r.json();
      })
      .then(d => { if (d) { setPendingCount(d.pendingPayments); setLoading(false); } });
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--primary-bg)" }}>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div><div style={{ color: "var(--text-muted)" }}>Memuat Admin Panel...</div></div>
      </div>
    );
  }

  if (!isSignedIn || accessError) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--primary-bg)" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{!isSignedIn ? "🔐" : "🚫"}</div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 12 }}>{!isSignedIn ? "Login diperlukan" : accessError}</div>
          {!isSignedIn && <Link to="/sign-in" style={{ color: "var(--accent)", fontWeight: 600 }}>Login sekarang →</Link>}
          {isSignedIn && accessError && (
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 8 }}>
              Tambahkan user ID Clerk kamu di environment variable <code>ADMIN_USER_IDS</code>.<br />
              <Link to="/chat" style={{ color: "var(--accent)", marginTop: 8, display: "inline-block" }}>← Kembali ke Chat</Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--primary-bg)" }}>
      {/* Sidebar */}
      <div style={{
        width: 240, minHeight: "100vh", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
        background: "linear-gradient(180deg,#0d0d1f 0%,#1a0a2e 100%)",
        display: "flex", flexDirection: "column", boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 30 }}>🧠</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.05rem", color: "white" }}>Nixx AI</div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", marginTop: 1 }}>⚡ Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: "14px 10px" }}>
          {MENU.map(item => {
            const active = section === item.id;
            return (
              <button key={item.id} onClick={() => setSection(item.id)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "11px 14px", borderRadius: 12, border: "none", cursor: "pointer", marginBottom: 3,
                background: active ? "rgba(124,58,237,0.2)" : "transparent",
                color: active ? "#c4b5fd" : "rgba(255,255,255,0.55)",
                fontWeight: active ? 700 : 400, fontSize: "0.88rem", textAlign: "left",
                borderLeft: active ? "3px solid #a855f7" : "3px solid transparent",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 17 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.id === "payments" && pendingCount > 0 && (
                  <span style={{ background: "#ef4444", color: "white", borderRadius: 99, fontSize: "0.68rem", fontWeight: 800, padding: "1px 7px" }}>{pendingCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <Link to="/chat" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "color 0.15s" }}>
            ← Kembali ke Chat
          </Link>
        </div>
      </div>

      {/* Content area */}
      <div style={{ marginLeft: 240, flex: 1, padding: "32px 36px", minHeight: "100vh" }}>
        {section === "dashboard" && <DashboardSection onPendingUpdate={setPendingCount} />}
        {section === "payments" && <PaymentsSection onUpdate={setPendingCount} />}
        {section === "users" && <UsersSection />}
        {section === "settings" && <SettingsSection />}
      </div>
    </div>
  );
}

function DashboardSection({ onPendingUpdate }: { onPendingUpdate: (n: number) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats", { credentials: "include" }).then(r => r.json()),
      fetch("/api/admin/payments", { credentials: "include" }).then(r => r.json()),
    ]).then(([s, p]) => { setStats(s); setPayments((p as Payment[]).slice(0, 8)); onPendingUpdate(s.pendingPayments); });
  }, []);

  return (
    <div>
      <SectionTitle title="📊 Dashboard" sub="Ringkasan aktivitas Nixx AI" />
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { icon: "👥", label: "Total Pengguna", value: stats.totalUsers, color: "#7c3aed" },
            { icon: "👑", label: "Premium Users", value: stats.premiumUsers, color: "#f59e0b" },
            { icon: "💳", label: "Pending Pembayaran", value: stats.pendingPayments, color: "#ef4444" },
            { icon: "💬", label: "Pesan Hari Ini", value: stats.todayMessages, color: "#10b981" },
          ].map(c => (
            <Card key={c.label} style={{ padding: "22px 24px" }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: "1.9rem", fontWeight: 900, color: c.color }}>{c.value.toLocaleString()}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 4 }}>{c.label}</div>
            </Card>
          ))}
        </div>
      )}
      {payments.length > 0 && (
        <Card style={{ overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border-color,#eee)", fontWeight: 700, fontSize: "0.95rem" }}>Pembayaran Terbaru</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead><tr>{["User", "Plan", "Harga", "Status", "Tanggal"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={tdStyle}><div style={{ fontWeight: 600 }}>{p.userEmail ?? p.userId.slice(0, 12)}</div><div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.userName ?? ""}</div></td>
                    <td style={tdStyle}>{planLabel[p.planId] ?? p.planId}</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{formatRp(p.amountRp)}</td>
                    <td style={tdStyle}><span style={statusBadge(p.status)}>{p.status === "confirmed" ? "✅ Disetujui" : p.status === "rejected" ? "❌ Ditolak" : "⏳ Pending"}</span></td>
                    <td style={{ ...tdStyle, color: "var(--text-muted)", fontSize: "0.8rem" }}>{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function PaymentsSection({ onUpdate }: { onUpdate: (n: number) => void }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/payments", { credentials: "include" }).then(r => r.json()).then(d => {
      setPayments(d as Payment[]);
      setLoading(false);
      onUpdate((d as Payment[]).filter((p: Payment) => p.status === "pending").length);
    });
  }, [onUpdate]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: number, action: "approve" | "reject") => {
    if (!confirm(action === "approve" ? "Approve pembayaran ini? User akan diaktifkan premium." : "Tolak pembayaran ini?")) return;
    setBusy(id);
    await fetch(`/api/admin/payments/${id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    setBusy(null); load();
  };

  const filtered = filter === "all" ? payments : payments.filter(p => p.status === filter);

  return (
    <div>
      <SectionTitle title="💳 Pembayaran" sub="Kelola semua permintaan upgrade premium" />
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[["all", "Semua"], ["pending", "Pending"], ["confirmed", "Disetujui"], ["rejected", "Ditolak"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "6px 18px", borderRadius: 99, border: "1.5px solid var(--border-color,#e8e4ff)", cursor: "pointer",
            fontWeight: filter === v ? 700 : 400, fontSize: "0.82rem",
            background: filter === v ? "linear-gradient(135deg,#7c3aed,#db2777)" : "var(--card-bg,white)",
            color: filter === v ? "white" : "var(--text-primary)",
          }}>
            {l}{v === "pending" && payments.filter(p => p.status === "pending").length > 0 ? ` (${payments.filter(p => p.status === "pending").length})` : ""}
          </button>
        ))}
      </div>
      <Card style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>⏳ Memuat...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Tidak ada pembayaran {filter === "all" ? "" : `berstatus "${filter}"`}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
              <thead><tr>{["#", "User", "Plan", "Harga", "Dana Number", "Catatan", "Status", "Tanggal", "Aksi"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ background: p.status === "pending" ? "rgba(124,58,237,0.035)" : undefined }}>
                    <td style={{ ...tdStyle, color: "var(--text-muted)", fontSize: "0.8rem" }}>{p.id}</td>
                    <td style={tdStyle}><div style={{ fontWeight: 600 }}>{p.userEmail ?? "-"}</div><div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{p.userName ?? ""}</div></td>
                    <td style={tdStyle}><span style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed", borderRadius: 6, padding: "2px 8px", fontSize: "0.78rem", fontWeight: 700 }}>{planLabel[p.planId] ?? p.planId}</span></td>
                    <td style={{ ...tdStyle, fontWeight: 800, color: "#059669" }}>{formatRp(p.amountRp)}</td>
                    <td style={tdStyle}><code style={{ fontSize: "0.78rem", background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: 4 }}>{p.danaNumber ?? "-"}</code></td>
                    <td style={{ ...tdStyle, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: "0.8rem" }} title={p.note ?? ""}>{p.note ?? "-"}</td>
                    <td style={tdStyle}><span style={statusBadge(p.status)}>{p.status === "confirmed" ? "✅ OK" : p.status === "rejected" ? "❌ Ditolak" : "⏳ Pending"}</span></td>
                    <td style={{ ...tdStyle, color: "var(--text-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{formatDate(p.createdAt)}</td>
                    <td style={tdStyle}>
                      {p.status === "pending" ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button style={actionBtn("green")} onClick={() => act(p.id, "approve")} disabled={busy === p.id}>✓ Approve</button>
                          <button style={actionBtn("red")} onClick={() => act(p.id, "reject")} disabled={busy === p.id}>✗ Tolak</button>
                        </div>
                      ) : <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function UsersSection() {
  const [userList, setUserList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [daysMap, setDaysMap] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/users", { credentials: "include" }).then(r => r.json()).then(d => { setUserList(d as AdminUser[]); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (userId: string, isPremium: boolean) => {
    const days = isPremium ? (parseInt(daysMap[userId] ?? "30", 10) || 30) : 0;
    setBusy(userId);
    await fetch(`/api/admin/users/${userId}/premium`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPremium, days }) });
    setBusy(null); load();
  };

  const filtered = userList.filter(u => !search || u.email.toLowerCase().includes(search.toLowerCase()) || (u.name ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionTitle title="👑 Premium Users" sub="Kelola status premium pengguna secara manual" />
      <div style={{ marginBottom: 16 }}>
        <input style={{ ...inputStyle, maxWidth: 340 }} placeholder="🔍  Cari email atau nama..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Card style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>⏳ Memuat...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Tidak ada user ditemukan</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
              <thead><tr>{["Email", "Nama", "Status", "Premium Hingga", "Durasi (hari)", "Aksi"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td style={tdStyle}><div style={{ fontWeight: 600 }}>{u.email}</div><div style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>{u.id.slice(0, 20)}...</div></td>
                    <td style={tdStyle}>{u.name ?? <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                    <td style={tdStyle}><span style={statusBadge(u.isPremium ? "confirmed" : "rejected")}>{u.isPremium ? "👑 Premium" : "Free"}</span></td>
                    <td style={{ ...tdStyle, fontSize: "0.78rem", color: "var(--text-muted)" }}>{formatDate(u.premiumUntil)}</td>
                    <td style={{ ...tdStyle, width: 130 }}>
                      {!u.isPremium && (
                        <input type="number" min="1" max="9999" style={{ ...inputStyle, width: 90, padding: "5px 8px", fontSize: "0.85rem" }}
                          placeholder="30" value={daysMap[u.id] ?? "30"}
                          onChange={e => setDaysMap(m => ({ ...m, [u.id]: e.target.value }))} />
                      )}
                    </td>
                    <td style={tdStyle}>
                      {u.isPremium
                        ? <button style={actionBtn("red")} onClick={() => toggle(u.id, false)} disabled={busy === u.id}>Cabut Premium</button>
                        : <button style={actionBtn("purple")} onClick={() => toggle(u.id, true)} disabled={busy === u.id}>👑 Set Premium</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function SettingsSection() {
  const DEF: AppSettings = { qris_link: "", dana_number: "", dana_name: "Nixx AI", price_monthly: "15000", price_quarterly: "40000", price_yearly: "120000", daily_limit_free: "20", premium_model_ids: "" };
  const [form, setForm] = useState<AppSettings>(DEF);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetch("/api/admin/settings", { credentials: "include" }).then(r => r.json()).then(d => { setForm({ ...DEF, ...d }); setLoading(false); }); }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const set = (k: keyof AppSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>⏳ Memuat...</div>;

  return (
    <div>
      <SectionTitle title="⚙️ Pengaturan" sub="Konfigurasi sistem pembayaran, harga, dan fitur premium" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(380px,1fr))", gap: 24, marginBottom: 24 }}>
        {/* Payment */}
        <Card style={{ padding: 28 }}>
          <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
            <span>💳</span> Pengaturan Pembayaran QRIS / Dana
          </div>
          {([
            ["Link QRIS (URL gambar)", "qris_link", "text", "URL gambar QRIS Dana yang ditampilkan ke user"],
            ["Nomor Dana", "dana_number", "text", "Nomor HP Dana (contoh: 0812-xxxx-xxxx)"],
            ["Nama Rekening Dana", "dana_name", "text", "Nama penerima yang tampil saat konfirmasi"],
          ] as [string, keyof AppSettings, string, string][]).map(([label, key, type, hint]) => (
            <div key={key} style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>{label}</label>
              <input type={type} style={inputStyle} value={form[key]} onChange={set(key)} placeholder={hint} />
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 3 }}>{hint}</div>
            </div>
          ))}
          {form.qris_link && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>Preview QRIS:</div>
              <img src={form.qris_link} alt="QRIS" style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 10, border: "1px solid var(--border-color,#eee)" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
        </Card>

        {/* Premium */}
        <Card style={{ padding: 28 }}>
          <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
            <span>👑</span> Pengaturan Harga & Fitur Premium
          </div>
          {([
            ["Harga Bulanan (Rp)", "price_monthly", "number", "Harga paket 1 bulan (contoh: 15000)"],
            ["Harga 3 Bulan (Rp)", "price_quarterly", "number", "Harga paket 3 bulan (contoh: 40000)"],
            ["Harga Tahunan (Rp)", "price_yearly", "number", "Harga paket 1 tahun (contoh: 120000)"],
            ["Limit Chat Gratis / hari", "daily_limit_free", "number", "Jumlah pesan gratis per hari (contoh: 20)"],
          ] as [string, keyof AppSettings, string, string][]).map(([label, key, type, hint]) => (
            <div key={key} style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>{label}</label>
              <input type={type} style={inputStyle} value={form[key]} onChange={set(key)} />
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 3 }}>{hint}</div>
            </div>
          ))}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: 6 }}>Model Premium (ID, pisah koma)</label>
            <textarea style={{ ...inputStyle, height: 80, resize: "vertical" }} value={form.premium_model_ids} onChange={set("premium_model_ids")} placeholder="gpt4o,perplexity,gemini25v1,grok4fast,..." />
            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 3 }}>ID model yang hanya bisa digunakan pengguna premium</div>
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={save} disabled={saving} style={{
          padding: "12px 32px", borderRadius: 12, border: "none", cursor: saving ? "not-allowed" : "pointer",
          background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontWeight: 800, fontSize: "0.95rem", opacity: saving ? 0.7 : 1,
        }}>{saving ? "⏳ Menyimpan..." : "💾 Simpan Pengaturan"}</button>
        {saved && <span style={{ color: "#10b981", fontWeight: 700 }}>✅ Pengaturan berhasil disimpan!</span>}
      </div>
    </div>
  );
}
