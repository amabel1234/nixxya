// Vercel Serverless — Router untuk semua /api/* endpoints

const GROQ_KEY = process.env.GROQ_API_KEY || "";

// Hanya pakai 2 model Groq yang stabil dan aktif
const GROQ_MODELS = {
  deepseekv3:"llama-3.3-70b-versatile", christyai:"llama-3.3-70b-versatile",
  gpt4o:"llama-3.3-70b-versatile", gpt3:"llama-3.1-8b-instant",
  copilot:"llama-3.3-70b-versatile", gemini25v1:"llama-3.3-70b-versatile",
  gemini25v2:"llama-3.3-70b-versatile", grok4fast:"llama-3.3-70b-versatile",
  grok3mini:"llama-3.1-8b-instant", grok3jail1:"llama-3.3-70b-versatile",
  grok3jail2:"llama-3.3-70b-versatile", llama4:"llama-3.3-70b-versatile",
  llama33:"llama-3.3-70b-versatile", gemma:"llama-3.1-8b-instant",
  mistral:"llama-3.1-8b-instant", groqmini:"llama-3.1-8b-instant",
  felo:"llama-3.3-70b-versatile", turboseek:"llama-3.1-8b-instant",
  perplexity:"llama-3.3-70b-versatile", perplexed:"llama-3.3-70b-versatile",
  muslim:"llama-3.3-70b-versatile", aoyo:"llama-3.1-8b-instant",
  gptoss120:"llama-3.3-70b-versatile", gptoss20:"llama-3.1-8b-instant",
  venice:"llama-3.3-70b-versatile", ripple:"llama-3.1-8b-instant",
};

function ms(n) { return new Promise((_,r)=>setTimeout(()=>r(new Error("timeout")),n)); }

function clean(t) {
  if (!t) return "";
  t = t.trim();
  if (t.includes("</think>")) t = (t.split("</think>").pop()||t).trim();
  t = t.replace(/\$\$[\s\S]*?\$\$/g,"").replace(/\$[^$\n]*?\$/g,"");
  return t.replace(/^(okay|sure|baik|tentu|of course|tentu saja)[,!.\s]*/i,"").trim();
}

async function tryGroq(messages, modelId) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const model = GROQ_MODELS[modelId] || "llama-3.3-70b-versatile";
    const r = await Promise.race([
      fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
        body:JSON.stringify({model,messages,max_tokens:2048,temperature:0.7}),
      }),
      ms(12000),
    ]);
    if (!r.ok) return null;
    const d = await r.json();
    const t = d.choices?.[0]?.message?.content||"";
    return t.trim()||null;
  } catch { return null; }
}

async function tryPollinations(messages) {
  const seed = Math.floor(Math.random()*999999);
  const userMsg = messages.filter(m=>m.role==="user").pop()?.content||"";
  const sysMsg = messages.find(m=>m.role==="system")?.content||"";
  const hist = messages.filter(m=>m.role!=="system").slice(0,-1)
    .map(m=>(m.role==="user"?"User":"AI")+": "+m.content.slice(0,300)).join("\n");
  const fullSys = hist ? sysMsg+"\n\nKonteks:\n"+hist : sysMsg;
  const url = "https://text.pollinations.ai/"+encodeURIComponent(userMsg.slice(0,800))
    +"?model=mistral&seed="+seed
    +"&system="+encodeURIComponent(fullSys.slice(0,1200))+"&private=true";
  try {
    const r = await Promise.race([fetch(url), ms(15000)]);
    if (!r.ok) throw new Error("status "+r.status);
    const t = await r.text();
    return t.trim()||null;
  } catch { return null; }
}

async function handleChat(req, res) {
  if (req.method==="OPTIONS"){res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");res.status(200).end();return;}
  if (req.method!=="POST"){res.status(405).json({error:"Method not allowed"});return;}
  const {messages,model:modelId} = req.body||{};
  if (!Array.isArray(messages)||!messages.length){res.status(400).json({error:"messages diperlukan"});return;}
  let text = await tryGroq(messages, modelId||"deepseekv3");
  if (!text) text = await tryPollinations(messages);
  if (text) res.status(200).json({content:clean(text)});
  else res.status(503).json({error:"Maaf, AI sedang sibuk. Coba lagi ya!"});
}

async function handleGenerateImage(req, res) {
  if (req.method==="OPTIONS"){res.status(200).end();return;}
  if (req.method!=="POST"){res.status(405).json({error:"Method not allowed"});return;}
  const {prompt} = req.body||{};
  if (!prompt?.trim()){res.status(400).json({error:"prompt diperlukan"});return;}
  const seed = Math.floor(Math.random()*999999);
  const enc = encodeURIComponent(prompt.slice(0,500));
  for (const url of [
    `https://image.pollinations.ai/prompt/${enc}?width=768&height=512&seed=${seed}&nologo=true&model=flux-pro`,
    `https://image.pollinations.ai/prompt/${enc}?width=768&height=512&seed=${seed}&nologo=true&model=flux`,
  ]) {
    try {
      const r = await Promise.race([fetch(url),ms(28000)]);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length<1000) continue;
      const ct = r.headers.get("content-type")||"image/jpeg";
      res.status(200).json({dataUrl:`data:${ct};base64,${buf.toString("base64")}`,url});
      return;
    } catch { continue; }
  }
  res.status(503).json({error:"Gagal generate gambar, coba lagi!"});
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization");
  res.setHeader("Content-Type","application/json");

  const url = req.url || "/";
  const path = url.split("?")[0];

  if (path==="/api/chat"||path==="/chat") return handleChat(req,res);
  if (path==="/api/generate-image"||path==="/generate-image") return handleGenerateImage(req,res);

  res.status(404).json({error:"Not found: "+path});
};
