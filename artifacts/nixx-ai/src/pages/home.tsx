import React from "react";
  import { useLocation } from "wouter";

  const HOME_CSS = `
    @keyframes hfA { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(40px,-50px) scale(1.15)} 75%{transform:translate(-25px,30px) scale(.9)} }
    @keyframes hfB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-50px,-35px) scale(1.2)} }
    @keyframes hfC { 0%,100%{transform:translate(0,0);opacity:.5} 50%{transform:translate(30px,-40px);opacity:.8} }
    @keyframes hUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes hPulse { 0%,100%{box-shadow:0 8px 32px rgba(124,58,237,.55)} 50%{box-shadow:0 12px 48px rgba(124,58,237,.88),0 0 60px rgba(236,72,153,.22)} }
    @keyframes hPop { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
    .h-start { animation: hPulse 2.8s ease-in-out 1s infinite; transition:transform .18s,opacity .18s; }
    .h-start:hover { transform:translateY(-3px); opacity:.93; }
    .h-login { transition:all .18s; }
    .h-login:hover { background:rgba(255,255,255,.12)!important; border-color:rgba(255,255,255,.35)!important; }
    .h-card { transition:transform .2s,box-shadow .2s; }
    .h-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(124,58,237,.2)!important; }
  `;

  const SHOWCASE = [
    { icon:"🧠", name:"Nixx AI",     color:"#a78bfa" },
    { icon:"⭐", name:"Christy AI",  color:"#f472b6" },
    { icon:"🤖", name:"GPT-4o",      color:"#60a5fa" },
    { icon:"⚡", name:"Grok 4",      color:"#fbbf24" },
    { icon:"🌿", name:"Llama-3.3",   color:"#34d399" },
    { icon:"🔍", name:"Perplexity",  color:"#818cf8" },
    { icon:"🤖", name:"Gemini 2.5",  color:"#f9a8d4" },
    { icon:"🚀", name:"Turboseek",   color:"#fb923c" },
  ];

  const FEATURES = [
    { icon:"⚡", title:"Super Cepat",  desc:"Respon instan dari model AI terbaik dunia" },
    { icon:"🔒", title:"100% Privat",  desc:"Chat aman, tidak tersimpan di server" },
    { icon:"🆓", title:"Gratis",       desc:"Akses 26 model AI tanpa bayar sepeser pun" },
  ];

  export default function HomePage() {
    const [, navigate] = useLocation();

    return (
      <>
        <style>{HOME_CSS}</style>

        <div style={{
          minHeight:"100dvh",
          background:"linear-gradient(145deg,#0d0a2a 0%,#170f3d 35%,#1e1050 65%,#0d1226 100%)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          padding:"20px", position:"relative", overflow:"hidden",
        }}>
          {/* Orbs */}
          <div style={{ position:"fixed",width:520,height:520,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,.22) 0%,transparent 65%)",top:"-160px",left:"-160px",animation:"hfA 10s ease-in-out infinite",pointerEvents:"none" }} />
          <div style={{ position:"fixed",width:420,height:420,borderRadius:"50%",background:"radial-gradient(circle,rgba(59,130,246,.18) 0%,transparent 65%)",bottom:"-130px",right:"-130px",animation:"hfB 13s ease-in-out infinite",pointerEvents:"none" }} />
          <div style={{ position:"fixed",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,.15) 0%,transparent 65%)",top:"40%",right:"8%",animation:"hfC 16s ease-in-out infinite",pointerEvents:"none" }} />

          <div style={{ position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:22,maxWidth:560,width:"100%",textAlign:"center" }}>

            {/* Brand */}
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:10,animation:"hPop .55s ease both" }}>
              <div style={{
                width:80,height:80,borderRadius:"50%",overflow:"hidden",
                background:"linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)",
                boxShadow:"0 0 36px rgba(124,58,237,.72),0 0 80px rgba(124,58,237,.22)",
                border:"3px solid rgba(255,255,255,.18)",
              }}>
                <img src="https://iili.io/f7nDq8X.jpg" alt="Nixx"
                  style={{ width:"100%",height:"100%",objectFit:"cover" }}
                  onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
              </div>
              <span style={{
                fontSize:"2.2rem",fontWeight:900,letterSpacing:"-1px",
                background:"linear-gradient(135deg,#a78bfa 0%,#f472b6 45%,#60a5fa 100%)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
              }}>Nixx AI</span>
            </div>

            {/* Headline */}
            <div style={{ animation:"hUp .55s ease .1s both" }}>
              <h1 style={{
                color:"rgba(255,255,255,.95)",
                fontSize:"clamp(1.5rem,4vw,2.1rem)",fontWeight:900,
                margin:"0 0 10px",lineHeight:1.22,letterSpacing:"-.4px",
              }}>
                Chat dengan{" "}
                <span style={{
                  background:"linear-gradient(90deg,#a78bfa,#f472b6)",
                  WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
                }}>26 Model AI</span>
                <br />terbaik — semuanya gratis!
              </h1>
              <p style={{ color:"rgba(255,255,255,.52)",fontSize:".92rem",margin:0,lineHeight:1.6 }}>
                Dari GPT-4o sampai Llama 4, DeepSeek hingga Gemini.<br />
                Satu tempat, bahasa Indonesia, tanpa batas.
              </p>
            </div>

            {/* Model showcase */}
            <div style={{ display:"flex",gap:7,flexWrap:"wrap",justifyContent:"center",animation:"hUp .55s ease .18s both" }}>
              {SHOWCASE.map(m => (
                <div key={m.name} style={{
                  background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",
                  borderRadius:20,padding:"5px 12px",fontSize:".76rem",
                  color:"rgba(255,255,255,.72)",display:"inline-flex",alignItems:"center",gap:5,
                  backdropFilter:"blur(10px)",
                }}>
                  <span>{m.icon}</span>
                  <span style={{ color:m.color,fontWeight:600 }}>{m.name}</span>
                </div>
              ))}
              <div style={{
                background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",
                borderRadius:20,padding:"5px 12px",fontSize:".76rem",color:"rgba(255,255,255,.45)",
              }}>+18 lainnya</div>
            </div>

            {/* Feature cards */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,width:"100%",animation:"hUp .55s ease .26s both" }}>
              {FEATURES.map(f => (
                <div key={f.title} className="h-card" style={{
                  background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",
                  borderRadius:14,padding:"14px 10px",textAlign:"center",backdropFilter:"blur(10px)",
                }}>
                  <div style={{ fontSize:"1.45rem",marginBottom:6 }}>{f.icon}</div>
                  <div style={{ color:"rgba(255,255,255,.9)",fontWeight:700,fontSize:".8rem",marginBottom:4 }}>{f.title}</div>
                  <div style={{ color:"rgba(255,255,255,.42)",fontSize:".7rem",lineHeight:1.4 }}>{f.desc}</div>
                </div>
              ))}
            </div>

            {/* CTA - redirect to chat */}
            <div style={{ display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:320,animation:"hUp .55s ease .34s both" }}>
              <button className="h-start" onClick={() => navigate("/")} style={{
                background:"linear-gradient(135deg,#7c3aed 0%,#a855f7 55%,#ec4899 100%)",
                color:"#fff",border:"none",borderRadius:14,padding:"15px 28px",
                fontSize:"1rem",fontWeight:700,cursor:"pointer",width:"100%",fontFamily:"inherit",letterSpacing:".2px",
              }}>
                ✨ Mulai Chat Sekarang
              </button>
            </div>

            {/* Trust line */}
            <p style={{ color:"rgba(255,255,255,.28)",fontSize:".72rem",margin:0,animation:"hUp .55s ease .42s both" }}>
              🔐 Gratis · Tanpa akun · 26 model AI pilihan
            </p>
          </div>
        </div>
      </>
    );
  }
  