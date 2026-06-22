import { useState } from "react";
import { useToast } from "@/App";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    siteName: "UNIX AI",
    siteUrl: "https://unixsmm.biz.id",
    freeLimit: 20,
    themeColor: "#7c3aed",
    maintenanceMode: false,
    autoApprove: true,
    emailNotif: true,
    chatHistoryDays: 30,
    maxModels: 26,
  });
  const [adminPass, setAdminPass] = useState({ current: "", newPass: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    showToast("Pengaturan berhasil disimpan!", "success");
  };

  const handlePassChange = async () => {
    if (!adminPass.current || !adminPass.newPass) { showToast("Isi semua field password!", "error"); return; }
    if (adminPass.newPass !== adminPass.confirm) { showToast("Konfirmasi password tidak cocok!", "error"); return; }
    if (adminPass.newPass.length < 8) { showToast("Password minimal 8 karakter!", "error"); return; }
    await new Promise(r => setTimeout(r, 800));
    setAdminPass({ current: "", newPass: "", confirm: "" });
    showToast("Password berhasil diubah!", "success");
  };

  const update = (key: string, value: any) => setSettings(s => ({...s, [key]: value}));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pengaturan Website</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Kelola konfigurasi website UNIX AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">🌐 Pengaturan Umum</h3>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Nama Website</label>
            <input value={settings.siteName} onChange={e => update("siteName", e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">URL Website</label>
            <input value={settings.siteUrl} onChange={e => update("siteUrl", e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Warna Tema</label>
            <div className="flex gap-3 items-center">
              <input type="color" value={settings.themeColor} onChange={e => update("themeColor", e.target.value)}
                className="w-12 h-10 rounded-lg border border-border bg-muted cursor-pointer" />
              <input value={settings.themeColor} onChange={e => update("themeColor", e.target.value)}
                className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono" />
            </div>
          </div>
        </div>

        {/* Chat Settings */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">💬 Pengaturan Chat</h3>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Limit Chat Gratis Per Hari
              <span className="ml-2 text-purple-400 font-bold">{settings.freeLimit} pesan</span>
            </label>
            <input type="range" min={5} max={100} step={5} value={settings.freeLimit}
              onChange={e => update("freeLimit", Number(e.target.value))}
              className="w-full accent-purple-500" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5</span><span>50</span><span>100</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Simpan Riwayat Chat (hari)</label>
            <input type="number" value={settings.chatHistoryDays} min={1} max={365}
              onChange={e => update("chatHistoryDays", Number(e.target.value))}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Jumlah Model AI Aktif</label>
            <input type="number" value={settings.maxModels} min={1} max={50}
              onChange={e => update("maxModels", Number(e.target.value))}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">⚙️ Opsi Sistem</h3>
          {[
            { key: "maintenanceMode", label: "Mode Maintenance", sub: "Matikan akses user sementara", icon: "🔧", danger: true },
            { key: "autoApprove", label: "Auto-Approve Premium", sub: "Otomatis aktifkan premium setelah bayar", icon: "✅" },
            { key: "emailNotif", label: "Notifikasi Email", sub: "Kirim email untuk transaksi baru", icon: "📧" },
          ].map(opt => (
            <div key={opt.key} className={`flex items-center justify-between p-3 rounded-xl ${opt.danger && (settings as any)[opt.key] ? "bg-red-500/10 border border-red-500/20" : "bg-muted"}`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{opt.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${opt.danger && (settings as any)[opt.key] ? "text-red-300" : "text-white"}`}>{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.sub}</p>
                </div>
              </div>
              <button onClick={() => update(opt.key, !(settings as any)[opt.key])}
                className={`relative w-11 h-6 rounded-full transition-all duration-200 ${(settings as any)[opt.key] ? (opt.danger ? "bg-red-600" : "bg-purple-600") : "bg-muted border border-border"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${(settings as any)[opt.key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Password */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">🔐 Ganti Password Admin</h3>
          {[
            { key: "current", label: "Password Saat Ini", placeholder: "••••••••" },
            { key: "newPass", label: "Password Baru", placeholder: "Min. 8 karakter" },
            { key: "confirm", label: "Konfirmasi Password Baru", placeholder: "Ulangi password baru" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-muted-foreground mb-1.5 block">{f.label}</label>
              <input type="password" value={(adminPass as any)[f.key]}
                onChange={e => setAdminPass(p => ({...p, [f.key]: e.target.value}))}
                placeholder={f.placeholder}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
            </div>
          ))}
          <button onClick={handlePassChange}
            className="w-full py-2.5 rounded-xl bg-muted border border-border text-sm text-muted-foreground hover:text-white hover:border-purple-500/40 transition-all">
            🔑 Ganti Password
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold text-sm hover:from-purple-500 hover:to-purple-400 transition-all disabled:opacity-60 glow-purple-sm">
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Menyimpan...
            </span>
          ) : "💾 Simpan Semua Pengaturan"}
        </button>
      </div>
    </div>
  );
}
