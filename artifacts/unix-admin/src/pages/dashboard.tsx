import { useState, useEffect } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

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

interface Stat { label: string; value: string; sub: string; icon: string; color: string; change: string; }

const stats: Stat[] = [
  { label: "Total User", value: "1,284", sub: "Semua pengguna terdaftar", icon: "👥", color: "from-blue-600 to-blue-500", change: "+12%" },
  { label: "User Premium", value: "148", sub: "11.5% dari total user", icon: "✨", color: "from-purple-600 to-purple-500", change: "+8%" },
  { label: "User Gratis", value: "1,136", sub: "Pengguna paket gratis", icon: "🆓", color: "from-indigo-600 to-indigo-500", change: "+13%" },
  { label: "Chat Hari Ini", value: "2,341", sub: "Pesan dikirim hari ini", icon: "💬", color: "from-cyan-600 to-cyan-500", change: "+24%" },
  { label: "Total Chat", value: "94,821", sub: "Semua pesan sejak awal", icon: "📨", color: "from-teal-600 to-teal-500", change: "+19%" },
  { label: "Pendapatan", value: "Rp 4,2Jt", sub: "Pendapatan bulan ini", icon: "💰", color: "from-green-600 to-green-500", change: "+31%" },
  { label: "Pembelian Premium", value: "35", sub: "Transaksi bulan ini", icon: "🛒", color: "from-orange-600 to-orange-500", change: "+15%" },
  { label: "User Online", value: "47", sub: "Aktif sekarang", icon: "🟢", color: "from-emerald-600 to-emerald-500", change: "Live" },
];

const recentUsers = [
  { name: "Budi Santoso", email: "budi@gmail.com", status: "premium", date: "2 menit lalu" },
  { name: "Siti Rahayu", email: "siti@gmail.com", status: "free", date: "15 menit lalu" },
  { name: "Ahmad Fauzi", email: "ahmad@yahoo.com", status: "premium", date: "1 jam lalu" },
  { name: "Dewi Lestari", email: "dewi@gmail.com", status: "free", date: "2 jam lalu" },
  { name: "Eko Prasetyo", email: "eko@gmail.com", status: "premium", date: "3 jam lalu" },
];

export default function DashboardPage() {
  const [onlineCount, setOnlineCount] = useState(47);
  const [chatCount, setChatCount] = useState(2341);
  const [userCount, setUserCount] = useState(1284);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(c => Math.max(30, Math.min(80, c + Math.floor(Math.random() * 7) - 3)));
      setChatCount(c => c + Math.floor(Math.random() * 5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Selamat datang kembali, Super Admin</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Live Monitoring</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 card-glow cursor-default group">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg shadow-lg`}>
                {s.icon}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.change === "Live" ? "bg-green-500/10 text-green-400" : "bg-purple-500/10 text-purple-400"}`}>
                {s.change}
              </span>
            </div>
            <div className="text-xl font-bold text-white">
              {s.label === "User Online" ? onlineCount : s.label === "Chat Hari Ini" ? chatCount.toLocaleString() : s.value}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">📈 Pendaftaran User (7 Hari)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={registrationData}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(260,18%,11%)", border: "1px solid hsl(260,15%,18%)", borderRadius: "12px", color: "#fff" }} />
              <Area type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2} fill="url(#userGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">💬 Chat Harian (7 Hari)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chatData}>
              <defs>
                <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(260,18%,11%)", border: "1px solid hsl(260,15%,18%)", borderRadius: "12px", color: "#fff" }} />
              <Area type="monotone" dataKey="chats" stroke="#06b6d4" strokeWidth={2} fill="url(#chatGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🛒 Pembelian Premium (6 Bulan)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={premiumData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(260,18%,11%)", border: "1px solid hsl(260,15%,18%)", borderRadius: "12px", color: "#fff" }} />
              <Bar dataKey="sales" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Users */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🆕 User Terbaru</h3>
          <div className="space-y-3">
            {recentUsers.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {u.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={u.status === "premium" ? "badge-premium" : "badge-free"}>
                    {u.status === "premium" ? "Premium" : "Gratis"}
                  </span>
                  <span className="text-xs text-muted-foreground">{u.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
