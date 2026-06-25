import React from "react";

  interface Props {
    showPricing: boolean;
    onClose: () => void;
    onUpgrade: () => void;
    onBack: () => void;
  }

  export function LimitModal({ showPricing, onClose, onUpgrade, onBack }: Props) {
    return (
      <div style={{
        position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:300,
        display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",
        backdropFilter:"blur(4px)",
      }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{
          background:"#13111e",border:"1.5px solid rgba(168,85,247,0.5)",borderRadius:"24px",
          padding:"28px 20px 24px",maxWidth:"360px",width:"100%",textAlign:"center",
          boxShadow:"0 24px 80px rgba(168,85,247,0.35)",
        }}>
          {!showPricing ? (
            <>
              <div style={{fontSize:56,marginBottom:10}}>👑</div>
              <h2 style={{fontSize:"1.25rem",fontWeight:800,color:"#f0eeff",margin:"0 0 10px"}}>Limit Harian Habis!</h2>
              <p style={{color:"#a78bfa",fontSize:14,lineHeight:1.6,margin:"0 0 22px"}}>
                Kamu sudah mencapai batas pesan gratis hari ini. Upgrade ke Premium untuk kirim pesan unlimited!
              </p>
              <button onClick={onUpgrade} style={{
                display:"block",width:"100%",
                background:"linear-gradient(135deg,#a855f7,#7c3aed)",
                color:"#fff",fontWeight:700,fontSize:15,padding:"14px",
                borderRadius:"14px",border:"none",cursor:"pointer",marginBottom:10,
                boxShadow:"0 4px 20px rgba(168,85,247,0.45)",
              }}>✨ Upgrade ke Premium</button>
              <button onClick={onClose} style={{
                display:"block",width:"100%",
                background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.12)",
                color:"#a78bfa",fontWeight:600,fontSize:14,padding:"12px",
                borderRadius:"14px",cursor:"pointer",
              }}>Lanjut Gratis</button>
            </>
          ) : (
            <>
              <div style={{fontSize:40,marginBottom:8}}>✨</div>
              <h2 style={{fontSize:"1.1rem",fontWeight:800,color:"#f0eeff",margin:"0 0 6px"}}>Pilih Paket Premium</h2>
              <p style={{color:"#7b6fa0",fontSize:12,margin:"0 0 16px"}}>Pesan unlimited · Semua model AI · Aktivasi cepat</p>
              {([
                { label:"1 Hari",   price:"Rp 3.000",  per:"/ hari",   badge:"" },
                { label:"1 Minggu", price:"Rp 15.000", per:"/ minggu", badge:"HEMAT" },
                { label:"1 Bulan",  price:"Rp 45.000", per:"/ bulan",  badge:"TERBAIK" },
              ] as const).map(pkg => (
                <a
                  key={pkg.label}
                  href={`https://wa.me/6282260914586?text=Halo+kak+mau+order+Premium+Nixx+AI+paket+${encodeURIComponent(pkg.label)}+${encodeURIComponent(pkg.price)}`}
                  target="_blank" rel="noreferrer"
                  style={{
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    background:"rgba(168,85,247,0.1)",border:"1.5px solid rgba(168,85,247,0.3)",
                    borderRadius:"14px",padding:"13px 16px",marginBottom:10,textDecoration:"none",
                  }}
                >
                  <div style={{textAlign:"left"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontWeight:700,fontSize:14,color:"#f0eeff"}}>{pkg.label}</span>
                      {pkg.badge && <span style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:6}}>{pkg.badge}</span>}
                    </div>
                    <div style={{fontSize:11,color:"#7b6fa0",marginTop:2}}>Order via WhatsApp · Aktivasi cepat</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:800,fontSize:15,color:"#c084fc"}}>{pkg.price}</div>
                    <div style={{fontSize:11,color:"#7b6fa0"}}>{pkg.per}</div>
                  </div>
                </a>
              ))}
              <button onClick={onBack} style={{background:"none",border:"none",color:"#7b6fa0",fontSize:13,cursor:"pointer",padding:"8px",marginTop:4}}>← Kembali</button>
            </>
          )}
        </div>
      </div>
    );
  }
  