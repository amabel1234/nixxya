import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/App";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignInPage() {
  const { signIn } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const result = signIn(email, password);
    setLoading(false);
    if (result.ok) navigate("/chat");
    else setError(result.error ?? "Login gagal.");
  };

  return (
    <div style={{
      display:"flex",minHeight:"100dvh",
      background:"linear-gradient(145deg,#060414 0%,#0d0726 28%,#160d40 58%,#090f26 100%)",
      fontFamily:"'Inter',system-ui,sans-serif",
    }}>
      {/* Left panel - desktop only */}
      <div style={{display:"none"}} className="nx-auth-left">
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(124,58,237,.25),rgba(168,85,247,.15))"}} />
        <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",justifyContent:"space-between",height:"100%"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:48}}>
              <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#7c3aed,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem",boxShadow:"0 0 20px rgba(124,58,237,.5)"}}>🧠</div>
              <span style={{fontSize:"1.4rem",fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>Nixx AI</span>
            </div>
            <h2 style={{fontSize:"2.5rem",fontWeight:900,color:"#fff",lineHeight:1.2,marginBottom:16}}>Selamat datang<br/>kembali!</h2>
            <p style={{color:"rgba(255,255,255,.55)",fontSize:"1rem",lineHeight:1.7,maxWidth:320}}>Masuk ke akun kamu dan lanjutkan percakapan dengan 26 model AI terbaik dunia.</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {["🧠 Nixx AI — Cerdas & Cepat","⭐ Christy AI — Idol JKT48","⚡ Grok 4 Fast — Ultra Speed","💎 Gemini 2.5 — Google AI","🤖 GPT-4o — OpenAI Latest"].map(m => (
              <div key={m} style={{display:"flex",alignItems:"center",gap:10,color:"rgba(255,255,255,.65)",fontSize:".88rem"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:"#a78bfa",flexShrink:0}} />
                {m}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px"}}>
        <div style={{width:"100%",maxWidth:440}}>
          {/* Mobile logo */}
          <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center",marginBottom:32}}>
            <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#7c3aed,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",boxShadow:"0 0 20px rgba(124,58,237,.5)"}}>🧠</div>
            <span style={{fontSize:"1.4rem",fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>Nixx AI</span>
          </div>

          <div style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(124,58,237,.2)",borderRadius:24,padding:"36px 28px",backdropFilter:"blur(16px)"}}>
            <h1 style={{color:"#fff",fontSize:"1.55rem",fontWeight:900,marginBottom:6,letterSpacing:"-0.5px"}}>Masuk ke Akun</h1>
            <p style={{color:"rgba(255,255,255,.42)",fontSize:".88rem",marginBottom:28,lineHeight:1.6}}>Gunakan email dan password yang sudah terdaftar</p>

            {error && (
              <div style={{background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.3)",borderRadius:12,padding:"11px 14px",marginBottom:18,color:"#fca5a5",fontSize:".84rem"}}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <label style={{display:"block",color:"rgba(255,255,255,.7)",fontSize:".82rem",fontWeight:600,marginBottom:7}}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="nama@email.com" required autoComplete="email"
                  style={{width:"100%",background:"rgba(255,255,255,.07)",border:"1px solid rgba(124,58,237,.25)",borderRadius:12,padding:"12px 14px",color:"#fff",fontSize:".9rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}
                  onFocus={e => e.target.style.borderColor="rgba(124,58,237,.6)"}
                  onBlur={e => e.target.style.borderColor="rgba(124,58,237,.25)"}
                />
              </div>
              <div>
                <label style={{display:"block",color:"rgba(255,255,255,.7)",fontSize:".82rem",fontWeight:600,marginBottom:7}}>Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  style={{width:"100%",background:"rgba(255,255,255,.07)",border:"1px solid rgba(124,58,237,.25)",borderRadius:12,padding:"12px 14px",color:"#fff",fontSize:".9rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}
                  onFocus={e => e.target.style.borderColor="rgba(124,58,237,.6)"}
                  onBlur={e => e.target.style.borderColor="rgba(124,58,237,.25)"}
                />
              </div>
              <button
                type="submit" disabled={loading}
                style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:".95rem",fontWeight:800,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:".3px",boxShadow:"0 4px 20px rgba(124,58,237,.4)",transition:"all .18s",opacity:loading?.7:1,marginTop:4}}
              >
                {loading ? "⏳ Memproses..." : "Masuk ke Nixx AI →"}
              </button>
            </form>

            <div style={{borderTop:"1px solid rgba(255,255,255,.08)",marginTop:24,paddingTop:20,textAlign:"center"}}>
              <span style={{color:"rgba(255,255,255,.42)",fontSize:".85rem"}}>Belum punya akun? </span>
              <a href={`${basePath}/sign-up`} onClick={e => { e.preventDefault(); navigate("/sign-up"); }}
                style={{color:"#a78bfa",fontWeight:700,fontSize:".85rem",textDecoration:"none"}}>
                Daftar Gratis
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .nx-auth-left { display:flex !important; flex-direction:column; width:45%; padding:48px; position:relative; overflow:hidden; }
        }
        input::placeholder { color: rgba(255,255,255,.28) !important; }
      `}</style>
    </div>
  );
}
