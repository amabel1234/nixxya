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

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    confirmed: { bg: "#d1fae5", color: "#065f46", label: "✅ OK" },
    rejected:  { bg: "#fee2e2", color: "#991b1b", label: "❌ Ditolak" },
    pending:   { bg: "#fef3c7", color: "#92400e", label: "⏳ Pending" },
  };
  const c = cfg[status] ?? cfg.pending;
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: "0.73rem", fontWeight: 700, background: c.bg, color: c.color }}>{c.label}</span>;
}

function ActionBtn({ color, onClick, disabled, children }: { color: "green"|"red"|"purple"|"gray"; onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  const bg: Record<string, string> = { green: "#10b981", red: "#ef4444", purple: "linear-gradient(135deg,#7c3aed,#db2777)", gray: "#e5e7eb" };
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: 700, marginRight: 4, background: bg[color], color: color === "gray" ? "#374151" : "white", opacity: disabled ? 0.6 : 1, whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

export default function AdminPage() {
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) { if (isLoaded) setLoading(false); return; }
    fetch("/api/admin/stats", { credentials: "include" })
      .then(r => { if (!r.ok) { setAccessError(r.status === 403 ? "Akses ditolak. Kamu bukan admin." : "Gagal terhubung ke server."); setLoading(false); return null; } return r.json(); })
      .then(d => { if (d) { setPendingCount(d.pendingPayments); setLoading(false); } });
  }, [isLoaded, isSignedIn]);

  const handleNav = (id: Section) => { setSection(id); setSidebarOpen(false); };

  if (!isLoaded || loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--primary-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🧠</div>
          <div style={{ fontWeight: 700, color: "var(--text-muted)" }}>Memuat Admin Panel...</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn || accessError) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--primary-bg)", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>{!isSignedIn ? "🔐" : "🚫"}</div>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 10 }}>{!isSignedIn ? "Login diperlukan" : accessError}</div>
          {!isSignedIn && <Link to="/sign-in" style={{ color: "var(--accent)", fontWeight: 600 }}>Login sekarang →</Link>}
          {isSignedIn && <Link to="/chat" style={{ color: "var(--accent)", fontWeight: 600 }}>← Kembali ke Chat</Link>}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .adm-wrap { display: flex; min-height: 100vh; background: var(--primary-bg); }
        .adm-sidebar {
          width: 230px; min-height: 100vh; position: fixed; top: 0; left: 0; bottom: 0; z-index: 200;
          background: linear-gradient(180deg,#0d0d1f 0%,#1a0a2e 100%);
          display: flex; flex-direction: column; box-shadow: 4px 0 24px rgba(0,0,0,0.3);
          transition: transform 0.25s ease;
        }
        .adm-overlay { display: none; position: fixed; inset: 0; z-index: 190; background: rgba(0,0,0,0.55); }
        .adm-content { margin-left: 230px; flex: 1; padding: 28px 24px; min-height: 100vh; }
        .adm-topbar { display: none; }
        .adm-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
        .adm-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .adm-card { background: var(--card-bg, white); border-radius: 14px; border: 1.5px solid var(--border-color, #e8e4ff); }
        .adm-section-title { font-size: 1.3rem; font-weight: 900; color: var(--text-primary); margin: 0 0 4px; }
        .adm-section-sub { color: var(--text-muted); font-size: 0.83rem; margin: 0 0 20px; }
        .adm-input { width: 100%; padding: 10px 13px; border-radius: 10px; border: 1.5px solid var(--border-color, #e8e4ff); background: var(--card-bg, white); color: var(--text-primary); font-size: 0.88rem; outline: none; box-sizing: border-box; }
        th.adm-th { padding: 9px 12px; text-align: left; font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); border-bottom: 2px solid var(--border-color, #eee); white-space: nowrap; }
        td.adm-td { padding: 9px 12px; border-bottom: 1px solid var(--border-color, #f0f0f0); vertical-align: middle; font-size: 0.83rem; }

        @media (max-width: 700px) {
          .adm-sidebar { transform: translateX(-100%); width: 220px; }
          .adm-sidebar.open { transform: translateX(0); }
          .adm-overlay.open { display: block; }
          .adm-content { margin-left: 0; padding: 14px 12px; padding-top: 58px; }
          .adm-topbar {
            display: flex; align-items: center; gap: 10px; position: fixed; top: 0; left: 0; right: 0; z-index: 150;
            background: #0d0d1f; padding: 10px 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.4);
          }
          .adm-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .adm-section-title { font-size: 1.1rem; }
        }
        @media (min-width: 701px) {
          .adm-stats-grid { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
        }
      `}</style>

      {/* Mobile topbar */}
      <div className="adm-topbar">
        <button onClick={() => setSidebarOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "white", fontSize: 22, padding: 0, lineHeight: 1 }}>☰</button>
        <span style={{ fontWeight: 800, color: "white", fontSize: "1rem" }}>🧠 Admin Panel</span>
        {pendingCount > 0 && <span style={{ marginLeft: "auto", background: "#ef4444", color: "white", borderRadius: 99, fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px" }}>{pendingCount} pending</span>}
      </div>

      {/* Overlay */}
      <div className={`adm-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div className="adm-wrap">
        {/* Sidebar */}
        <div className={`adm-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 28 }}>🧠</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: "1rem", color: "white" }}>Nixx AI</div>
                <div style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.4)", marginTop: 1 }}>⚡ Admin Panel</div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "12px 8px" }}>
            {MENU.map(item => {
              const active = section === item.id;
              return (
                <button key={item.id} onClick={() => handleNav(item.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 13px",
                  borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 3,
                  background: active ? "rgba(124,58,237,0.2)" : "transparent",
                  color: active ? "#c4b5fd" : "rgba(255,255,255,0.55)",
                  fontWeight: active ? 700 : 400, fontSize: "0.86rem", textAlign: "left",
                  borderLeft: active ? "3px solid #a855f7" : "3px solid transparent",
                }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.id === "payments" && pendingCount > 0 && (
                    <span style={{ background: "#ef4444", color: "white", borderRadius: 99, fontSize: "0.65rem", fontWeight: 800, padding: "1px 6px" }}>{pendingCount}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <Link to="/chat" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
              ← Kembali ke Chat
            </Link>
          </div>
        </div>

        {/* Main content */}
        <div className="adm-content">
          {section === "dashboard" && <DashboardSection onPendingUpdate={setPendingCount} />}
          {section === "payments" && <PaymentsSection onUpdate={setPendingCount} />}
          {section === "users" && <UsersSection />}
          {section === "settings" && <SettingsSection />}
        </div>
      </div>
    </>
  );
}

function DashboardSection({ onPendingUpdate }: { onPendingUpdate: (n: number) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats", { credentials: "include" }).then(r => r.json()),
      fetch("/api/admin/payments", { credentials: "include" }).then(r => r.json()),
    ]).then(([s, p]) => { setStats(s); setPayments((p as Payment[]).slice(0, 6)); onPendingUpdate(s.pendingPayments); });
  }, []);

  return (
    <div>
      <h1 className="adm-section-title">📊 Dashboard</h1>
      <p className="adm-section-sub">Ringkasan aktivitas Nixx AI</p>

      {stats && (
        <div className="adm-stats-grid">
          {[
            { icon: "👥", label: "Total Pengguna", value: stats.totalUsers, color: "#7c3aed" },
            { icon: "👑", label: "Premium Users",  value: stats.premiumUsers, color: "#f59e0b" },
            { icon: "💳", label: "Pending",         value: stats.pendingPayments, color: "#ef4444" },
            { icon: "💬", label: "Pesan Hari Ini",  value: stats.todayMessages, color: "#10b981" },
          ].map(c => (
            <div key={c.label} className="adm-card" style={{ padding: "16px 14px" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value.toLocaleString()}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {payments.length > 0 && (
        <div className="adm-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color,#eee)", fontWeight: 700, fontSize: "0.9rem" }}>Pembayaran Terbaru</div>
          <div className="adm-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {["User", "Plan", "Harga", "Status", "Tanggal"].map(h => <th key={h} className="adm-th">{h}</th>)}
              </tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="adm-td"><div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{p.userEmail ?? p.userId.slice(0, 12)}</div></td>
                    <td className="adm-td" style={{ whiteSpace: "nowrap" }}>{planLabel[p.planId] ?? p.planId}</td>
                    <td className="adm-td" style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{formatRp(p.amountRp)}</td>
                    <td className="adm-td"><StatusBadge status={p.status} /></td>
                    <td className="adm-td" style={{ color: "var(--text-muted)", whiteSpace: "nowrap", fontSize: "0.76rem" }}>{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
    if (!confirm(action === "approve" ? "Approve pembayaran ini?" : "Tolak pembayaran ini?")) return;
    setBusy(id);
    await fetch(`/api/admin/payments/${id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    setBusy(null); load();
  };

  const filtered = filter === "all" ? payments : payments.filter(p => p.status === filter);

  return (
    <div>
      <h1 className="adm-section-title">💳 Pembayaran</h1>
      <p className="adm-section-sub">Kelola semua permintaan upgrade premium</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[["all","Semua"], ["pending","Pending"], ["confirmed","Disetujui"], ["rejected","Ditolak"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "5px 14px", borderRadius: 99, border: "1.5px solid var(--border-color,#e8e4ff)", cursor: "pointer",
            fontWeight: filter === v ? 700 : 400, fontSize: "0.8rem",
            background: filter === v ? "linear-gradient(135deg,#7c3aed,#db2777)" : "var(--card-bg,white)",
            color: filter === v ? "white" : "var(--text-primary)",
          }}>
            {l}{v === "pending" && payments.filter(p => p.status === "pending").length > 0 ? ` (${payments.filter(p => p.status === "pending").length})` : ""}
          </button>
        ))}
      </div>

      <div className="adm-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--text-muted)" }}>⏳ Memuat...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--text-muted)" }}>Tidak ada data</div>
        ) : (
          <div className="adm-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {["User", "Plan", "Harga", "No. Dana", "Catatan", "Status", "Tanggal", "Aksi"].map(h => <th key={h} className="adm-th">{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ background: p.status === "pending" ? "rgba(124,58,237,0.03)" : undefined }}>
                    <td className="adm-td"><div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{p.userEmail ?? "-"}</div><div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{p.userName ?? ""}</div></td>
                    <td className="adm-td" style={{ whiteSpace: "nowrap" }}><span style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed", borderRadius: 6, padding: "2px 7px", fontSize: "0.75rem", fontWeight: 700 }}>{planLabel[p.planId] ?? p.planId}</span></td>
                    <td className="adm-td" style={{ fontWeight: 800, color: "#059669", whiteSpace: "nowrap" }}>{formatRp(p.amountRp)}</td>
                    <td className="adm-td"><code style={{ fontSize: "0.75rem", background: "rgba(0,0,0,0.05)", padding: "1px 5px", borderRadius: 4 }}>{p.danaNumber ?? "-"}</code></td>
                    <td className="adm-td" style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: "0.78rem" }} title={p.note ?? ""}>{p.note ?? "-"}</td>
                    <td className="adm-td"><StatusBadge status={p.status} /></td>
                    <td className="adm-td" style={{ color: "var(--text-muted)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>{formatDate(p.createdAt)}</td>
                    <td className="adm-td">
                      {p.status === "pending" ? (
                        <div style={{ display: "flex" }}>
                          <ActionBtn color="green" onClick={() => act(p.id, "approve")} disabled={busy === p.id}>✓</ActionBtn>
                          <ActionBtn color="red" onClick={() => act(p.id, "reject")} disabled={busy === p.id}>✗</ActionBtn>
                        </div>
                      ) : <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
      <h1 className="adm-section-title">👑 Premium Users</h1>
      <p className="adm-section-sub">Kelola status premium pengguna</p>

      <input className="adm-input" style={{ maxWidth: 340, marginBottom: 16 }} placeholder="🔍  Cari email atau nama..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="adm-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--text-muted)" }}>⏳ Memuat...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--text-muted)" }}>Tidak ada user</div>
        ) : (
          <div className="adm-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {["Email", "Status", "Hingga", "Hari", "Aksi"].map(h => <th key={h} className="adm-th">{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td className="adm-td"><div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{u.email}</div><div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{u.name ?? ""}</div></td>
                    <td className="adm-td"><StatusBadge status={u.isPremium ? "confirmed" : "rejected"} /></td>
                    <td className="adm-td" style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(u.premiumUntil)}</td>
                    <td className="adm-td">
                      {!u.isPremium && (
                        <input type="number" min="1" max="9999" className="adm-input" style={{ width: 70, padding: "5px 8px", fontSize: "0.82rem" }}
                          placeholder="30" value={daysMap[u.id] ?? "30"}
                          onChange={e => setDaysMap(m => ({ ...m, [u.id]: e.target.value }))} />
                      )}
                    </td>
                    <td className="adm-td">
                      {u.isPremium
                        ? <ActionBtn color="red" onClick={() => toggle(u.id, false)} disabled={busy === u.id}>Cabut</ActionBtn>
                        : <ActionBtn color="purple" onClick={() => toggle(u.id, true)} disabled={busy === u.id}>👑 Set</ActionBtn>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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

  const Field = ({ label, k, type = "text", hint, wide }: { label: string; k: keyof AppSettings; type?: string; hint?: string; wide?: boolean }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontWeight: 600, fontSize: "0.83rem", marginBottom: 5 }}>{label}</label>
      {wide
        ? <textarea className="adm-input" style={{ height: 72, resize: "vertical" }} value={form[k]} onChange={set(k)} />
        : <input type={type} className="adm-input" value={form[k]} onChange={set(k)} />}
      {hint && <div style={{ color: "var(--text-muted)", fontSize: "0.73rem", marginTop: 3 }}>{hint}</div>}
    </div>
  );

  return (
    <div>
      <h1 className="adm-section-title">⚙️ Pengaturan</h1>
      <p className="adm-section-sub">Konfigurasi pembayaran, harga, dan fitur premium</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: 18 }}>💳 QRIS & Dana</div>
          <Field label="Link QRIS (URL gambar)" k="qris_link" hint="URL gambar QRIS Dana" />
          <Field label="Nomor Dana" k="dana_number" hint="Contoh: 0812-xxxx-xxxx" />
          <Field label="Nama Rekening" k="dana_name" />
          {form.qris_link && (
            <img src={form.qris_link} alt="QRIS" style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 10, border: "1px solid var(--border-color,#eee)", marginTop: 8 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}
        </div>

        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: 18 }}>👑 Harga & Premium</div>
          <Field label="Harga Bulanan (Rp)" k="price_monthly" type="number" />
          <Field label="Harga 3 Bulan (Rp)" k="price_quarterly" type="number" />
          <Field label="Harga Tahunan (Rp)" k="price_yearly" type="number" />
          <Field label="Limit Chat Gratis / hari" k="daily_limit_free" type="number" hint="Jumlah pesan per hari untuk akun gratis" />
          <Field label="Model Premium IDs (pisah koma)" k="premium_model_ids" hint="ID model khusus premium" wide />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={save} disabled={saving} style={{
          padding: "11px 28px", borderRadius: 12, border: "none", cursor: saving ? "not-allowed" : "pointer",
          background: "linear-gradient(135deg,#7c3aed,#db2777)", color: "white", fontWeight: 800, fontSize: "0.9rem", opacity: saving ? 0.7 : 1,
        }}>{saving ? "⏳ Menyimpan..." : "💾 Simpan"}</button>
        {saved && <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.88rem" }}>✅ Tersimpan!</span>}
      </div>
    </div>
  );
}
