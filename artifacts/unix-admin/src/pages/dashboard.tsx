import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const registrationData = [
  { day: "Sen", users: 12 }, { day: "Sel", users: 19 }, { day: "Rab", users: 8 },
  { day: "Kam", users: 24 }, { day: "Jum", users: 31 }, { day: "Sab", users: 18 }, { day: "Min", users: 27 },
];
const chatData = [
  { day: "Sen", chats: 145 }, { day: "Sel", chats: 230 }, { day: "Rab", chats: 189 },
  { day: "Kam", chats: 310 }, { day: "Jum", chats: 275 }, { day: "Sab", chats: 198 }, { day: "Min", chats: 342 },
];
const premiumData = [
  { month: "Jan", sales: 8 }, { month: "Feb", sales: 15 }, { month: "Mar", sales: 12 },
  { month: "Apr", sales: 20 }, { month: "Mei", sales: 28 }, { month: "Jun", sales: 35 },
];

const QUICK_ACTIONS = [
  { icon: "👥", text: "Lihat daftar semua user yang terdaftar",     path: "/users"      },
  { icon: "✨", text: "Kelola user premium dan langganan aktif",    path: "/premium"    },
  { icon: "💳", text: "Cek riwayat pembayaran & transaksi",         path: "/payment"    },
  { icon: "📢", text: "Kirim broadcast pesan ke semua user",        path: "/broadcast"  },
];

