import React, { useState, useEffect } from "react";
  import { useAuth } from "@/context/AuthContext";
  import { useLocation } from "wouter";

  interface PremiumConfig {
    premiumPrice: number;
    dailyFreeLimit: number;
    qrisUrl: string;
    danaNumber: string;
    danaName: string;
  }

  const CSS = `
  .px-bg{min-height:100vh;background:#070711;color:#e2e8f0;font-family:'Inter',system-ui,sans-serif;padding:24px 16px;display:flex;flex-direction:column;align-items:center;}
  .px-back{align-self:flex-start;background:transparent;border:1px solid #334155;border-radius:8px;padding:8px 14px;color:#94a3b8;font-size:13px;cursor:pointer;margin-bottom:28px;display:flex;align-items:center;gap:6px;}
  .px-back:hover{border-color:#6366f1;color:#a78bfa;}
  .px-wrap{max-width:480px;width:100%;}
  .px-header{text-align:center;margin-bottom:32px;}
  .px-crown{font-size:52px;margin-bottom:12px;}
  .px-title{font-size:26px;font-weight:800;color:#fff;}
  .px-sub{font-size:14px;color:#64748b;margin-top:6px;}
  .px-price-tag{display:inline-block;margin-top:12px;padding:10px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:30px;font-size:22px;font-weight:800;color:#fff;}
  .px-benefits{background:#13131f;border:1px solid #1e293b;border-radius:14px;padding:20px;margin-bottom:20px;}
  .px-benefit{display:flex;align-items:center;gap:10px;padding:8px 0;font-size:14px;border-bottom:1px solid #0d1117;}
  .px-benefit:last-child{border:none;}
  .px-benefit-icon{font-size:18px;width:24px;text-align:center;}
  .px-qris-card{background:#13131f;border:2px solid #6366f1;border-radius:16px;padding:24px;margin-bottom:20px;text-align:center;}
  .px-qris-title{font-size:16px;font-weight:700;margin-bottom:4px;}
  .px-qris-sub{font-size:13px;color:#64748b;margin-bottom:16px;}
  .px-qris-img{max-width:220px;width:100%;border-radius:12px;border:1px solid #334155;margin:0 auto 16px;display:block;}
  .px-qris-placeholder{width:220px;height:220px;background:#1e293b;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 16px;border:2px dashed #334155;color:#475569;font-size:13px;gap:8px;}
  .px-dana-box{background:#1e293b;border-radius:10px;padding:14px 16px;text-align:left;}
  .px-dana-lbl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;}
  .px-dana-num{font-size:18px;font-weight:700;color:#fff;letter-spacing:.03em;}
  .px-dana-name{font-size:13px;color:#94a3b8;margin-top:2px;}
  .px-form-card{background:#13131f;border:1px solid #1e293b;border-radius:14px;padding:24px;}
  .px-form-title{font-size:15px;font-weight:700;margin-bottom:16px;}
  .px-field{margin-bottom:14px;}
  .px-label{font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:6px;}
  .px-input{width:100%;padding:11px 14px;background:#1e293b;border:1px solid #334155;border-radius:10px;color:#e2e8f0;font-size:14px;outline:none;box-sizing:border-box;}
  .px-input:focus{border-color:#6366f1;}
  .px-hint{font-size:12px;color:#475569;margin-top:4px;}
  .px-btn{width:100%;padding:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:12px;color:#fff;font-size:16px;font-weight:700;cursor:pointer;margin-top:8px;}
  .px-btn:hover{opacity:.9;}
  .px-btn:disabled{opacity:.5;cursor:default;}
  .px-err{color:#f87171;font-size:13px;margin-top:10px;text-align:center;}
  .px-success{background:#14532d;border:1px solid #16a34a;border-radius:12px;padding:20px;text-align:center;}
  .px-success-icon{font-size:40px;margin-bottom:8px;}
  .px-success-title{font-size:18px;font-weight:700;color:#4ade80;}
  .px-success-sub{font-size:13px;color:#86efac;margin-top:4px;}
  `;

  export default function PremiumPage() {
    const { user } = useAuth();
    const [, navigate] = useLocation();
    const [config, setConfig] = useState<PremiumConfig>({ premiumPrice:10000, dailyFreeLimit:20, qrisUrl:"", danaNumber:"", danaName:"" });
    const [cfgLoading, setCfgLoading] = useState(true);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [payRef, setPayRef] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [err, setErr] = useState("");
    const bp = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

    useEffect(() => {
      fetch(`${bp}/api/get-config`)
        .then(r => r.json())
        .then(d => setConfig(d))
        .catch(() => {})
        .finally(() => setCfgLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !phone.trim()) { setErr("Nama dan nomor HP wajib diisi"); return; }
      setLoading(true); setErr("");
      try {
        const r = await fetch(`${bp}/api/premium-request`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ email: user?.email, username: user?.username, name: name.trim(), phone: phone.trim(), payRef: payRef.trim() }),
        });
        if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Gagal"); }
        setSubmitted(true);
      } catch(err: any) { setErr(err.message); }
      finally { setLoading(false); }
    };

    const fmt = (n: number) => n.toLocaleString("id-ID");

    return (
      <>
        <style>{CSS}</style>
        <div className="px-bg">
          <button className="px-back" onClick={() => navigate("/dashboard")}>← Kembali</button>
          <div className="px-wrap">
            <div className="px-header">
              <div className="px-crown">👑</div>
              <div className="px-title">Upgrade ke Premium</div>
              <div className="px-sub">Akses semua model AI terbaik tanpa batas</div>
              {!cfgLoading && <div className="px-price-tag">Rp {fmt(config.premiumPrice)} / bulan</div>}
            </div>

            {/* Benefits */}
            <div className="px-benefits">
              {[
                ["🤖","Akses semua model AI premium (GPT-4o, Gemini, Grok)"],
                ["♾️",`Pesan unlimited (gratis hanya ${config.dailyFreeLimit} pesan/hari)`],
                ["🌐","Web Search tanpa batas"],
                ["🖼️","Generate gambar lebih banyak"],
                ["⚡","Respon lebih cepat & prioritas"],
              ].map(([icon,text],i) => (
                <div key={i} className="px-benefit">
                  <span className="px-benefit-icon">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* QRIS */}
            <div className="px-qris-card">
              <div className="px-qris-title">Scan QRIS untuk Bayar</div>
              <div className="px-qris-sub">Bayar dengan Dana, GoPay, OVO, LinkAja, dll</div>
              {config.qrisUrl ? (
                <img src={config.qrisUrl} alt="QRIS" className="px-qris-img" />
              ) : (
                <div className="px-qris-placeholder">
                  <span style={{fontSize:32}}>📱</span>
                  <span>QRIS belum diatur admin</span>
                </div>
              )}
              {config.danaNumber && (
                <div className="px-dana-box">
                  <div className="px-dana-lbl">Atau Transfer Dana</div>
                  <div className="px-dana-num">{config.danaNumber}</div>
                  {config.danaName && <div className="px-dana-name">a.n. {config.danaName}</div>}
                </div>
              )}
            </div>

            {/* Form konfirmasi */}
            {submitted ? (
              <div className="px-success">
                <div className="px-success-icon">🎉</div>
                <div className="px-success-title">Permintaan Terkirim!</div>
                <div className="px-success-sub">Admin akan verifikasi pembayaranmu dalam 1x24 jam. Setelah disetujui akun kamu otomatis jadi premium!</div>
              </div>
            ) : (
              <div className="px-form-card">
                <div className="px-form-title">📋 Konfirmasi Pembayaran</div>
                <form onSubmit={handleSubmit}>
                  <div className="px-field">
                    <label className="px-label">Nama Lengkap</label>
                    <input className="px-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama kamu" />
                  </div>
                  <div className="px-field">
                    <label className="px-label">Nomor HP / WhatsApp</label>
                    <input className="px-input" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
                  </div>
                  <div className="px-field">
                    <label className="px-label">Referensi Pembayaran (opsional)</label>
                    <input className="px-input" value={payRef} onChange={e=>setPayRef(e.target.value)} placeholder="No. transaksi / screenshot" />
                    <div className="px-hint">Isi nomor transaksi Dana atau catatan pembayaran untuk mempercepat verifikasi</div>
                  </div>
                  <button className="px-btn" type="submit" disabled={loading}>{loading?"Mengirim...":"Kirim Konfirmasi Pembayaran"}</button>
                  {err && <div className="px-err">{err}</div>}
                </form>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }