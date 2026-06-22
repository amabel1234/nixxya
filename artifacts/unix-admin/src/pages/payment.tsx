import { useState } from "react";
import { useToast } from "@/App";

interface PaymentMethod {
  id: string; name: string; type: string; icon: string;
  active: boolean; qrisLink?: string; logoUrl?: string; bankNo?: string;
}

const initialMethods: PaymentMethod[] = [
  { id: "qris", name: "QRIS Statis", type: "qris", icon: "📱", active: true, qrisLink: "https://qris.example.com/unix" },
  { id: "dana", name: "DANA", type: "ewallet", icon: "💙", active: true, bankNo: "081234567890" },
  { id: "ovo", name: "OVO", type: "ewallet", icon: "💜", active: false, bankNo: "081234567890" },
  { id: "bca", name: "BCA Transfer", type: "bank", icon: "🏦", active: true, bankNo: "1234567890" },
  { id: "bri", name: "BRI Transfer", type: "bank", icon: "🏦", active: true, bankNo: "0987654321" },
  { id: "mandiri", name: "Mandiri Transfer", type: "bank", icon: "🏦", active: false, bankNo: "1122334455" },
];

export default function PaymentPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods);
  const [showAddQris, setShowAddQris] = useState(false);
  const [newQris, setNewQris] = useState({ name: "", link: "" });
  const { showToast } = useToast();

  const toggle = (id: string) => {
    setMethods(m => m.map(x => x.id === id ? { ...x, active: !x.active } : x));
    showToast("Metode pembayaran diperbarui", "success");
  };

  const addQris = () => {
    if (!newQris.name || !newQris.link) { showToast("Isi nama dan link QRIS!", "error"); return; }
    const newM: PaymentMethod = {
      id: `qris-${Date.now()}`, name: newQris.name, type: "qris", icon: "📱",
      active: true, qrisLink: newQris.link
    };
    setMethods(m => [...m, newM]);
    setNewQris({ name: "", link: "" });
    setShowAddQris(false);
    showToast("QRIS berhasil ditambahkan!", "success");
  };

  const activeCount = methods.filter(m => m.active).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Metode Pembayaran</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{activeCount} metode aktif dari {methods.length} total</p>
        </div>
        <button onClick={() => setShowAddQris(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium hover:from-purple-500 hover:to-purple-400 transition-all glow-purple-sm">
          + Tambah QRIS
        </button>
      </div>

      {/* QRIS Dynamic Section */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">📱 QRIS Dinamis</h3>
        <p className="text-xs text-muted-foreground mb-4">Admin bisa tambah QRIS baru — otomatis tampil ke halaman pembayaran user</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1.5 block">Nama QRIS</label>
            <input value={newQris.name} onChange={e => setNewQris(p => ({...p, name: e.target.value}))}
              placeholder="Contoh: QRIS BNI"
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
          </div>
          <div className="flex flex-col justify-end">
            <button onClick={addQris}
              className="w-full py-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/20 text-sm hover:bg-purple-600/30 transition-colors">
              Tambah
            </button>
          </div>
          <div className="col-span-3 sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1.5 block">Link / Kode QRIS</label>
            <input value={newQris.link} onChange={e => setNewQris(p => ({...p, link: e.target.value}))}
              placeholder="https://qris.id/..."
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
          </div>
        </div>
      </div>

      {/* Methods List */}
      <div className="space-y-3">
        {["qris", "ewallet", "bank"].map(type => (
          <div key={type} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-white capitalize">
                {type === "qris" ? "📱 QRIS" : type === "ewallet" ? "💳 E-Wallet" : "🏦 Transfer Bank"}
              </h3>
            </div>
            <div className="divide-y divide-border">
              {methods.filter(m => m.type === type).map(m => (
                <div key={m.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.type === "qris" ? m.qrisLink?.slice(0, 40) + "..." : m.bankNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${m.active ? "text-green-400" : "text-muted-foreground"}`}>
                      {m.active ? "Aktif" : "Nonaktif"}
                    </span>
                    <button onClick={() => toggle(m.id)}
                      className={`relative w-10 h-5 rounded-full transition-all duration-200 ${m.active ? "bg-purple-600" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${m.active ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
