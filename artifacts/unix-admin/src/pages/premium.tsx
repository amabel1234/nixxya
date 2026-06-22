import { useState } from "react";
import { useToast } from "@/App";

const premiumUsers = [
  { id: "U001", name: "Budi Santoso", email: "budi@gmail.com", plan: "Bulanan", expiry: "2024-04-15", revenue: "Rp 49.000", active: true },
  { id: "U003", name: "Ahmad Fauzi", email: "ahmad@yahoo.com", plan: "Tahunan", expiry: "2025-01-08", revenue: "Rp 399.000", active: true },
  { id: "U005", name: "Eko Prasetyo", email: "eko@gmail.com", plan: "Mingguan", expiry: "2024-03-30", revenue: "Rp 15.000", active: true },
  { id: "U008", name: "Rudi Hartono", email: "rudi@outlook.com", plan: "Bulanan", expiry: "2024-04-01", revenue: "Rp 49.000", active: true },
  { id: "U012", name: "Wulan Dari", email: "wulan@gmail.com", plan: "Harian", expiry: "2024-03-27", revenue: "Rp 3.000", active: false },
  { id: "U015", name: "Yoga Pratama", email: "yoga@gmail.com", plan: "Bulanan", expiry: "2024-04-20", revenue: "Rp 49.000", active: true },
];

export default function PremiumPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState(premiumUsers);

  const totalRevenue = 4200000;
  const activeCount = users.filter(u => u.active).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Premium</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Kelola pengguna premium dan langganan aktif</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 card-glow">
          <div className="text-2xl font-bold text-white">{activeCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Premium Aktif</div>
          <div className="mt-2 text-xs text-purple-400">✨ Berlangganan sekarang</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 card-glow">
          <div className="text-2xl font-bold text-white">Rp {(totalRevenue/1000000).toFixed(1)}Jt</div>
          <div className="text-xs text-muted-foreground mt-0.5">Pendapatan Bulan Ini</div>
          <div className="mt-2 text-xs text-green-400">+31% dari bulan lalu</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 card-glow">
          <div className="text-2xl font-bold text-white">35</div>
          <div className="text-xs text-muted-foreground mt-0.5">Transaksi Bulan Ini</div>
          <div className="mt-2 text-xs text-cyan-400">+15% dari bulan lalu</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Daftar User Premium</h3>
          <button onClick={() => showToast("Export berhasil!", "success")}
            className="px-3 py-1.5 rounded-lg text-xs bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/20 transition-colors">
            📥 Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">USER</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">PAKET</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">BERLAKU HINGGA</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">BAYAR</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">STATUS</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-premium">{u.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{u.expiry}</td>
                  <td className="px-4 py-3 text-sm text-green-400 font-medium">{u.revenue}</td>
                  <td className="px-4 py-3">
                    <span className={u.active ? "badge-online" : "badge-suspended"}>
                      {u.active ? "✓ Aktif" : "✕ Expired"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => showToast("Langganan diperpanjang!", "success")}
                        className="px-2 py-1 rounded-lg text-xs text-purple-400 hover:bg-purple-500/10 transition-colors">🔄 Perpanjang</button>
                      <button onClick={() => {
                        setUsers(prev => prev.filter(x => x.id !== u.id));
                        showToast("Premium dicabut", "error");
                      }}
                        className="px-2 py-1 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors">❌ Cabut</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
