import React, { useState, useEffect } from "react";

  interface Plan { id: string; name: string; duration: string; price: number; popular?: boolean; }
  interface Settings { plans: Plan[]; qrisLink: string; danaNumber: string; danaName: string; }
  interface Props { showPricing: boolean; onClose: () => void; onUpgrade: () => void; onBack: () => void; }

  const DEFAULTS: Settings = {
    plans: [
      { id: "daily",   name: "1 Hari",   duration: "1 hari",  price: 3000,  popular: false },
      { id: "weekly",  name: "1 Minggu", duration: "7 hari",  price: 15000, popular: true  },
      { id: "monthly", name: "1 Bulan",  duration: "30 hari", price: 45000, popular: false },
    ],
    qrisLink: "", danaNumber: "", danaName: "Nixx AI",
  };

  const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  export function LimitModal({ showPricing, onClose, onUpgrade, onBack }: Props) {
    const [step, setStep] = useState<0|1|2|3>(0);
    const [settings, setSettings] = useState<Settings>(DEFAULTS);
    const [selected, setSelected] = useState<Plan | null>(null);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [ref_, setRef] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
      // Fetch admin settings dari API, fallback ke localStorage
      fetch("/api/settings")
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.plans?.length) {
            setSettings(d);
          } else throw new Error("no plans");
        })
        .catch(() => {
          try {
            const lsP = JSON.parse(localStorage.getItem("nx-pricing") ?? "null");
            const lsCfg = JSON.parse(localStorage.getItem("nx-pay-config") ?? "null");
            setSettings({
              plans: lsP?.length ? lsP : DEFAULTS.plans,
              qrisLink: lsCfg?.qr ?? "",
              danaNumber: lsCfg?.danaNumber ?? "",
              danaName: lsCfg?.danaName ?? "Nixx AI",
            });
          } catch {}
        });
    }, []);

    useEffect(() => { if (showPricing) setStep(1); }, [showPricing]);

    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !phone.trim()) { setError("Nama dan nomor HP wajib diisi"); return; }
      setLoading(true); setError("");
      try {
        await fetch("/api/payments/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), phone: phone.trim(), planName: selected?.name, amount: selected?.price, qrisRef: ref_.trim() || null }),
        });
      } catch {}
      setStep(3);
      setLoading(false);
    };

    const overlay: React.CSSProperties = { position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)" };
    const card: React.CSSProperties = { background:"#13111e",border:"1.5px solid rgba(168,85,247,0.5)",borderRadius:24,padding:"28px 20px 24px",maxWidth:380,width:"100%",textAlign:"center",boxShadow:"0 24px 80px rgba(168,85,247,0.35)",maxHeight:"92vh",overflowY:"auto" };
    const pBtn: React.CSSProperties = { display:"block",width:"100%",background:"linear-gradient(135deg,#a855f7,#7c3aed)",color:"#fff",fontWeight:700,fontSize:15,padding:14,borderRadius:14,border:"none",cursor:"pointer",marginBottom:10,boxShadow:"0 4px 20px rgba(168,85,247,0.4)" };
    const sBtn: React.CSSProperties = { display:"block",width:"100%",background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.1)",color:"#a78bfa",fontWeight:600,fontSize:14,padding:12,borderRadius:14,cursor:"pointer" };
    const inp: React.CSSProperties = { width:"100%",padding:"11px 14px",background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(168,85,247,0.3)",borderRadius:12,color:"#f0eeff",fontSize:14,boxSizing:"border-box",marginBottom:10,outline:"none" };
    const lbl: React.CSSProperties = { display:"block",textAlign:"left",color:"#a78bfa",fontSize:12,marginBottom:4,fontWeight:600 };

    return (
      <div style={overlay} onClick={onClose}>
        <div style={card} onClick={e => e.stopPropagation()}>

          {/* ── Step 0: Limit habis ── */}
          {step === 0 && <>
            <div style={{fontSize:56,marginBottom:10}}>👑</div>
            <h2 style={{fontSize:"1.25rem",fontWeight:800,color:"#f0eeff",margin:"0 0 10px"}}>Limit Harian Habis!</h2>
            <p style={{color:"#a78bfa",fontSize:14,lineHeight:1.6,margin:"0 0 22px"}}>
              Kamu sudah mencapai batas pesan gratis hari ini.<br/>Upgrade ke Premium untuk kirim pesan unlimited!
            </p>
            <button style={pBtn} onClick={() => { setStep(1); onUpgrade(); }}>✨ Upgrade ke Premium</button>
            <button style={sBtn} onClick={onClose}>Lanjut Gratis</button>
          </>}

          {/* ── Step 1: Pilih Paket ── */}
          {step === 1 && <>
            <div style={{fontSize:40,marginBottom:8}}>✨</div>
            <h2 style={{fontSize:"1.1rem",fontWeight:800,color:"#f0eeff",margin:"0 0 4px"}}>Pilih Paket Premium</h2>
            <p style={{color:"#7b6fa0",fontSize:12,margin:"0 0 16px"}}>Pesan unlimited · Semua model AI · Aktivasi cepat</p>
            {settings.plans.map(plan => (
              <button key={plan.id} onClick={() => { setSelected(plan); setStep(2); }} style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",
                background:"rgba(168,85,247,0.08)",
                border: plan.popular ? "1.5px solid rgba(168,85,247,0.7)" : "1.5px solid rgba(168,85,247,0.25)",
                borderRadius:14,padding:"13px 16px",marginBottom:10,cursor:"pointer",
              }}>
                <div style={{textAlign:"left"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontWeight:700,fontSize:14,color:"#f0eeff"}}>{plan.name}</span>
                    {plan.popular && <span style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:6}}>TERBAIK</span>}
                  </div>
                  <div style={{fontSize:11,color:"#7b6fa0",marginTop:2}}>{plan.duration} · Bayar QRIS / Dana</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:800,fontSize:15,color:"#c084fc"}}>{fmt(plan.price)}</div>
                </div>
              </button>
            ))}
            <button style={{background:"none",border:"none",color:"#7b6fa0",fontSize:13,cursor:"pointer",padding:8,marginTop:4}} onClick={() => { setStep(0); onBack(); }}>← Kembali</button>
          </>}

          {/* ── Step 2: Info Bayar + Form ── */}
          {step === 2 && selected && <>
            <div style={{fontSize:32,marginBottom:8}}>💳</div>
            <h2 style={{fontSize:"1rem",fontWeight:800,color:"#f0eeff",margin:"0 0 2px"}}>Bayar Paket {selected.name}</h2>
            <p style={{color:"#a78bfa",fontSize:13,margin:"0 0 14px"}}>{selected.duration} · <strong style={{color:"#c084fc"}}>{fmt(selected.price)}</strong></p>

            {/* QRIS image */}
            {settings.qrisLink && (
              <div style={{marginBottom:12}}>
                <img src={settings.qrisLink} alt="QRIS" style={{maxWidth:200,width:"100%",borderRadius:12,border:"1.5px solid rgba(168,85,247,0.35)"}}
                  onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
              </div>
            )}

            {/* Dana info */}
            {(settings.danaNumber || settings.danaName) && (
              <div style={{background:"rgba(168,85,247,0.08)",border:"1.5px solid rgba(168,85,247,0.25)",borderRadius:12,padding:"10px 14px",marginBottom:14}}>
                <div style={{fontSize:11,color:"#7b6fa0",marginBottom:4}}>Transfer Dana ke:</div>
                {settings.danaName && <div style={{fontWeight:700,color:"#f0eeff",fontSize:14}}>{settings.danaName}</div>}
                {settings.danaNumber && <div style={{fontWeight:800,color:"#c084fc",fontSize:17,letterSpacing:"0.04em",margin:"2px 0"}}>{settings.danaNumber}</div>}
                <div style={{fontWeight:800,color:"#a855f7",fontSize:18,marginTop:6}}>{fmt(selected.price)}</div>
              </div>
            )}

            <p style={{color:"#7b6fa0",fontSize:12,margin:"0 0 12px"}}>Setelah transfer, isi form konfirmasi di bawah ↓</p>
            <form onSubmit={submit}>
              <label style={lbl}>Nama Lengkap *</label>
              <input style={inp} type="text" placeholder="Nama sesuai akun Dana" value={name} onChange={e=>setName(e.target.value)} required />
              <label style={lbl}>Nomor HP Dana *</label>
              <input style={inp} type="tel" placeholder="Nomor HP yang dipakai Dana" value={phone} onChange={e=>setPhone(e.target.value)} required />
              <label style={lbl}>Referensi Transaksi (opsional)</label>
              <input style={inp} type="text" placeholder="Kode transaksi dari Dana" value={ref_} onChange={e=>setRef(e.target.value)} />
              {error && <div style={{color:"#f87171",fontSize:12,marginBottom:8,textAlign:"left"}}>⚠️ {error}</div>}
              <button type="submit" style={{...pBtn, opacity: loading ? 0.7 : 1}} disabled={loading}>
                {loading ? "Mengirim..." : "📤 Konfirmasi Pembayaran"}
              </button>
            </form>
            <button style={{background:"none",border:"none",color:"#7b6fa0",fontSize:13,cursor:"pointer",padding:8}} onClick={() => setStep(1)}>← Ganti Paket</button>
          </>}

          {/* ── Step 3: Sukses ── */}
          {step === 3 && <>
            <div style={{fontSize:56,marginBottom:10}}>✅</div>
            <h2 style={{fontSize:"1.1rem",fontWeight:800,color:"#f0eeff",margin:"0 0 10px"}}>Pembayaran Terkirim!</h2>
            <p style={{color:"#a78bfa",fontSize:14,lineHeight:1.6,margin:"0 0 22px"}}>
              Konfirmasimu sudah diterima. Admin akan verifikasi dalam <strong>1×24 jam</strong> dan akun kamu diaktifkan Premium.
            </p>
            <button style={pBtn} onClick={onClose}>Oke, Lanjutkan</button>
          </>}

        </div>
      </div>
    );
  }
  