// Premium helpers — localStorage-based premium system
  export const PREM_KEY = (uid: string) => `nx-prem-${uid}`;
  export const USED_KEY  = (uid: string) => `nx-codes-${uid}`;

  export function checkPremium(uid: string): boolean {
    const exp = localStorage.getItem(PREM_KEY(uid));
    if (!exp) return false;
    return new Date(exp) > new Date();
  }

  export function getPremExpiry(uid: string): string | null {
    const exp = localStorage.getItem(PREM_KEY(uid));
    if (!exp || new Date(exp) <= new Date()) return null;
    return new Date(exp).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" });
  }

  export function activatePremCode(uid: string, code: string): { ok: boolean; msg: string } {
    const c = code.trim().toUpperCase();
    const used: string[] = JSON.parse(localStorage.getItem(USED_KEY(uid)) ?? "[]");
    if (used.includes(c)) return { ok: false, msg: "Kode sudah digunakan." };
    let days = 0;
    if      (/^NH-[A-Z0-9]{4,}$/.test(c)) days = 1;
    else if (/^NW-[A-Z0-9]{4,}$/.test(c)) days = 7;
    else if (/^NB-[A-Z0-9]{4,}$/.test(c)) days = 30;
    else return { ok: false, msg: "Kode tidak valid. Cek lagi kodenya." };
    const exp = new Date(); exp.setDate(exp.getDate() + days);
    localStorage.setItem(PREM_KEY(uid), exp.toISOString());
    used.push(c); localStorage.setItem(USED_KEY(uid), JSON.stringify(used));
    return { ok: true, msg: `✅ Premium aktif hingga ${exp.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}!` };
  }
  