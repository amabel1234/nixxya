import React from "react";
import { useLocation } from "wouter";

const HOME_CSS = `
  @keyframes orbFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-80px) scale(1.2)} 66%{transform:translate(-40px,50px) scale(0.85)} }
  @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-70px,-50px) scale(1.25)} }
  @keyframes orbFloat3 { 0%,100%{transform:translate(0,0);opacity:.4} 50%{transform:translate(45px,-60px);opacity:.75} }
  @keyframes orbFloat4 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-30px,40px) scale(1.15)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  @keyframes pulseGlow { 0%,100%{box-shadow:0 0 40px rgba(124,58,237,.7),0 8px 40px rgba(124,58,237,.5)} 50%{box-shadow:0 0 80px rgba(124,58,237,.95),0 8px 60px rgba(236,72,153,.6)} }
  @keyframes shine { 0%{background-position:-300% center} 100%{background-position:300% center} }
  @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes spinRing { to{transform:rotate(360deg)} }
  @keyframes badgeIn { from{opacity:0;transform:translateY(10px) scale(.9)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes gridPulse { 0%,100%{opacity:.02} 50%{opacity:.05} }
  @keyframes countUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .h-logo-wrap { animation: fadeIn .55s ease both; }
  .h-logo-img-wrap { animation: floatY 4.5s ease-in-out infinite; }
  .h-title { animation: fadeUp .6s ease .1s both; }
  .h-sub { animation: fadeUp .6s ease .18s both; }
  .h-stats { animation: fadeUp .6s ease .26s both; }
  .h-badges { animation: fadeUp .6s ease .32s both; }
  .h-features { animation: fadeUp .6s ease .38s both; }
  .h-cta { animation: fadeUp .6s ease .45s both; }
  .h-trust { animation: fadeUp .6s ease .52s both; }

  .h-btn-primary {
    position:relative; overflow:hidden;
    animation: pulseGlow 2.6s ease-in-out 1.5s infinite;
    transition: transform .2s, filter .2s;
  }
  .h-btn-primary::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
    background-size:300% 100%;
    animation: shine 3s linear infinite;
  }
  .h-btn-primary:hover { transform:translateY(-3px) scale(1.02); filter:brightness(1.1); }
  .h-btn-primary:active { transform:translateY(-1px) scale(.99); }

  .h-btn-sec { transition:all .2s; }
  .h-btn-sec:hover { background:rgba(255,255,255,.1) !important; border-color:rgba(255,255,255,.3) !important; transform:translateY(-2px); }

  .h-pill { transition:all .18s; cursor:default; }
  .h-pill:hover { transform:translateY(-2px) scale(1.05); }

  .h-feat { transition:transform .22s, box-shadow .22s, border-color .22s; }
  .h-feat:hover { transform:translateY(-5px); box-shadow:0 14px 40px rgba(124,58,237,.22) !important; border-color:rgba(124,58,237,.3) !important; }

  .h-stat { transition:transform .2s, border-color .2s; }
  .h-stat:hover { transform:translateY(-3px); border-color:rgba(167,139,250,.38) !important; }

  .grid-bg {
    background-image:linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px);
    background-size:56px 56px;
    animation:gridPulse 8s ease-in-out infinite;
  }
  .shine-text {
    background:linear-gradient(90deg,#a78bfa 0%,#f472b6 25%,#60a5fa 50%,#a78bfa 75%,#f472b6 100%);
    background-size:300% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    animation:shine 5s linear infinite;
  }
`;

const MODELS = [
  { icon:"🧠", name:"Nixx AI",    color:"#a78bfa", bg:"rgba(167,139,250,.13)" },
  { icon:"⭐", name:"Christy AI", color:"#f472b6", bg:"rgba(244,114,182,.13)" },
  { icon:"🤖", name:"GPT-4o",     color:"#60a5fa", bg:"rgba(96,165,250,.13)"  },
  { icon:"⚡", name:"Grok 4",     color:"#fbbf24", bg:"rgba(251,191,36,.13)"  },
  { icon:"🌿", name:"Llama 4",    color:"#34d399", bg:"rgba(52,211,153,.13)"  },
  { icon:"💎", name:"Gemini 2.5", color:"#f9a8d4", bg:"rgba(249,168,212,.13)" },
  { icon:"🔍", name:"DeepSeek",   color:"#818cf8", bg:"rgba(129,140,248,.13)" },
  { icon:"🚀", name:"Turboseek",  color:"#fb923c", bg:"rgba(251,146,60,.13)"  },
];