const CSS = `
  @keyframes dbFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes dbPop    { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
  @keyframes dbFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes dbPulse  { 0%,100%{opacity:1} 50%{opacity:.4} }

  .db-page {
    min-height:100%; display:flex; flex-direction:column;
    background:linear-gradient(160deg,#0c0820 0%,#130b30 40%,#0e0c2a 100%);
    font-family:'Inter',system-ui,sans-serif;
  }

  /* ── HERO BANNER ── */
  .db-hero {
    width:100%; height:230px; position:relative; overflow:hidden; flex-shrink:0;
  }
  .db-hero img {
    width:100%; height:100%; object-fit:cover; object-position:center 20%;
  }
  .db-hero-overlay {
    position:absolute; inset:0;
    background:linear-gradient(105deg,rgba(0,0,0,.12) 0%,rgba(70,8,150,.62) 40%,rgba(155,20,100,.9) 100%);
  }
  .db-hero-text {
    position:absolute; right:22px; bottom:22px; text-align:right;
  }
  .db-hero-title { color:#fff; font-weight:900; font-size:1.65rem; line-height:1.1; text-shadow:0 2px 14px rgba(0,0,0,.5); }
  .db-hero-sub   { color:rgba(255,255,255,.82); font-size:.8rem; margin-top:4px; text-shadow:0 1px 8px rgba(0,0,0,.4); }
  .db-hero-badge {
    position:absolute; top:14px; right:16px;
    display:flex; align-items:center; gap:6px; padding:6px 12px;
    background:rgba(0,0,0,.35); backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,.18); border-radius:20px;
  }
  .db-hero-dot { width:8px; height:8px; border-radius:50%; background:#22c55e; animation:dbPulse 2s ease-in-out infinite; }
  .db-hero-badge-txt { font-size:.72rem; color:#fff; font-weight:600; }

  /* ── STATS STRIP ── */
  .db-stats-strip {
    display:flex; gap:0; border-bottom:1px solid rgba(124,58,237,.15);
    background:rgba(0,0,0,.3); backdrop-filter:blur(12px); flex-shrink:0;
  }
  .db-stat-item {
    flex:1; padding:14px 12px; text-align:center;
    border-right:1px solid rgba(255,255,255,.05);
    transition:background .18s; cursor:default;
  }
  .db-stat-item:last-child { border-right:none; }
  .db-stat-item:hover { background:rgba(124,58,237,.08); }
  .db-stat-val  { font-size:1.1rem; font-weight:900; color:#fff; line-height:1; }
  .db-stat-lbl  { font-size:.62rem; color:rgba(255,255,255,.38); text-transform:uppercase; letter-spacing:.07em; font-weight:600; margin-top:3px; }
  .db-stat-chg  { font-size:.65rem; color:#a78bfa; font-weight:700; margin-top:2px; }

  /* ── BODY ── */
  .db-body { flex:1; padding:22px 20px 28px; max-width:720px; margin:0 auto; width:100%; }

  /* ── AVATAR + TITLE ── */
  .db-avatar {
    width:68px; height:68px; border-radius:50%;
    background:linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%);
    display:flex; align-items:center; justify-content:center; font-size:2rem;
    box-shadow:0 0 32px rgba(124,58,237,.6),0 0 70px rgba(124,58,237,.18);
    animation:dbPop .45s ease both, dbFloat 4.5s ease-in-out 1s infinite;
    margin:0 auto 14px; flex-shrink:0;
  }
  .db-title {
    font-size:clamp(1.3rem,5vw,1.7rem); font-weight:900; color:#fff;
    text-align:center; line-height:1.25; margin-bottom:6px;
    animation:dbFadeUp .5s ease .1s both;
  }
  .db-title span { color:#a78bfa; }
  .db-sub {
    color:rgba(255,255,255,.42); font-size:.82rem; text-align:center;
    line-height:1.65; max-width:300px; margin:0 auto 22px;
    animation:dbFadeUp .5s ease .18s both;
  }

  /* ── QUICK ACTIONS ── */
  .db-actions {
    display:flex; flex-direction:column; gap:9px;
    animation:dbFadeUp .5s ease .26s both; margin-bottom:26px;
  }
  .db-action-card {
    width:100%; display:flex; align-items:center; gap:14px;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.09);
    border-radius:13px; padding:13px 16px; cursor:pointer;
    transition:all .2s; font-family:inherit; color:#fff; text-align:left;
  }
  .db-action-card:hover {
    background:rgba(124,58,237,.18); border-color:rgba(124,58,237,.38);
    transform:translateX(3px);
  }
  .db-action-icon { font-size:1.4rem; flex-shrink:0; }
  .db-action-text { font-size:.87rem; font-weight:600; color:rgba(255,255,255,.82); }
  .db-action-arrow { margin-left:auto; color:rgba(255,255,255,.28); font-size:.85rem; flex-shrink:0; transition:transform .2s; }
  .db-action-card:hover .db-action-arrow { transform:translateX(3px); color:rgba(167,139,250,.7); }

  /* ── CHARTS ── */
  .db-charts { display:grid; grid-template-columns:1fr 1fr; gap:14px; animation:dbFadeUp .5s ease .34s both; }
  @media(max-width:600px){ .db-charts { grid-template-columns:1fr; } }
  .db-chart-card {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
    border-radius:16px; padding:16px 14px;
    backdrop-filter:blur(12px);
  }
  .db-chart-title { font-size:.78rem; font-weight:700; color:rgba(255,255,255,.75); margin-bottom:12px; }
`;

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [onlineCount, setOnlineCount] = useState(47);
  const [chatCount, setChatCount]     = useState(2341);

  useEffect(() => {
    const t = setInterval(() => {
      setOnlineCount(c => Math.max(30, Math.min(80, c + Math.floor(Math.random() * 7) - 3)));
      setChatCount(c => c + Math.floor(Math.random() * 5));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="db-page">

        {/* ── HERO BANNER ── */}
        <div className="db-hero">
          <img src="https://iili.io/f7nDq8X.jpg" alt="Nixx AI"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="db-hero-overlay" />
          <div className="db-hero-badge">
            <div className="db-hero-dot" />
            <span className="db-hero-badge-txt">Live Monitoring</span>
          </div>
          <div className="db-hero-text">
            <div className="db-hero-title">Nixx AI</div>
            <div className="db-hero-sub">Asisten AI gratis untuk semua</div>
          </div>
        </div>

        {/* ── STATS STRIP ── */}
        <div className="db-stats-strip">
          {[
            { val: "1.284", lbl: "Total User",   chg: "+12%" },
            { val: "148",   lbl: "Premium",       chg: "+8%"  },
            { val: String(onlineCount), lbl: "Online", chg: "Live" },
            { val: chatCount.toLocaleString(), lbl: "Chat Hari Ini", chg: "+24%" },
          ].map((s, i) => (
            <div key={i} className="db-stat-item">
              <div className="db-stat-val">{s.val}</div>
              <div className="db-stat-lbl">{s.lbl}</div>
              <div className="db-stat-chg">{s.chg}</div>
            </div>
          ))}
        </div>

        {/* ── BODY ── */}
        <div className="db-body">

          {/* Avatar + Title */}
          <div className="db-avatar">🧠</div>
          <h2 className="db-title">Halo! Ada yang bisa <span>dibantu?</span></h2>
          <p className="db-sub">Pilih salah satu menu di bawah atau navigasi lewat sidebar</p>

          {/* Quick Actions */}
          <div className="db-actions">
            {QUICK_ACTIONS.map((a, i) => (
              <button key={i} className="db-action-card" onClick={() => navigate(a.path)}>
                <span className="db-action-icon">{a.icon}</span>
                <span className="db-action-text">{a.text}</span>
                <span className="db-action-arrow">→</span>
              </button>
            ))}
          </div>

          {/* Charts */}
          <div className="db-charts">
            <div className="db-chart-card">
              <div className="db-chart-title">📈 Pendaftaran User (7 Hari)</div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={registrationData}>
                  <defs>
                    <linearGradient id="uGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
                  <XAxis dataKey="day" tick={{ fill:"#6b7280", fontSize:10 }} axisLine={false} />
                  <YAxis tick={{ fill:"#6b7280", fontSize:10 }} axisLine={false} />
                  <Tooltip contentStyle={{ background:"#0d0726", border:"1px solid #2d1170", borderRadius:10, color:"#fff", fontSize:12 }} />
                  <Area type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2} fill="url(#uGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="db-chart-card">
              <div className="db-chart-title">🛒 Pembelian Premium (6 Bln)</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={premiumData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
                  <XAxis dataKey="month" tick={{ fill:"#6b7280", fontSize:10 }} axisLine={false} />
                  <YAxis tick={{ fill:"#6b7280", fontSize:10 }} axisLine={false} />
                  <Tooltip contentStyle={{ background:"#0d0726", border:"1px solid #2d1170", borderRadius:10, color:"#fff", fontSize:12 }} />
                  <Bar dataKey="sales" fill="#a855f7" radius={[5,5,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
