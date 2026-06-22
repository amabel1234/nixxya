import { useState } from "react";
import { useToast } from "@/App";

const templates = [
  { id: "promo", label: "🎉 Promo Premium", content: "Hei! Ada promo spesial untuk kamu 🎉\n\nDapatkan Premium UNIX AI dengan diskon 50% hari ini saja!\n\n✨ Chat unlimited\n🤖 Akses 26 model AI\n🚀 Respons lebih cepat\n\nGunakan kode: PROMO50\n\nBerlaku hingga hari ini pukul 23:59 ⏰" },
  { id: "maintenance", label: "🔧 Maintenance", content: "⚠️ Pemberitahuan Maintenance\n\nSistem UNIX AI akan melakukan maintenance pada:\n📅 Tanggal: [Tanggal]\n⏰ Pukul: [Jam] - [Jam]\n\nSelama maintenance, layanan mungkin tidak tersedia sementara.\n\nMohon maaf atas ketidaknyamanannya 🙏\n\nTerima kasih,\nTim UNIX AI" },
  { id: "feature", label: "🆕 Fitur Baru", content: "🆕 Fitur Baru Tersedia!\n\nKami dengan bangga memperkenalkan fitur terbaru UNIX AI:\n\n🎭 Karakter AI - 12 persona unik\n📸 Upload gambar & analisis foto\n🖼️ Generate gambar dengan AI\n\nUpdate sekarang dan nikmati pengalaman AI terbaik!\n\nTim UNIX AI 🤖" },
  { id: "custom", label: "✍️ Kustom", content: "" },
];

const sentHistory = [
  { id: 1, title: "Promo Weekend", recipients: 1284, sentAt: "2024-03-24 09:00", type: "promo" },
  { id: 2, title: "Fitur Karakter AI", recipients: 1256, sentAt: "2024-03-22 14:30", type: "feature" },
  { id: 3, title: "Maintenance 23 Maret", recipients: 1230, sentAt: "2024-03-21 18:00", type: "maintenance" },
];

export default function BroadcastPage() {
  const [selected, setSelected] = useState("promo");
  const [title, setTitle] = useState("Promo Spesial UNIX AI");
  const [content, setContent] = useState(templates[0].content);
  const [target, setTarget] = useState<"all"|"premium"|"free">("all");
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  const selectTemplate = (id: string) => {
    setSelected(id);
    const t = templates.find(t => t.id === id);
    if (t) { setContent(t.content); }
  };

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) { showToast("Isi judul dan pesan!", "error"); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 2000));
    setSending(false);
    showToast(`Broadcast berhasil dikirim ke ${target === "all" ? "1.284" : target === "premium" ? "148" : "1.136"} user!`, "success");
  };

  const targetCount = { all: 1284, premium: 148, free: 1136 };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Broadcast</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Kirim notifikasi, promo, dan pengumuman ke semua user</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose */}
        <div className="lg:col-span-2 space-y-4">
          {/* Templates */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">📋 Template Pesan</h3>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(t => (
                <button key={t.id} onClick={() => selectTemplate(t.id)}
                  className={`px-3 py-2 rounded-xl text-xs text-left font-medium transition-all ${
                    selected === t.id ? "bg-purple-600/20 border border-purple-500/40 text-purple-300" : "bg-muted border border-border text-muted-foreground hover:text-white"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">✍️ Tulis Pesan</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Judul Broadcast</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Judul notifikasi..."
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Isi Pesan</label>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                rows={8} placeholder="Tulis pesan broadcast..."
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none font-mono" />
              <p className="text-xs text-muted-foreground mt-1">{content.length} karakter</p>
            </div>
          </div>
        </div>

        {/* Settings & Send */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">🎯 Target Penerima</h3>
            <div className="space-y-2">
              {(["all","premium","free"] as const).map(t => (
                <button key={t} onClick={() => setTarget(t)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm transition-all ${
                    target === t ? "bg-purple-600/20 border border-purple-500/40 text-white" : "bg-muted border border-border text-muted-foreground hover:text-white"
                  }`}>
                  <span>{t === "all" ? "👥 Semua User" : t === "premium" ? "✨ User Premium" : "🆓 User Gratis"}</span>
                  <span className={`text-xs font-bold ${target === t ? "text-purple-300" : "text-muted-foreground"}`}>
                    {targetCount[t].toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">👁️ Preview</h3>
            <div className="bg-muted rounded-xl p-3">
              <p className="text-xs font-semibold text-purple-400 mb-1">📢 {title || "Judul"}</p>
              <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-4">{content || "Isi pesan..."}</p>
            </div>
          </div>

          {/* Send Button */}
          <button onClick={handleSend} disabled={sending}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold text-sm hover:from-purple-500 hover:to-purple-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed glow-purple-sm">
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Mengirim ke {targetCount[target].toLocaleString()} user...
              </span>
            ) : `📢 Kirim Broadcast (${targetCount[target].toLocaleString()} user)`}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-white">📜 Riwayat Broadcast</h3>
        </div>
        <div className="divide-y divide-border">
          {sentHistory.map(h => (
            <div key={h.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-white">{h.title}</p>
                <p className="text-xs text-muted-foreground">{h.sentAt} • {h.recipients.toLocaleString()} penerima</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                h.type === "promo" ? "bg-orange-500/10 text-orange-400" :
                h.type === "feature" ? "bg-blue-500/10 text-blue-400" : "bg-yellow-500/10 text-yellow-400"
              }`}>
                {h.type === "promo" ? "Promo" : h.type === "feature" ? "Fitur" : "Maintenance"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
