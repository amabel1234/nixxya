import React, { useState } from "react";
  import { useLocation } from "wouter";
  import { Show, useUser } from "@clerk/react";
  import { useUserInfo } from "@/hooks/use-user-info";

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  export default function ProfilePage() {
    const [, navigate] = useLocation();
    const { user } = useUser();
    const { data: userInfo } = useUserInfo();

    const [username, setUsername] = useState(user?.username ?? "");
    const [firstName, setFirstName] = useState(user?.firstName ?? "");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setSavingProfile(true);
      setProfileMsg(null);
      try {
        await user.update({
          username: username.trim() || undefined,
          firstName: firstName.trim() || undefined,
        });
        setProfileMsg({ type: "ok", text: "Profil berhasil diperbarui." });
      } catch (err: any) {
        const text = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Gagal memperbarui profil.";
        setProfileMsg({ type: "err", text });
      } finally {
        setSavingProfile(false);
      }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setPasswordMsg(null);
      if (newPassword.length < 8) {
        setPasswordMsg({ type: "err", text: "Password baru minimal 8 karakter." });
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordMsg({ type: "err", text: "Konfirmasi password tidak cocok." });
        return;
      }
      setSavingPassword(true);
      try {
        await user.updatePassword({
          currentPassword: user.passwordEnabled ? currentPassword : undefined,
          newPassword,
          signOutOfOtherSessions: true,
        });
        setPasswordMsg({ type: "ok", text: "Password berhasil diganti." });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } catch (err: any) {
        const text = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Gagal mengganti password.";
        setPasswordMsg({ type: "err", text });
      } finally {
        setSavingPassword(false);
      }
    };

    const email = user?.primaryEmailAddress?.emailAddress ?? userInfo?.email ?? "";
    const isPremium = userInfo?.isPremium ?? false;

    return (
      <div className="nx-page-center">
        <Show when="signed-out">
          {(() => { navigate("/sign-in"); return null; })()}
        </Show>

        <div className="nx-profile-card">
          <div className="nx-profile-header">
            {user?.imageUrl && <img src={user.imageUrl} alt="avatar" className="nx-profile-avatar" />}
            <div>
              <h1 className="nx-profile-title">Profil Saya</h1>
              <p className="nx-profile-email">{email}</p>
            </div>
          </div>

          <div className="nx-profile-section">
            <h3>Status Akun</h3>
            {isPremium ? (
              <div className="nx-user-badge premium" style={{ fontSize: "0.85rem", padding: "4px 10px" }}>
                ⭐ Premium
                {userInfo?.premiumUntil && (
                  <> · aktif hingga {new Date(userInfo.premiumUntil).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</>
                )}
              </div>
            ) : (
              <>
                <div className="nx-user-badge free" style={{ fontSize: "0.85rem", padding: "4px 10px" }}>
                  Free · {userInfo?.usedToday ?? 0}/{userInfo?.limit ?? 20} pesan hari ini
                </div>
                <button className="nx-upgrade-btn" style={{ marginTop: 10 }} onClick={() => navigate(`${basePath}/premium`)}>
                  ⭐ Upgrade Premium
                </button>
              </>
            )}
          </div>

          <form className="nx-profile-section" onSubmit={handleSaveProfile}>
            <h3>Ubah Profil</h3>
            <div className="nx-form-group">
              <label>Nama Tampilan</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nama kamu" />
            </div>
            <div className="nx-form-group">
              <label>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" autoCapitalize="off" autoCorrect="off" />
            </div>
            {profileMsg && (
              <div className={profileMsg.type === "err" ? "nx-form-error" : "nx-form-success"}>
                {profileMsg.type === "err" ? "⚠️ " : "✅ "}{profileMsg.text}
              </div>
            )}
            <button type="submit" className="nx-start-btn" disabled={savingProfile}>
              {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>

          <form className="nx-profile-section" onSubmit={handleChangePassword}>
            <h3>Ganti Password</h3>
            {user?.passwordEnabled && (
              <div className="nx-form-group">
                <label>Password Saat Ini</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" required />
              </div>
            )}
            <div className="nx-form-group">
              <label>Password Baru</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 8 karakter" required />
            </div>
            <div className="nx-form-group">
              <label>Konfirmasi Password Baru</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password baru" required />
            </div>
            {passwordMsg && (
              <div className={passwordMsg.type === "err" ? "nx-form-error" : "nx-form-success"}>
                {passwordMsg.type === "err" ? "⚠️ " : "✅ "}{passwordMsg.text}
              </div>
            )}
            <button type="submit" className="nx-start-btn" disabled={savingPassword}>
              {savingPassword ? "Menyimpan..." : "Ganti Password"}
            </button>
            <p className="nx-form-note" style={{ marginTop: 8 }}>
              Mengganti password akan mengeluarkan sesi login lain secara otomatis.
            </p>
          </form>

          <button className="nx-back-btn" onClick={() => navigate("/chat")}>
            ← Kembali ke Chat
          </button>
        </div>
      </div>
    );
  }
  