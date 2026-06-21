import React, { useState, useEffect } from "react";

  interface User {
    id: number;
    email: string;
    username: string;
    registeredAt: string;
  }

  interface Stats {
    total: number;
    users: User[];
  }

  const ADMIN_CSS = `
  .adm-bg { min-height:100vh; background:#0a0a0f; color:#e2e8f0; font-family:'Inter',sans-serif; padding:24px 16px; }
  .adm-header { display:flex; align-items:center; gap:12px; margin-bottom:32px; }
  .adm-logo { font-size:28px; }
  .adm-title { font-size:22px; font-weight:700; color:#fff; }
  .adm-subtitle { font-size:13px; color:#64748b; }
  .adm-login-card { max-width:380px; margin:80px auto; background:#13131a; border:1px solid #1e293b; border-radius:16px; padding:32px; }
  .adm-login-title { font-size:20px; font-weight:700; margin-bottom:8px; }
  .adm-input { width:100%; padding:12px 14px; background:#1e293b; border:1px solid #334155; border-radius:10px; color:#e2e8f0; font-size:14px; outline:none; box-sizing:border-box; margin-top:8px; }
  .adm-input:focus { border-color:#6366f1; }
  .adm-btn { width:100%; padding:12px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:10px; color:#fff; font-size:15px; font-weight:600; cursor:pointer; margin-top:16px; }
  .adm-btn:hover { opacity:.9; }
  .adm-err { color:#f87171; font-size:13px; margin-top:10px; text-align:center; }
  .adm-stats-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:16px; margin-bottom:28px; }
  .adm-stat-card { background:#13131a; border:1px solid #1e293b; border-radius:14px; padding:20px; text-align:center; }
  .adm-stat-num { font-size:36px; font-weight:800; background:linear-gradient(135deg,#6366f1,#8b5cf6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .adm-stat-lbl { font-size:13px; color:#64748b; margin-top:4px; }
  .adm-table-wrap { background:#13131a; border:1px solid #1e293b; border-radius:14px; overflow:hidden; }
  .adm-table-head { padding:16px 20px; border-bottom:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center; }
  .adm-table-title { font-weight:600; font-size:15px; }
  .adm-refresh { background:#1e293b; border:1px solid #334155; color:#94a3b8; padding:6px 14px; border-radius:8px; font-size:12px; cursor:pointer; }
  .adm-refresh:hover { background:#334155; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; padding:12px 20px; font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #1e293b; }
  td { padding:13px 20px; font-size:14px; border-bottom:1px solid #0f172a; }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:#1a1a25; }
  .adm-badge { display:inline-block; padding:3px 10px; background:#1e293b; border-radius:20px; font-size:12px; color:#94a3b8; }
  .adm-logout { background:transparent; border:1px solid #334155; color:#64748b; padding:6px 14px; border-radius:8px; font-size:12px; cursor:pointer; margin-left:auto; }
  .adm-logout:hover { border-color:#f87171; color:#f87171; }
  .adm-empty { text-align:center; padding:48px; color:#475569; }
  `;

  export default function AdminPage() {
    const [pass, setPass] = useState("");
    const [authed, setAuthed] = useState(false);
    const [savedPass, setSavedPass] = useState(() => sessionStorage.getItem("nx-admin-pass") || "");
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const bp = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

    const load = async (p: string) => {
      setLoading(true); setErr("");
      try {
        const res = await fetch(`${bp}/api/admin-stats?pass=${encodeURIComponent(p)}`);
        if (res.status === 403) { setErr("Password salah!"); setLoading(false); return false; }
        const data = await res.json();
        setStats(data); setAuthed(true);
        sessionStorage.setItem("nx-admin-pass", p);
        setSavedPass(p);
        return true;
      } catch { setErr("Gagal terhubung ke server"); return false; }
      finally { setLoading(false); }
    };

    useEffect(() => { if (savedPass) load(savedPass); }, []);

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      await load(pass);
    };

    const today = stats?.users.filter(u => {
      const d = new Date(u.registeredAt); const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length ?? 0;

    const thisWeek = stats?.users.filter(u => {
      const d = new Date(u.registeredAt); const now = new Date();
      return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length ?? 0;

    return (
      <>
        <style>{ADMIN_CSS}</style>
        <div className="adm-bg">
          <div className="adm-header">
            <div className="adm-logo">🧠</div>
            <div>
              <div className="adm-title">Nixx AI — Admin Panel</div>
              <div className="adm-subtitle">Data pendaftar pengguna</div>
            </div>
            {authed && (
              <button className="adm-logout" onClick={() => {
                sessionStorage.removeItem("nx-admin-pass");
                setAuthed(false); setStats(null); setSavedPass("");
              }}>Keluar</button>
            )}
          </div>

          {!authed ? (
            <div className="adm-login-card">
              <div className="adm-login-title">🔐 Login Admin</div>
              <div style={{fontSize:13,color:"#64748b",marginBottom:16}}>Masukkan password admin untuk melihat data</div>
              <form onSubmit={handleLogin}>
                <label style={{fontSize:13,color:"#94a3b8"}}>Password Admin</label>
                <input type="password" className="adm-input" value={pass}
                  onChange={e => setPass(e.target.value)} placeholder="••••••••" autoFocus />
                <button className="adm-btn" type="submit" disabled={loading}>
                  {loading ? "Memeriksa..." : "Masuk"}
                </button>
                {err && <div className="adm-err">{err}</div>}
              </form>
            </div>
          ) : (
            <>
              <div className="adm-stats-row">
                <div className="adm-stat-card">
                  <div className="adm-stat-num">{stats?.total ?? 0}</div>
                  <div className="adm-stat-lbl">Total Pengguna</div>
                </div>
                <div className="adm-stat-card">
                  <div className="adm-stat-num">{today}</div>
                  <div className="adm-stat-lbl">Daftar Hari Ini</div>
                </div>
                <div className="adm-stat-card">
                  <div className="adm-stat-num">{thisWeek}</div>
                  <div className="adm-stat-lbl">7 Hari Terakhir</div>
                </div>
              </div>

              <div className="adm-table-wrap">
                <div className="adm-table-head">
                  <span className="adm-table-title">📋 Daftar Pengguna</span>
                  <button className="adm-refresh" onClick={() => load(savedPass)}>
                    {loading ? "⏳" : "🔄 Refresh"}
                  </button>
                </div>
                {stats?.users.length === 0 ? (
                  <div className="adm-empty">Belum ada pengguna yang mendaftar</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Tanggal Daftar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(stats?.users ?? [])].reverse().map((u, i) => (
                        <tr key={u.id}>
                          <td><span className="adm-badge">{(stats?.total ?? 0) - i}</span></td>
                          <td style={{fontWeight:600}}>{u.username}</td>
                          <td style={{color:"#94a3b8"}}>{u.email}</td>
                          <td style={{color:"#64748b",fontSize:13}}>
                            {new Date(u.registeredAt).toLocaleString("id-ID", {
                              day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </>
    );
  }
  