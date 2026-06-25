import React from "react";
  import { AuthUser } from "@/context/AuthContext";
  import { activatePremCode } from "@/utils/premium";

  interface Props {
    user: AuthUser | null;
    isPrem: boolean;
    premExpiry: string | null;
    todayLeft: number;
    msgLimit: number;
    codeInput: string;
    codeMsg: { ok: boolean; msg: string } | null;
    setCodeInput: (v: string) => void;
    setCodeMsg: (v: { ok: boolean; msg: string } | null) => void;
    onClose: () => void;
    onUpgrade: () => void;
  }

  export function ProfileModal({ user, isPrem, premExpiry, todayLeft, msgLimit, codeInput, codeMsg, setCodeInput, setCodeMsg, onClose, onUpgrade }: Props) {
    return (
      <div style={{
        position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:300,
        display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",
        backdropFilter:"blur(4px)",
      }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{
          background:"#13111e",border:"1.5px solid rgba(168,85,247,0.4)",borderRadius:"24px",
          padding:"28px 20px 24px",maxWidth:"360px",width:"100%",textAlign:"center",
          boxShadow:"0 24px 80px rgba(168,85,247,0.3)",
        }}>
          <div style={{
            width:72,height:72,borderRadius:"50%",margin:"0 auto 14px",
            background: isPrem ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#a855f7,#7c3aed)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:28,fontWeight:800,color:"#fff",
            boxShadow: isPrem ? "0 4px 20px rgba(245,158,11,0.5)" : "0 4px 20px rgba(168,85,247,0.5)",
          }}>
            {(user?.username ?? user?.email ?? "U").charAt(0).toUpperCase()}
          </div>
          <div style={{fontWeight:800,fontSize:"1.1rem",color:"#f0eeff",marginBottom:4}}>{user?.username ?? "User"}</div>
          <div style={{fontSize:12,color:"#7b6fa0",marginBottom:16}}>{user?.email}</div>
          <div style={{
            display:"inline-flex",alignItems:"center",gap:6,
            background: isPrem ? "rgba(245,158,11,0.15)" : "rgba(168,85,247,0.1)",
            border: `1.5px solid ${isPrem ? "rgba(245,158,11,0.4)" : "rgba(168,85,247,0.3)"}`,
            borderRadius:999,padding:"6px 14px",marginBottom:16,fontSize:13,fontWeight:700,
            color: isPrem ? "#f59e0b" : "#a78bfa",
          }}>
            {isPrem ? "⭐ Premium" : "🆓 Gratis"}
          </div>
          {isPrem ? (
            <p style={{fontSize:13,color:"#7b6fa0",marginBottom:20}}>
              Aktif hingga <strong style={{color:"#f0eeff"}}>{premExpiry}</strong>
            </p>
          ) : (
            <p style={{fontSize:13,color:"#7b6fa0",marginBottom:20}}>
              Sisa pesan hari ini: <strong style={{color:"#c084fc"}}>{todayLeft} / {msgLimit}</strong>
            </p>
          )}
          {!isPrem && (
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"16px",marginBottom:16}}>
              <div style={{fontSize:12,color:"#a78bfa",fontWeight:700,marginBottom:8,textAlign:"left"}}>🔑 Punya kode premium?</div>
              <div style={{display:"flex",gap:8}}>
                <input
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeMsg(null); }}
                  placeholder="NH-XXXX / NW-XXXX / NB-XXXX"
                  style={{
                    flex:1,background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(168,85,247,0.3)",
                    borderRadius:10,padding:"10px 12px",color:"#f0eeff",fontSize:12,outline:"none",
                  }}
                />
                <button
                  onClick={() => {
                    if (!user) return;
                    const res = activatePremCode(user.id, codeInput);
                    setCodeMsg(res);
                    if (res.ok) setCodeInput("");
                  }}
                  style={{
                    background:"linear-gradient(135deg,#a855f7,#7c3aed)",color:"#fff",
                    border:"none",borderRadius:10,padding:"10px 14px",fontWeight:700,
                    fontSize:12,cursor:"pointer",whiteSpace:"nowrap",
                  }}
                >Aktifkan</button>
              </div>
              {codeMsg && (
                <div style={{marginTop:8,fontSize:12,fontWeight:600,textAlign:"left",color:codeMsg.ok?"#4ade80":"#f87171"}}>{codeMsg.msg}</div>
              )}
            </div>
          )}
          {!isPrem && (
            <button onClick={onUpgrade} style={{
              display:"block",width:"100%",marginBottom:10,
              background:"linear-gradient(135deg,#a855f7,#7c3aed)",
              color:"#fff",fontWeight:700,fontSize:14,padding:"12px",
              borderRadius:14,border:"none",cursor:"pointer",
              boxShadow:"0 4px 20px rgba(168,85,247,0.4)",
            }}>✨ Upgrade Premium</button>
          )}
          <button onClick={onClose} style={{background:"none",border:"none",color:"#7b6fa0",fontSize:13,cursor:"pointer",padding:"6px"}}>Tutup</button>
        </div>
      </div>
    );
  }
  