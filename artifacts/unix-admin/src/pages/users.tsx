import { useState } from "react";
import { useToast } from "@/App";

interface User {
  id: string; name: string; email: string; status: "premium"|"free"|"suspended";
  chatCount: number; registerDate: string; lastOnline: string; isPremium: boolean;
}

const initialUsers: User[] = [
  { id: "U001", name: "Budi Santoso", email: "budi@gmail.com", status: "premium", chatCount: 1243, registerDate: "2024-01-15", lastOnline: "2 menit lalu", isPremium: true },
  { id: "U002", name: "Siti Rahayu", email: "siti@gmail.com", status: "free", chatCount: 87, registerDate: "2024-02-20", lastOnline: "15 menit lalu", isPremium: false },
  { id: "U003", name: "Ahmad Fauzi", email: "ahmad@yahoo.com", status: "premium", chatCount: 654, registerDate: "2024-01-08", lastOnline: "1 jam lalu", isPremium: true },
  { id: "U004", name: "Dewi Lestari", email: "dewi@gmail.com", status: "free", chatCount: 32, registerDate: "2024-03-10", lastOnline: "2 jam lalu", isPremium: false },
  { id: "U005", name: "Eko Prasetyo", email: "eko@gmail.com", status: "premium", chatCount: 890, registerDate: "2024-01-22", lastOnline: "3 jam lalu", isPremium: true },
  { id: "U006", name: "Rina Wati", email: "rina@gmail.com", status: "suspended", chatCount: 12, registerDate: "2024-02-14", lastOnline: "5 hari lalu", isPremium: false },
  { id: "U007", name: "Dian Permata", email: "dian@gmail.com", status: "free", chatCount: 156, registerDate: "2024-03-05", lastOnline: "30 menit lalu", isPremium: false },
  { id: "U008", name: "Rudi Hartono", email: "rudi@outlook.com", status: "premium", chatCount: 2341, registerDate: "2023-12-01", lastOnline: "Sekarang", isPremium: true },
  { id: "U009", name: "Maya Indah", email: "maya@gmail.com", status: "free", chatCount: 445, registerDate: "2024-02-28", lastOnline: "4 jam lalu", isPremium: false },
  { id: "U010", name: "Hendra Wijaya", email: "hendra@gmail.com", status: "free", chatCount: 78, registerDate: "2024-03-20", lastOnline: "1 hari lalu", isPremium: false },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"premium"|"free"|"suspended">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const { showToast } = useToast();

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || u.status === filter;
    return matchSearch && matchFilter;
  });

  const handleSuspend = (id: string) => {
    setUsers(u => u.map(user => user.id === id
      ? { ...user, status: user.status === "suspended" ? "free" : "suspended" }
      : user));
    showToast("Status user diperbarui", "success");
  };

  const handleDelete = (id: string) => {
    setUsers(u => u.filter(user => user.id !== id));
    showToast("User dihapus", "error");
  };

  const handleResetLimit = (id: string) => {
    showToast("Limit chat user direset", "info");
  };

  const handleUpgrade = (id: string) => {
    setUsers(u => u.map(user => user.id === id
      ? { ...user, status: "premium", isPremium: true }
      : user));
    showToast("User di-upgrade ke Premium!", "success");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen User</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{users.length} total pengguna terdaftar</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Realtime
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau UID..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
        <div className="flex gap-2">
          {(["all","premium","free","suspended"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                filter === f
                  ? "bg-purple-600 text-white"
                  : "bg-card border border-border text-muted-foreground hover:text-white"
              }`}>
              {f === "all" ? "Semua" : f === "premium" ? "Premium" : f === "free" ? "Gratis" : "Suspended"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">USER</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">UID</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">STATUS</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">CHAT</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">DAFTAR</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">ONLINE</th>
                <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{u.id}</td>
                  <td className="px-4 py-3">
                    <span className={
                      u.status === "premium" ? "badge-premium" :
                      u.status === "suspended" ? "badge-suspended" : "badge-free"
                    }>
                      {u.status === "premium" ? "✨ Premium" : u.status === "suspended" ? "⛔ Suspended" : "🆓 Gratis"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{u.chatCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.registerDate}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.lastOnline}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {!u.isPremium && u.status !== "suspended" && (
                        <button onClick={() => handleUpgrade(u.id)}
                          className="px-2 py-1 rounded-lg text-xs text-purple-400 hover:bg-purple-500/10 transition-colors" title="Upgrade Premium">
                          ⬆️
                        </button>
                      )}
                      <button onClick={() => handleResetLimit(u.id)}
                        className="px-2 py-1 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/10 transition-colors" title="Reset Limit">
                        🔄
                      </button>
                      <button onClick={() => handleSuspend(u.id)}
                        className={`px-2 py-1 rounded-lg text-xs transition-colors ${u.status === "suspended" ? "text-green-400 hover:bg-green-500/10" : "text-yellow-400 hover:bg-yellow-500/10"}`}
                        title={u.status === "suspended" ? "Aktifkan" : "Suspend"}>
                        {u.status === "suspended" ? "✅" : "⛔"}
                      </button>
                      <button onClick={() => handleDelete(u.id)}
                        className="px-2 py-1 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors" title="Hapus">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">Tidak ada user ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Menampilkan {filtered.length} dari {users.length} user</p>
        </div>
      </div>
    </div>
  );
}
