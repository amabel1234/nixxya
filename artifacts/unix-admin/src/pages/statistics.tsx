import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";

const weeklyData = [
  { day: "Sen", users: 12, chats: 145, premium: 2 },
  { day: "Sel", users: 19, chats: 230, premium: 4 },
  { day: "Rab", users: 8, chats: 189, premium: 1 },
  { day: "Kam", users: 24, chats: 310, premium: 5 },
  { day: "Jum", users: 31, chats: 275, premium: 6 },
  { day: "Sab", users: 18, chats: 198, premium: 3 },
  { day: "Min", users: 27, chats: 342, premium: 7 },
];

const pieData = [
  { name: "Premium", value: 148, color: "#7c3aed" },
  { name: "Gratis", value: 1136, color: "#4b5563" },
];

const hourlyData = Array.from({length: 24}, (_, i) => ({
  hour: `${i.toString().padStart(2,"0")}:00`,
  active: Math.floor(Math.random() * 60) + (i >= 8 && i <= 22 ? 20 : 0),
}));

const topModels = [
  { model: "GPT-4o", count: 12450 }, { model: "Claude 3.5", count: 8930 },
  { model: "Gemini Pro", count: 7120 }, { model: "DeepSeek", count: 5680 },
  { model: "GPT-4o Mini", count: 4320 }, { model: "Llama 3.3", count: 3210 },
];

export default function StatisticsPage() {
  const [liveUsers, setLiveUsers] = useState(47);
  const [totalChats, setTotalChats] = useState(94821);
  const [period, setPeriod] = useState<"7d"|"30d">("7d");

  useEffect(() => {
    const iv = setInterval(() => {
      setLiveUsers(c => Math.max(20, Math.min(100, c + Math.floor(Math.random()*7)-3)));
      setTotalChats(c => c + Math.floor(Math.random()*3));
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Statistik</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Analitik lengkap platform UNIX AI</p>
        </div>
        <div className="flex gap-2">
          {(["7d","30d"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${period===p ? "bg-purple-600 text-white" : "bg-card border border-border text-muted-foreground hover:text-white"}`}>
              {p === "7d" ? "7 Hari" : "30 Hari"}
            </button>
          ))}
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "User Online Sekarang", value: liveUsers, unit: "", live: true, color: "text-green-400" },
          { label: "Total Chat Keseluruhan", value: totalChats.toLocaleString(), unit: "", live: true, color: "text-purple-400" },
          { label: "Pendapatan Bulan Ini", value: "Rp 4.2Jt", unit: "", live: false, color: "text-emerald-400" },
          { label: "Avg. Chat/User/Hari", value: "18.2", unit: " pesan", live: false, color: "text-cyan-400" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 card-glow">
            {s.live && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">Live</span>
              </div>
            )}
            <div className={`text-xl font-bold ${s.color}`}>{s.value}{s.unit}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User vs Chat chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">📈 User Baru & Chat Harian</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="uGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(260,18%,11%)", border: "1px solid hsl(260,15%,18%)", borderRadius: "12px", color: "#fff" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Area type="monotone" dataKey="users" name="User Baru" stroke="#7c3aed" strokeWidth={2} fill="url(#uGrad)" />
              <Area type="monotone" dataKey="chats" name="Total Chat" stroke="#06b6d4" strokeWidth={2} fill="url(#cGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-white mb-4 self-start">🥧 Distribusi User</h3>
          <PieChart width={180} height={180}>
            <Pie data={pieData} cx={90} cy={90} innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
              {pieData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="transparent" />)}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(260,18%,11%)", border: "1px solid hsl(260,15%,18%)", borderRadius: "12px", color: "#fff" }} />
          </PieChart>
          <div className="flex gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Models */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🤖 Model AI Terpopuler</h3>
          <div className="space-y-3">
            {topModels.map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground">{i+1}. {m.model}</span>
                  <span className="text-muted-foreground">{m.count.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400"
                    style={{ width: `${(m.count/topModels[0].count)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly activity */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">⏰ Aktivitas Per Jam (24 Jam)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={hourlyData} barSize={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} interval={3} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(260,18%,11%)", border: "1px solid hsl(260,15%,18%)", borderRadius: "12px", color: "#fff" }} />
              <Bar dataKey="active" name="User Aktif" fill="#7c3aed" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