const FEATURES = [
  { icon:"⚡", title:"Super Cepat",       desc:"Streaming real-time dari 26 model AI terbaik dunia",    c1:"#7c3aed", c2:"#6d28d9" },
  { icon:"🔒", title:"100% Privat",       desc:"Chat tidak tersimpan di server, privasi terjaga penuh", c1:"#0ea5e9", c2:"#0284c7" },
  { icon:"🆓", title:"Gratis Selamanya",  desc:"Akses penuh 26 model AI tanpa bayar sepeser pun",       c1:"#10b981", c2:"#059669" },
  { icon:"🇮🇩", title:"Bahasa Indonesia", desc:"AI yang paham konteks budaya & bahasa lokal kita",      c1:"#f59e0b", c2:"#d97706" },
];

const STATS = [
  { value:"26+",  label:"Model AI" },
  { value:"100%", label:"Gratis"   },
  { value:"0",    label:"Iklan"    },
  { value:"∞",    label:"Chat"     },
];

export default function HomePage() {
  const [, navigate] = useLocation();

  return (
    <>
      <style>{HOME_CSS}</style>
      <div style={{ minHeight:"100dvh", background:"linear-gradient(145deg,#060414 0%,#0d0726 28%,#160d40 58%,#090f26 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 18px", position:"relative", overflow:"hidden", fontFamily:"'Inter',system-ui,sans-serif" }}>

        <div className="grid-bg" style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0 }} />
        <div style={{ position:"fixed",width:800,height:800,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,.15) 0%,transparent 58%)",top:"-240px",left:"-240px",animation:"orbFloat1 13s ease-in-out infinite",pointerEvents:"none",zIndex:0 }} />
        <div style={{ position:"fixed",width:650,height:650,borderRadius:"50%",background:"radial-gradient(circle,rgba(59,130,246,.11) 0%,transparent 58%)",bottom:"-200px",right:"-200px",animation:"orbFloat2 16s ease-in-out infinite",pointerEvents:"none",zIndex:0 }} />
        <div style={{ position:"fixed",width:450,height:450,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,.1) 0%,transparent 58%)",top:"32%",right:"3%",animation:"orbFloat3 19s ease-in-out infinite",pointerEvents:"none",zIndex:0 }} />
        <div style={{ position:"fixed",width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(52,211,153,.08) 0%,transparent 58%)",bottom:"12%",left:"3%",animation:"orbFloat4 22s ease-in-out infinite",pointerEvents:"none",zIndex:0 }} />

        <div style={{ position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:22,maxWidth:620,width:"100%",textAlign:"center" }}>

          {/* Logo */}
          <div className="h-logo-wrap" style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:13 }}>
            <div className="h-logo-img-wrap" style={{ position:"relative",width:92,height:92 }}>
              <div style={{ position:"absolute",inset:-5,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#a855f7,#ec4899,#60a5fa)",animation:"spinRing 5s linear infinite",opacity:.5 }} />
              <div style={{ position:"absolute",inset:-2,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#ec4899)",opacity:.25,filter:"blur(8px)" }} />
              <div style={{ position:"relative",width:92,height:92,borderRadius:"50%",overflow:"hidden",background:"linear-gradient(135deg,#1a0a3d,#2d1065)",border:"2.5px solid rgba(255,255,255,.18)",boxShadow:"0 0 55px rgba(124,58,237,.75),0 0 100px rgba(124,58,237,.22)" }}>
                <img src="https://iili.io/f7nDq8X.jpg" alt="Nixx" style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
              </div>
            </div>
            <div>
              <div className="shine-text" style={{ fontSize:"2.9rem",fontWeight:900,letterSpacing:"-2px",lineHeight:.95,display:"block" }}>Nixx AI</div>
              <div style={{ color:"rgba(255,255,255,.3)",fontSize:".7rem",marginTop:5,letterSpacing:".22em",textTransform:"uppercase",fontWeight:600 }}>Powered by 26 AI Models</div>
            </div>
          </div>

          {/* Headline */}
          <div className="h-title" style={{ width:"100%" }}>
            <h1 style={{ color:"#fff",fontSize:"clamp(1.75rem,5vw,2.8rem)",fontWeight:900,margin:"0 0 10px",lineHeight:1.12,letterSpacing:"-1px" }}>
              Satu Platform,{" "}
              <span style={{ background:"linear-gradient(90deg,#a78bfa,#f472b6,#60a5fa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>26 Model AI</span>
              <br />Semuanya Gratis!
            </h1>
            <p className="h-sub" style={{ color:"rgba(255,255,255,.44)",fontSize:"clamp(.84rem,2.2vw,.96rem)",margin:"0 auto",lineHeight:1.75,maxWidth:480 }}>
              Dari GPT-4o hingga Gemini 2.5, DeepSeek sampai Grok — model AI terbaik dunia dalam satu tempat. Bahasa Indonesia, tanpa batas.
            </p>
          </div>

          {/* Stats */}
          <div className="h-stats" style={{ display:"flex",gap:8,width:"100%" }}>
            {STATS.map((s,i) => (
              <div key={s.label} className="h-stat" style={{ flex:1,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,padding:"12px 6px",backdropFilter:"blur(12px)",animation:`countUp .5s ease ${.3+i*.07}s both` }}>
                <div style={{ fontSize:"clamp(1rem,3vw,1.4rem)",fontWeight:900,color:"#a78bfa",marginBottom:2 }}>{s.value}</div>
                <div style={{ fontSize:".62rem",color:"rgba(255,255,255,.35)",textTransform:"uppercase",letterSpacing:".1em",fontWeight:700 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Model pills */}
          <div className="h-badges" style={{ display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center" }}>
            {MODELS.map((m,i) => (
              <div key={m.name} className="h-pill" style={{ background:m.bg,border:`1px solid ${m.color}30`,borderRadius:24,padding:"5px 12px",fontSize:".74rem",color:"rgba(255,255,255,.82)",display:"inline-flex",alignItems:"center",gap:5,backdropFilter:"blur(14px)",animation:`badgeIn .4s ease ${.3+i*.04}s both` }}>
                <span>{m.icon}</span>
                <span style={{ color:m.color,fontWeight:700 }}>{m.name}</span>
              </div>
            ))}
            <div style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:24,padding:"5px 12px",fontSize:".74rem",color:"rgba(255,255,255,.27)",backdropFilter:"blur(14px)" }}>+18 lainnya</div>
          </div>

          {/* Feature cards */}
          <div className="h-features" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,width:"100%" }}>
            {FEATURES.map(f => (
              <div key={f.title} className="h-feat" style={{ background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:16,padding:"15px 14px",textAlign:"left",backdropFilter:"blur(14px)",position:"relative",overflow:"hidden" }}>
                <div style={{ position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,${f.c1},${f.c2})`,opacity:.65 }} />
                <div style={{ width:36,height:36,borderRadius:9,background:`linear-gradient(135deg,${f.c1},${f.c2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.05rem",marginBottom:8,boxShadow:"0 4px 12px rgba(0,0,0,.3)" }}>{f.icon}</div>
                <div style={{ color:"rgba(255,255,255,.9)",fontWeight:700,fontSize:".82rem",marginBottom:3 }}>{f.title}</div>
                <div style={{ color:"rgba(255,255,255,.34)",fontSize:".69rem",lineHeight:1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="h-cta" style={{ display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:380 }}>
            <button
              className="h-btn-primary"
              onClick={() => navigate("/sign-up")}
              style={{ background:"linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%)",color:"#fff",border:"none",borderRadius:14,padding:"16px 28px",fontSize:"1.02rem",fontWeight:800,cursor:"pointer",width:"100%",fontFamily:"inherit",letterSpacing:".2px" }}
            >
              <span style={{ position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                <span>✨</span>
                Daftar Gratis — Mulai Sekarang
                <span style={{ opacity:.7 }}>→</span>
              </span>
            </button>
            <button
              className="h-btn-sec"
              onClick={() => navigate("/sign-in")}
              style={{ background:"rgba(255,255,255,.06)",color:"rgba(255,255,255,.7)",border:"1px solid rgba(255,255,255,.12)",borderRadius:14,padding:"13px 28px",fontSize:".88rem",fontWeight:600,cursor:"pointer",width:"100%",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}
            >
              <span>👋</span>
              Sudah punya akun? Masuk
              <span style={{ opacity:.45 }}>→</span>
            </button>
          </div>

          {/* Trust bar */}
          <div className="h-trust" style={{ display:"flex",gap:14,alignItems:"center",flexWrap:"wrap",justifyContent:"center" }}>
            {["🔐 Aman & Privat","⚡ Tanpa Iklan","🆓 100% Gratis","🌐 26 Model AI"].map(t => (
              <span key={t} style={{ color:"rgba(255,255,255,.18)",fontSize:".67rem",letterSpacing:".02em" }}>{t}</span>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
