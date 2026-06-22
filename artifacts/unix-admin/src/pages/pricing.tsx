import { useState } from "react";
import { useToast } from "@/App";

interface PricingPlan { id: string; name: string; duration: string; price: number; features: string[]; popular?: boolean; }

export default function PricingPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<PricingPlan[]>([
    { id: "daily", name: "Harian", duration: "1 hari", price: 3000, features: ["Pesan unlimited 1 hari", "Akses semua model AI", "Prioritas respons"] },
    { id: "weekly", name: "Mingguan", duration: "7 hari", price: 15000, features: ["Pesan unlimited 7 hari", "Akses semua model AI", "Prioritas respons", "Simpan riwayat chat"] },
    { id: "monthly", name: "Bulanan", duration: "30 hari", price: 49000, popular: true, features: ["Pesan unlimited 30 hari", "Akses semua model AI", "Prioritas respons", "Simpan riwayat chat", "Karakter AI eksklusif"] },
    { id: "yearly", name: "Tahunan", duration: "365 hari", price: 399000, features: ["Pesan unlimited 1 tahun", "Akses semua model AI", "Prioritas VIP", "Simpan semua riwayat", "Karakter AI eksklusif", "Support prioritas"] },
  ]);

  const [editing, setEditing] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editFeature, setEditFeature] = useState("");
  const [newFeature, setNewFeature] = useState<{[k:string]: string}>({});

  const startEdit = (plan: PricingPlan) => {
    setEditing(plan.id);
    setEditPrice(plan.price.toString());
  };

  const saveEdit = (id: string) => {
    const price = parseInt(editPrice);
    if (isNaN(price) || price < 0) { showToast("Harga tidak valid!", "error"); return; }
    setPlans(p => p.map(x => x.id === id ? { ...x, price } : x));
    setEditing(null);
    showToast("Harga berhasil disimpan!", "success");
  };

  const removeFeature = (planId: string, fi: number) => {
    setPlans(p => p.map(x => x.id === planId ? { ...x, features: x.features.filter((_,i) => i !== fi) } : x));
  };

  const addFeature = (planId: string) => {
    const f = newFeature[planId]?.trim();
    if (!f) return;
    setPlans(p => p.map(x => x.id === planId ? { ...x, features: [...x.features, f] } : x));
    setNewFeature(prev => ({...prev, [planId]: ""}));
    showToast("Fitur ditambahkan", "success");
  };

  const formatPrice = (p: number) => `Rp ${p.toLocaleString("id-ID")}`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Harga Paket Premium</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Kelola harga dan fitur paket premium. Perubahan langsung realtime ke user.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {plans.map(plan => (
          <div key={plan.id} className={`bg-card border rounded-2xl p-5 card-glow relative ${plan.popular ? "border-purple-500/40" : "border-border"}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 text-white text-xs font-bold shadow-lg">
                🔥 Terpopuler
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.duration}</p>
              </div>
              <div className="text-right">
                {editing === plan.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rp</span>
                    <input
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      className="w-24 bg-muted border border-border rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                ) : (
                  <div className="text-xl font-bold text-white">{formatPrice(plan.price)}</div>
                )}
                <p className="text-xs text-muted-foreground">per {plan.duration}</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2 mb-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Fitur:</p>
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <span className="text-purple-400 text-xs">✓</span> {f}
                  </div>
                  <button onClick={() => removeFeature(plan.id, i)}
                    className="text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300">✕</button>
                </div>
              ))}
            </div>

            {/* Add feature */}
            <div className="flex gap-2 mb-4">
              <input
                value={newFeature[plan.id] || ""}
                onChange={e => setNewFeature(p => ({...p, [plan.id]: e.target.value}))}
                onKeyDown={e => e.key === "Enter" && addFeature(plan.id)}
                placeholder="+ Tambah fitur..."
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
              <button onClick={() => addFeature(plan.id)}
                className="px-2 py-1.5 rounded-lg text-xs bg-purple-600/20 text-purple-400 border border-purple-500/20 hover:bg-purple-600/30 transition-colors">
                +
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {editing === plan.id ? (
                <>
                  <button onClick={() => saveEdit(plan.id)}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-medium hover:from-purple-500 hover:to-purple-400 transition-all">
                    💾 Simpan
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs hover:text-white transition-colors">
                    Batal
                  </button>
                </>
              ) : (
                <button onClick={() => startEdit(plan)}
                  className="flex-1 py-2 rounded-xl bg-muted border border-border text-sm text-muted-foreground hover:text-white hover:border-purple-500/40 transition-all">
                  ✏️ Edit Harga
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4">
        <p className="text-sm text-purple-300 flex items-center gap-2">
          <span>⚡</span>
          <span>Perubahan harga langsung berlaku realtime ke halaman pembayaran user tanpa perlu restart server.</span>
        </p>
      </div>
    </div>
  );
}
