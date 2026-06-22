import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Show } from "@clerk/react";

interface Payment {
  id: number;
  clerkId: string;
  name: string;
  phone: string;
  amount: number;
  qrisRef: string | null;
  status: string;
  createdAt: string;
  approvedAt: string | null;
}

interface User {
  id: number;
  clerkId: string;
  username: string | null;
  email: string | null;
  isPremium: boolean;
  premiumUntil: string | null;
  createdAt: string;
}

type Tab = "payments" | "users";

export default function AdminPage() {
  const [, navigate] = useLocation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("payments");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [pRes, uRes] = await Promise.all([
        fetch("/api/admin/payments", { credentials: "include" }),
        fetch("/api/admin/users", { credentials: "include" }),
      ]);
      if (pRes.status === 403) { setError("Akses ditolak. Kamu bukan admin."); setLoading(false); return; }
      if (!pRes.ok || !uRes.ok) throw new Error("Gagal memuat data");
      const [pData, uData] = await Promise.all([pRes.json(), uRes.json()]);
      setPayments(pData);
      setUsers(uData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}/${action}`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal memproses");
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const today = new Date().toDateString();
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const stats = {
    totalUsers: users.length,
    todayUsers: users.filter(u => new Date(u.createdAt).toDateString() === today).length,
    weekUsers: users.filter(u => new Date(u.createdAt).getTime() > week).length,
    premiumUsers: users.filter(u => u.isPremium).length,
    pendingPayments: payments.filter(p => p.status === "pending").length,
  };

  const statusBadge = (s: string) => {
    if (s === "approved") return <span className="nx-adm-badge nx-adm-badge--green">Disetujui</span>;
    if (s === "rejected") return <span className="nx-adm-badge nx-adm-badge--red">Ditolak</span>;
    return <span className="nx-adm-badge nx-adm-badge--yellow">Menunggu</span>;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="nx-adm" data-theme="light">
      <Show when="signed-out">
        {(() => { navigate("/sign-in"); return null; })()}
      </Show>

      {/* Header */}
      <div className="nx-adm-header">
        <button className="nx-adm-back" onClick={() => navigate("/chat")}>←</button>
        <div className="nx-adm-header-title">
          <span className="nx-adm-header-icon">🛡️</span>
          <span>Admin Panel</span>
        </div>
        <button className="nx-adm-refresh" onClick={loadData} disabled={loading}>
          {loading ? "⏳" : "🔄"}
        </button>
      </div>

      {error && (
        <div className="nx-adm-error">⚠️ {error}</div>
      )}

      {!error && (
        <>
          {/* Stats */}
          <div className="nx-adm-stats">
            <div className="nx-adm-stat">
              <div className="nx-adm-stat-icon">👥</div>
              <div className="nx-adm-stat-val">{loading ? "—" : stats.totalUsers}</div>
              <div className="nx-adm-stat-label">Total Pengguna</div>
            </div>
            <div className="nx-adm-stat">
              <div className="nx-adm-stat-icon">📅</div>
              <div className="nx-adm-stat-val">{loading ? "—" : stats.todayUsers}</div>
              <div className="nx-adm-stat-label">Daftar Hari Ini</div>
            </div>
            <div className="nx-adm-stat">
              <div className="nx-adm-stat-icon">📈</div>
              <div className="nx-adm-stat-val">{loading ? "—" : stats.weekUsers}</div>
              <div className="nx-adm-stat-label">7 Hari Terakhir</div>
            </div>
            <div className="nx-adm-stat nx-adm-stat--premium">
              <div className="nx-adm-stat-icon">👑</div>
              <div className="nx-adm-stat-val">{loading ? "—" : stats.premiumUsers}</div>
              <div className="nx-adm-stat-label">Premium</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="nx-adm-tabs">
            <button
              className={`nx-adm-tab${tab === "payments" ? " nx-adm-tab--active" : ""}`}
              onClick={() => setTab("payments")}
            >
              💳 Pembayaran
              {stats.pendingPayments > 0 && (
                <span className="nx-adm-tab-badge">{stats.pendingPayments}</span>
              )}
            </button>
            <button
              className={`nx-adm-tab${tab === "users" ? " nx-adm-tab--active" : ""}`}
              onClick={() => setTab("users")}
            >
              👥 Pengguna
            </button>
          </div>

          {/* Content */}
          <div className="nx-adm-content">
            {loading ? (
              <div className="nx-adm-loading">
                <div className="nx-adm-spinner" />
                <span>Memuat data...</span>
              </div>
            ) : tab === "payments" ? (
              payments.length === 0 ? (
                <div className="nx-adm-empty">
                  <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>💳</div>
                  <div>Belum ada pembayaran masuk</div>
                </div>
              ) : (
                <div className="nx-adm-list">
                  {payments.map((p) => (
                    <div key={p.id} className="nx-adm-card">
                      <div className="nx-adm-card-top">
                        <div className="nx-adm-card-name">
                          <span className="nx-adm-card-avatar">
                            {(p.name?.[0] || "?").toUpperCase()}
                          </span>
                          <div>
                            <div className="nx-adm-card-title">{p.name}</div>
                            <div className="nx-adm-card-sub">{p.phone}</div>
                          </div>
                        </div>
                        {statusBadge(p.status)}
                      </div>
                      <div className="nx-adm-card-row">
                        <span className="nx-adm-card-key">Jumlah</span>
                        <span className="nx-adm-card-amount">Rp{Number(p.amount).toLocaleString("id-ID")}</span>
                      </div>
                      {p.qrisRef && (
                        <div className="nx-adm-card-row">
                          <span className="nx-adm-card-key">Ref QRIS</span>
                          <span className="nx-adm-card-val">{p.qrisRef}</span>
                        </div>
                      )}
                      <div className="nx-adm-card-row">
                        <span className="nx-adm-card-key">Tanggal</span>
                        <span className="nx-adm-card-val">{formatDate(p.createdAt)}</span>
                      </div>
                      {p.status === "pending" && (
                        <div className="nx-adm-card-actions">
                          <button
                            className="nx-adm-btn-approve"
                            disabled={processing === p.id}
                            onClick={() => handleAction(p.id, "approve")}
                          >
                            {processing === p.id ? "⏳" : "✅"} Setujui
                          </button>
                          <button
                            className="nx-adm-btn-reject"
                            disabled={processing === p.id}
                            onClick={() => handleAction(p.id, "reject")}
                          >
                            ❌ Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              users.length === 0 ? (
                <div className="nx-adm-empty">
                  <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>👥</div>
                  <div>Belum ada pengguna terdaftar</div>
                </div>
              ) : (
                <div className="nx-adm-list">
                  {users.map((u) => (
                    <div key={u.id} className="nx-adm-card">
                      <div className="nx-adm-card-top">
                        <div className="nx-adm-card-name">
                          <span className="nx-adm-card-avatar">
                            {(u.username?.[0] || u.email?.[0] || "?").toUpperCase()}
                          </span>
                          <div>
                            <div className="nx-adm-card-title">{u.username || "—"}</div>
                            <div className="nx-adm-card-sub">{u.email || u.clerkId}</div>
                          </div>
                        </div>
                        <span className={`nx-adm-badge ${u.isPremium ? "nx-adm-badge--purple" : "nx-adm-badge--gray"}`}>
                          {u.isPremium ? "👑 Premium" : "Gratis"}
                        </span>
                      </div>
                      {u.isPremium && u.premiumUntil && (
                        <div className="nx-adm-card-row">
                          <span className="nx-adm-card-key">Premium s/d</span>
                          <span className="nx-adm-card-val">{formatDate(u.premiumUntil)}</span>
                        </div>
                      )}
                      <div className="nx-adm-card-row">
                        <span className="nx-adm-card-key">Daftar</span>
                        <span className="nx-adm-card-val">{formatDate(u.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
