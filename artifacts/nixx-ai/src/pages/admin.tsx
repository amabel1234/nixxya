import React, { useState, useEffect } from "react";

  interface User { id:number; email:string; username:string; registeredAt:string; isPremium?:boolean; }
  interface Payment { id:number; email:string; username:string; name:string; phone:string; payRef:string; status:string; createdAt:string; }
  interface Config { premiumPrice:number; dailyFreeLimit:number; qrisUrl:string; danaNumber:string; danaName:string; adminPassword?:string; }
  interface Stats { total:number; users:User[]; }

  type Menu = "stats" | "payments" | "settings";

  const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  .a-root{display:flex;min-height:100vh;background:#070711;color:#e2e8f0;font-family:'Inter',system-ui,sans-serif;}
  /* ── Sidebar ── */
  .a-sidebar{width:240px;background:#0f0f1a;border-right:1px solid #1e293b;display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:50;transition:transform .25s;}
  .a-sidebar.closed{transform:translateX(-100%);}
  .a-logo{padding:24px 20px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #1e293b;}
  .a-logo-icon{width:38px;height:38px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;}
  .a-logo-text{font-size:16px;font-weight:700;color:#fff;}
  .a-logo-sub{font-size:11px;color:#475569;}
  .a-nav{flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:4px;}
  .a-nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:14px;color:#94a3b8;border:none;background:transparent;width:100%;text-align:left;transition:all .15s;}
  .a-nav-item:hover{background:#1e293b;color:#e2e8f0;}
  .a-nav-item.active{background:linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.25));color:#a78bfa;border:1px solid rgba(99,102,241,.3);}
  .a-nav-icon{font-size:18px;width:22px;text-align:center;}
  .a-nav-badge{margin-left:auto;background:#ef4444;color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:20px;}
  .a-sidebar-footer{padding:16px;border-top:1px solid #1e293b;}
  .a-logout-btn{width:100%;padding:9px;background:transparent;border:1px solid #334155;border-radius:8px;color:#64748b;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;}
  .a-logout-btn:hover{border-color:#f87171;color:#f87171;}
  /* ── Main ── */
  .a-main{flex:1;margin-left:240px;padding:28px 24px;transition:margin .25s;}
  .a-main.full{margin-left:0;}
  .a-topbar{display:flex;align-items:center;gap:12px;margin-bottom:28px;}
  .a-hamburger{display:none;background:transparent;border:1px solid #334155;border-radius:8px;padding:8px;cursor:pointer;color:#94a3b8;font-size:18px;}
  .a-page-title{font-size:20px;font-weight:700;color:#fff;}
  .a-page-sub{font-size:13px;color:#475569;margin-top:2px;}
  /* ── Login ── */
  .a-login-wrap{max-width:380px;margin:80px auto;}
  .a-card{background:#13131f;border:1px solid #1e293b;border-radius:16px;padding:28px;}
  .a-card-title{font-size:18px;font-weight:700;margin-bottom:4px;}
  .a-card-sub{font-size:13px;color:#64748b;margin-bottom:20px;}
  /* ── Stats ── */
  .a-grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px;}
  .a-stat{background:#13131f;border:1px solid #1e293b;border-radius:14px;padding:20px;text-align:center;}
  .a-stat-num{font-size:34px;font-weight:800;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .a-stat-lbl{font-size:12px;color:#64748b;margin-top:4px;}
  /* ── Table ── */
  .a-table-card{background:#13131f;border:1px solid #1e293b;border-radius:14px;overflow:hidden;margin-bottom:20px;}
  .a-table-hd{padding:16px 20px;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;}
  .a-table-ttl{font-size:15px;font-weight:600;}
  .a-refresh{background:#1e293b;border:1px solid #334155;color:#94a3b8;padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;}
  .a-refresh:hover{background:#334155;}
  table{width:100%;border-collapse:collapse;}
  th{text-align:left;padding:11px 20px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #1e293b;}
  td{padding:12px 20px;font-size:13px;border-bottom:1px solid #0d1117;}
  tr:last-child td{border:none;}
  tr:hover td{background:#1a1a2e;}
  .a-badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;}
  .a-badge-free{background:#1e293b;color:#64748b;}
  .a-badge-premium{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;}
  .a-badge-pending{background:#854d0e;color:#fde68a;}
  .a-badge-approved{background:#14532d;color:#86efac;}
  .a-badge-rejected{background:#7f1d1d;color:#fca5a5;}
  .a-empty{text-align:center;padding:48px;color:#475569;}
  /* ── Payment actions ── */
  .a-act-approve{background:#16a34a;border:none;color:#fff;padding:6px 14px;border-radius:7px;font-size:12px;cursor:pointer;font-weight:600;}
  .a-act-approve:hover{background:#15803d;}
  .a-act-reject{background:#dc2626;border:none;color:#fff;padding:6px 14px;border-radius:7px;font-size:12px;cursor:pointer;font-weight:600;margin-left:6px;}
  .a-act-reject:hover{background:#b91c1c;}
  /* ── Form ── */
  .a-form-grid{display:grid;gap:16px;}
  .a-field{display:flex;flex-direction:column;gap:6px;}
  .a-label{font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;}
  .a-input{padding:11px 14px;background:#1e293b;border:1px solid #334155;border-radius:10px;color:#e2e8f0;font-size:14px;outline:none;width:100%;}
  .a-input:focus{border-color:#6366f1;}
  .a-btn-primary{padding:11px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;width:100%;margin-top:4px;}
  .a-btn-primary:hover{opacity:.9;}
  .a-btn-primary:disabled{opacity:.5;cursor:default;}
  .a-msg-ok{color:#4ade80;font-size:13px;margin-top:8px;}
  .a-msg-err{color:#f87171;font-size:13px;margin-top:8px;}
  .a-section-title{font-size:15px;font-weight:700;color:#e2e8f0;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #1e293b;}
  .a-sep{height:1px;background:#1e293b;margin:20px 0;}
  .a-hint{font-size:12px;color:#475569;margin-top:4px;}
  /* ── Responsive ── */
  @media(max-width:700px){
    .a-sidebar{transform:translateX(-100%);}
    .a-sidebar.open{transform:translateX(0);}
    .a-main{margin-left:0;}
    .a-hamburger{display:flex;}
    .a-overlay{display:block!important;}
  }
  .a-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:40;}
  `;

  export default function AdminPage() {
    const [authed, setAuthed] = useState(false);
    const [savedPass, setSavedPass] = useState(() => sessionStorage.getItem("nx-admin-pass") || "");
    const [loginPass, setLoginPass] = useState("");
    const [loginErr, setLoginErr] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [menu, setMenu] = useState<Menu>("stats");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Stats
    const [stats, setStats] = useState<Stats|null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Payments
    const [payments, setPayments] = useState<Payment[]>([]);
    const [payLoading, setPayLoading] = useState(false);
    const [actLoading, setActLoading] = useState<number|null>(null);

    // Config/Settings
    const [cfg, setCfg] = useState<Config>({ premiumPrice:10000, dailyFreeLimit:20, qrisUrl:"", danaNumber:"", danaName:"" });
    const [cfgLoading, setCfgLoading] = useState(false);
    const [cfgMsg, setCfgMsg] = useState("");
    const [cfgErr, setCfgErr] = useState("");

    // Change password
    const [cpOld, setCpOld] = useState(""); const [cpNew, setCpNew] = useState(""); const [cpNew2, setCpNew2] = useState("");
    const [cpLoading, setCpLoading] = useState(false); const [cpMsg, setCpMsg] = useState(""); const [cpErr, setCpErr] = useState("");

    const bp = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
    const pendingCount = payments.filter(p => p.status === "pending").length;

    const doAuth = async (p: string) => {
      setLoginLoading(true); setLoginErr("");
      try {
        const r = await fetch(`${bp}/api/admin-stats?pass=${encodeURIComponent(p)}`);
        if (r.status === 403) { setLoginErr("Password salah!"); return false; }
        const d = await r.json();
        setStats(d); setAuthed(true);
        sessionStorage.setItem("nx-admin-pass", p); setSavedPass(p);
        return true;
      } catch { setLoginErr("Gagal terhubung ke server"); return false; }
      finally { setLoginLoading(false); }
    };

    useEffect(() => { if (savedPass) doAuth(savedPass); }, []);

    const loadStats = async () => {
      setStatsLoading(true);
      try { const r = await fetch(`${bp}/api/admin-stats?pass=${encodeURIComponent(savedPass)}`); setStats(await r.json()); }
      catch {} finally { setStatsLoading(false); }
    };

    const loadPayments = async () => {
      setPayLoading(true);
      try { const r = await fetch(`${bp}/api/admin-premium?pass=${encodeURIComponent(savedPass)}`); const d = await r.json(); setPayments(d.payments||[]); }
      catch {} finally { setPayLoading(false); }
    };

    const loadConfig = async () => {
      setCfgLoading(true);
      try { const r = await fetch(`${bp}/api/admin-config?pass=${encodeURIComponent(savedPass)}`); const d = await r.json(); if(d.config) setCfg(d.config); }
      catch {} finally { setCfgLoading(false); }
    };

    useEffect(() => {
      if (!authed) return;
      if (menu === "payments") loadPayments();
      if (menu === "settings") loadConfig();
    }, [menu, authed]);

    const actPayment = async (id: number, action: string) => {
      setActLoading(id);
      try {
        await fetch(`${bp}/api/admin-premium?pass=${encodeURIComponent(savedPass)}`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ paymentId: id, action }),
        });
        await loadPayments();
      } catch {} finally { setActLoading(null); }
    };

    const saveConfig = async (e: React.FormEvent) => {
      e.preventDefault(); setCfgMsg(""); setCfgErr(""); setCfgLoading(true);
      try {
        const r = await fetch(`${bp}/api/admin-config?pass=${encodeURIComponent(savedPass)}`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ premiumPrice: Number(cfg.premiumPrice), dailyFreeLimit: Number(cfg.dailyFreeLimit), qrisUrl: cfg.qrisUrl, danaNumber: cfg.danaNumber, danaName: cfg.danaName }),
        });
        if (r.ok) setCfgMsg("✅ Pengaturan berhasil disimpan!"); else setCfgErr("Gagal menyimpan");
      } catch { setCfgErr("Gagal menyimpan"); } finally { setCfgLoading(false); }
    };

    const changePass = async (e: React.FormEvent) => {
      e.preventDefault(); setCpMsg(""); setCpErr("");
      if (cpNew !== cpNew2) { setCpErr("Password baru tidak cocok!"); return; }
      if (cpNew.length < 6) { setCpErr("Minimal 6 karakter"); return; }
      setCpLoading(true);
      try {
        const r = await fetch(`${bp}/api/admin-change-pass`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ currentPass: cpOld, newPass: cpNew }),
        });
        const d = await r.json();
        if (!r.ok) { setCpErr(d.error||"Gagal"); return; }
        setCpMsg("✅ Password berhasil diganti!");
        sessionStorage.setItem("nx-admin-pass", cpNew); setSavedPass(cpNew);
        setCpOld(""); setCpNew(""); setCpNew2("");
      } catch { setCpErr("Gagal terhubung"); } finally { setCpLoading(false); }
    };

    const today = stats?.users.filter(u => new Date(u.registeredAt).toDateString() === new Date().toDateString()).length ?? 0;
    const thisWeek = stats?.users.filter(u => (Date.now()-new Date(u.registeredAt).getTime()) < 7*864e5).length ?? 0;
    const premiumCount = stats?.users.filter(u => u.isPremium).length ?? 0;

    const logout = () => { sessionStorage.removeItem("nx-admin-pass"); setAuthed(false); setStats(null); setSavedPass(""); setLoginPass(""); };

    if (!authed) return (
      <>
        <style>{CSS}</style>
        <div style={{minHeight:"100vh",background:"#070711",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div className="a-login-wrap" style={{width:"100%"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{width:56,height:56,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 12px"}}>🧠</div>
              <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>Nixx AI Admin</div>
              <div style={{fontSize:13,color:"#475569",marginTop:4}}>Panel manajemen khusus admin</div>
            </div>
            <div className="a-card">
              <div className="a-card-title">🔐 Login Admin</div>
              <div className="a-card-sub">Masukkan password admin untuk masuk</div>
              <form onSubmit={async e => { e.preventDefault(); await doAuth(loginPass); }}>
                <div className="a-field">
                  <label className="a-label">Password</label>
                  <input type="password" className="a-input" value={loginPass} onChange={e=>setLoginPass(e.target.value)} placeholder="••••••••" autoFocus />
                </div>
                <button className="a-btn-primary" type="submit" disabled={loginLoading}>{loginLoading?"Memeriksa...":"Masuk ke Admin Panel"}</button>
                {loginErr && <div className="a-msg-err">{loginErr}</div>}
              </form>
            </div>
          </div>
        </div>
      </>
    );

    return (
      <>
        <style>{CSS}</style>
        <div className="a-root">
          {/* Overlay mobile */}
          <div className="a-overlay" onClick={() => setSidebarOpen(false)} style={{display: sidebarOpen ? "block" : "none"}} />

          {/* Sidebar */}
          <aside className={`a-sidebar${sidebarOpen ? " open" : ""}`}>
            <div className="a-logo">
              <div className="a-logo-icon">🧠</div>
              <div><div className="a-logo-text">Nixx AI</div><div className="a-logo-sub">Admin Panel</div></div>
            </div>
            <nav className="a-nav">
              {([
                { id:"stats", icon:"📊", label:"Statistik" },
                { id:"payments", icon:"💳", label:"Pembayaran", badge: pendingCount > 0 ? pendingCount : 0 },
                { id:"settings", icon:"⚙️", label:"Pengaturan" },
              ] as {id:Menu;icon:string;label:string;badge?:number}[]).map(item => (
                <button key={item.id} className={`a-nav-item${menu===item.id?" active":""}`}
                  onClick={() => { setMenu(item.id); setSidebarOpen(false); }}>
                  <span className="a-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge ? <span className="a-nav-badge">{item.badge}</span> : null}
                </button>
              ))}
            </nav>
            <div className="a-sidebar-footer">
              <button className="a-logout-btn" onClick={logout}>🚪 Keluar</button>
            </div>
          </aside>

          {/* Main content */}
          <main className="a-main">
            <div className="a-topbar">
              <button className="a-hamburger" onClick={() => setSidebarOpen(v=>!v)}>☰</button>
              <div>
                <div className="a-page-title">
                  {menu==="stats"?"📊 Statistik":menu==="payments"?"💳 Pembayaran":"⚙️ Pengaturan"}
                </div>
                <div className="a-page-sub">
                  {menu==="stats"?"Data pengguna terdaftar":menu==="payments"?"Kelola permintaan upgrade premium":"Atur harga, QRIS, Dana & password"}
                </div>
              </div>
            </div>

            {/* ─── STATS ─── */}
            {menu === "stats" && (
              <>
                <div className="a-grid3">
                  {[
                    {num:stats?.total??0, lbl:"Total Pengguna", icon:"👥"},
                    {num:today, lbl:"Daftar Hari Ini", icon:"📅"},
                    {num:thisWeek, lbl:"7 Hari Terakhir", icon:"📈"},
                    {num:premiumCount, lbl:"User Premium", icon:"👑"},
                  ].map((s,i) => (
                    <div key={i} className="a-stat">
                      <div style={{fontSize:24,marginBottom:4}}>{s.icon}</div>
                      <div className="a-stat-num">{s.num}</div>
                      <div className="a-stat-lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>
                <div className="a-table-card">
                  <div className="a-table-hd">
                    <span className="a-table-ttl">Daftar Pengguna</span>
                    <button className="a-refresh" onClick={loadStats}>{statsLoading?"⏳":"🔄 Refresh"}</button>
                  </div>
                  {!stats?.users?.length ? <div className="a-empty">Belum ada pengguna</div> : (
                    <table><thead><tr><th>#</th><th>Username</th><th>Email</th><th>Status</th><th>Tanggal Daftar</th></tr></thead>
                    <tbody>
                      {[...(stats.users)].reverse().map((u,i) => (
                        <tr key={u.id}>
                          <td>{(stats.total)-i}</td>
                          <td style={{fontWeight:600}}>{u.username||"-"}</td>
                          <td style={{color:"#94a3b8"}}>{u.email}</td>
                          <td><span className={`a-badge ${u.isPremium?"a-badge-premium":"a-badge-free"}`}>{u.isPremium?"👑 Premium":"Gratis"}</span></td>
                          <td style={{color:"#64748b",fontSize:12}}>{new Date(u.registeredAt).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</td>
                        </tr>
                      ))}
                    </tbody></table>
                  )}
                </div>
              </>
            )}

            {/* ─── PAYMENTS ─── */}
            {menu === "payments" && (
              <div className="a-table-card">
                <div className="a-table-hd">
                  <span className="a-table-ttl">Permintaan Upgrade Premium</span>
                  <button className="a-refresh" onClick={loadPayments}>{payLoading?"⏳":"🔄 Refresh"}</button>
                </div>
                {!payments.length ? <div className="a-empty">Belum ada permintaan pembayaran</div> : (
                  <table><thead><tr><th>Nama</th><th>Email</th><th>No HP</th><th>Ref Bayar</th><th>Tgl</th><th>Status</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {[...payments].reverse().map(p => (
                      <tr key={p.id}>
                        <td style={{fontWeight:600}}>{p.name}</td>
                        <td style={{color:"#94a3b8",fontSize:12}}>{p.email}</td>
                        <td style={{color:"#94a3b8"}}>{p.phone}</td>
                        <td style={{color:"#64748b",fontSize:12}}>{p.payRef||"-"}</td>
                        <td style={{color:"#64748b",fontSize:12}}>{new Date(p.createdAt).toLocaleDateString("id-ID")}</td>
                        <td><span className={`a-badge a-badge-${p.status}`}>{p.status==="pending"?"⏳ Pending":p.status==="approved"?"✅ Disetujui":"❌ Ditolak"}</span></td>
                        <td>
                          {p.status==="pending" && (
                            <>
                              <button className="a-act-approve" disabled={actLoading===p.id} onClick={()=>actPayment(p.id,"approved")}>✓ Setujui</button>
                              <button className="a-act-reject" disabled={actLoading===p.id} onClick={()=>actPayment(p.id,"rejected")}>✗ Tolak</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody></table>
                )}
              </div>
            )}

            {/* ─── SETTINGS ─── */}
            {menu === "settings" && (
              <div style={{display:"grid",gap:20}}>
                {/* Pembayaran Config */}
                <div className="a-card">
                  <div className="a-section-title">💳 Pengaturan Pembayaran</div>
                  <form onSubmit={saveConfig}>
                    <div className="a-form-grid">
                      <div className="a-field">
                        <label className="a-label">Harga Premium (Rp)</label>
                        <input type="number" className="a-input" value={cfg.premiumPrice} onChange={e=>setCfg(v=>({...v,premiumPrice:+e.target.value}))} placeholder="10000" />
                        <div className="a-hint">Harga yang ditampilkan ke pengguna</div>
                      </div>
                      <div className="a-field">
                        <label className="a-label">Limit Pesan Gratis / Hari</label>
                        <input type="number" className="a-input" value={cfg.dailyFreeLimit} onChange={e=>setCfg(v=>({...v,dailyFreeLimit:+e.target.value}))} placeholder="20" />
                        <div className="a-hint">User gratis bisa kirim berapa pesan per hari</div>
                      </div>
                      <div className="a-sep" style={{margin:"4px 0"}} />
                      <div className="a-field">
                        <label className="a-label">Link / URL QRIS</label>
                        <input type="url" className="a-input" value={cfg.qrisUrl} onChange={e=>setCfg(v=>({...v,qrisUrl:e.target.value}))} placeholder="https://link-gambar-qris-kamu.jpg" />
                        <div className="a-hint">URL gambar QRIS Dana/GoPay/dll yang ditampilkan ke user</div>
                      </div>
                      <div className="a-field">
                        <label className="a-label">Nomor Dana</label>
                        <input type="text" className="a-input" value={cfg.danaNumber} onChange={e=>setCfg(v=>({...v,danaNumber:e.target.value}))} placeholder="08xxxxxxxxxx" />
                      </div>
                      <div className="a-field">
                        <label className="a-label">Nama Pemilik Dana</label>
                        <input type="text" className="a-input" value={cfg.danaName} onChange={e=>setCfg(v=>({...v,danaName:e.target.value}))} placeholder="Nama Kamu" />
                      </div>
                    </div>
                    <button className="a-btn-primary" type="submit" disabled={cfgLoading} style={{marginTop:16}}>{cfgLoading?"Menyimpan...":"Simpan Pengaturan"}</button>
                    {cfgMsg && <div className="a-msg-ok">{cfgMsg}</div>}
                    {cfgErr && <div className="a-msg-err">{cfgErr}</div>}
                  </form>
                </div>

                {/* Change Password */}
                <div className="a-card">
                  <div className="a-section-title">🔑 Ganti Password Admin</div>
                  <form onSubmit={changePass}>
                    <div className="a-form-grid">
                      <div className="a-field">
                        <label className="a-label">Password Lama</label>
                        <input type="password" className="a-input" value={cpOld} onChange={e=>setCpOld(e.target.value)} placeholder="Password sekarang" />
                      </div>
                      <div className="a-field">
                        <label className="a-label">Password Baru</label>
                        <input type="password" className="a-input" value={cpNew} onChange={e=>setCpNew(e.target.value)} placeholder="Minimal 6 karakter" />
                      </div>
                      <div className="a-field">
                        <label className="a-label">Konfirmasi Password Baru</label>
                        <input type="password" className="a-input" value={cpNew2} onChange={e=>setCpNew2(e.target.value)} placeholder="Ulangi password baru" />
                      </div>
                    </div>
                    <button className="a-btn-primary" type="submit" disabled={cpLoading||!cpOld||!cpNew||!cpNew2} style={{marginTop:16}}>{cpLoading?"Menyimpan...":"Simpan Password Baru"}</button>
                    {cpMsg && <div className="a-msg-ok">{cpMsg}</div>}
                    {cpErr && <div className="a-msg-err">{cpErr}</div>}
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </>
    );
  }
  