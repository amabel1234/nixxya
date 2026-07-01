import React, { useState, useEffect } from "react";
  import { useLocation } from "wouter";
  import { Show } from "@clerk/react";
  import { useUserInfo } from "@/hooks/use-user-info";
  import { useQueryClient } from "@tanstack/react-query";

  interface Plan {
    id: string; name: string; duration: string; price: number;
    popular?: boolean; features?: string[];
  }
  interface PaySettings { plans: Plan[]; qrisLink: string; danaNumber: string; danaName: string; }

  const DEFAULTS: PaySettings = {
    plans: [
      { id: "monthly",   name: "Bulanan", duration: "30 hari",  price: 15000, popular: false },
      { id: "quarterly", name: "3 Bulan", duration: "90 hari",  price: 40000, popular: true  },
      { id: "yearly",    name: "Tahunan", duration: "365 hari", price: 120000, popular: false },
    ],
    qrisLink: "", danaNumber: "", danaName: "Nixx AI",
  };

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const fmt = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

  export default function PremiumPage() {
    const [, navigate] = useLocation();
    const { data: userInfo } = useUserInfo();
    const queryClient = useQueryClient();

    const [settings, setSettings] = useState<PaySettings>(DEFAULTS);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [qrisRef, setQrisRef] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
      fetch("/api/settings", { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.plans?.length) setSettings(d); })
        .catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPlan) return;
      if (!name.trim() || !phone.trim()) { setError("Nama dan nomor HP wajib diisi"); return; }
      setLoading(true); setError("");
      try {
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: name.trim(), phone: phone.trim(), amount: selectedPlan.price, qrisRef: qrisRef.trim() || null }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Gagal mengirim"); }
        setSubmitted(true);
        queryClient.invalidateQueries({ queryKey: ["user-info"] });
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    };

    if (userInfo?.isPremium) return (
      <div className="nx-page-center">
        <div className="nx-premium-card">
          <div className="nx-premium-active">
            <div className="nx-premium-active-icon">🎉</div>
            <h2>Kamu sudah Premium!</h2>
            {userInfo.premiumUntil && (
              <p>Aktif hingga: <strong>{new Date(userInfo.premiumUntil).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}</strong></p>
            )}
            <button className="nx-start-btn" onClick={() => navigate(`${basePath}/chat`)}>Mulai Chat →</button>
          </div>
        </div>
      </div>
    );

    if (submitted) return (
      <div className="nx-page-center">
        <div className="nx-premium-card">
          <div className="nx-premium-success">
            <div className="nx-premium-active-icon">✅</div>
            <h2>Pembayaran Terkirim!</h2>
            <p>Tim kami akan memverifikasi dalam <strong>1×24 jam</strong>.</p>
            <button className="nx-start-btn" onClick={() => navigate(`${basePath}/chat`)}>Kembali ke Chat</button>
          </div>
        </div>
      </div>
    );

    // ── Step 1: Plan Selection ────────────────────────────────────────────────
    if (!selectedPlan) return (
      <div className="nx-page-center">
        <Show when="signed-out">{(() => { navigate(`${basePath}/`); return null; })()}</Show>
        <div className="nx-premium-card">
          <div className="nx-premium-header">
            <div className="nx-premium-badge">✨ PREMIUM</div>
            <h1 className="nx-premium-title">Pilih Paket Premium</h1>
            <p className="nx-premium-subtitle">Pesan unlimited · Semua model AI · Aktivasi cepat</p>
          </div>

          <div className="nx-plans-grid">
            {settings.plans.map(plan => (
              <button key={plan.id} className={`nx-plan-card ${plan.popular ? "nx-plan-popular" : ""}`} onClick={() => setSelectedPlan(plan)}>
                {plan.popular && <div className="nx-plan-badge">TERBAIK</div>}
                <div className="nx-plan-name">{plan.name}</div>
                <div className="nx-plan-duration">{plan.duration}</div>
                <div className="nx-plan-price">{fmt(plan.price)}</div>
                {plan.features?.map((f, i) => <div key={i} className="nx-plan-feature">✅ {f}</div>)}
                <div className="nx-plan-action">Pilih →</div>
              </button>
            ))}
          </div>

          <button className="nx-back-btn" onClick={() => navigate(`${basePath}/chat`)}>← Kembali ke Chat</button>
        </div>
      </div>
    );

    // ── Step 2: Payment ───────────────────────────────────────────────────────
    return (
      <div className="nx-page-center">
        <div className="nx-premium-card">
          <div className="nx-premium-header">
            <div className="nx-premium-badge">💳 BAYAR</div>
            <h1 className="nx-premium-title">Paket {selectedPlan.name}</h1>
            <p className="nx-premium-subtitle">{selectedPlan.duration} · {fmt(selectedPlan.price)}</p>
          </div>

          <div className="nx-qris-section">
            <h3>Bayar via QRIS / Dana</h3>
            {settings.qrisLink ? (
              <div className="nx-qris-img-wrap">
                <img src={settings.qrisLink} alt="QRIS Dana" className="nx-qris-img"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            ) : (
              <div className="nx-qris-placeholder">
                <div className="nx-qris-icon">📱</div>
                <p>Transfer via Dana</p>
              </div>
            )}
            {(settings.danaNumber || settings.danaName) && (
              <div className="nx-dana-info">
                {settings.danaName && <span className="nx-dana-name">a.n. {settings.danaName}</span>}
                {settings.danaNumber && <span className="nx-dana-number">{settings.danaNumber}</span>}
                <span className="nx-qris-amount">{fmt(selectedPlan.price)}</span>
              </div>
            )}
          </div>

          <form className="nx-premium-form" onSubmit={handleSubmit}>
            <h3>Konfirmasi Pembayaran</h3>
            <p className="nx-form-note">Setelah transfer, isi form ini agar admin bisa verifikasi akunmu</p>
            <div className="nx-form-group">
              <label>Nama Lengkap *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama sesuai akun Dana" required />
            </div>
            <div className="nx-form-group">
              <label>Nomor HP Dana *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Nomor HP yang dipakai Dana" required />
            </div>
            <div className="nx-form-group">
              <label>Referensi Transfer (opsional)</label>
              <input type="text" value={qrisRef} onChange={e => setQrisRef(e.target.value)} placeholder="Kode transaksi dari Dana" />
            </div>
            {error && <div className="nx-form-error">⚠️ {error}</div>}
            <button type="submit" className="nx-start-btn" disabled={loading}>{loading ? "Mengirim..." : "📤 Konfirmasi Pembayaran"}</button>
          </form>

          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <button className="nx-back-btn" onClick={() => setSelectedPlan(null)} style={{ flex:1 }}>← Ganti Paket</button>
            <button className="nx-back-btn" onClick={() => navigate(`${basePath}/chat`)} style={{ flex:1 }}>← Chat</button>
          </div>
        </div>
      </div>
    );
  }
  