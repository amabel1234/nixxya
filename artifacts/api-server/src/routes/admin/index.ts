import { Router, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { eq, desc, and, sql, gte, lt } from "drizzle-orm";
import {
  db, payments, users, messageCounts,
  pricing, paymentMethods, siteSettings
} from "@workspace/db";

const router = Router();

const ADMIN_CLERK_IDS = (process.env.ADMIN_CLERK_IDS ?? "").split(",").filter(Boolean);

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId || ADMIN_CLERK_IDS.length === 0 || !ADMIN_CLERK_IDS.includes(clerkId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (_) { /* ignore */ }
}

async function ensureDefaultSettings(): Promise<void> {
  const existing = await db.select().from(siteSettings).limit(1);
  if (existing.length === 0) await db.insert(siteSettings).values({});
  const existingPricing = await db.select().from(pricing).limit(1);
  if (existingPricing.length === 0) await db.insert(pricing).values({});
}

// ─── STATS ────────────────────────────────────────────────────────────────────
router.get("/stats", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  const todayStart = new Date(today + "T00:00:00.000Z");
  const todayEnd = new Date(today + "T23:59:59.999Z");

  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [premiumUsers] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isPremium, true));
  const [suspendedUsers] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isSuspended, true));
  const [todayChats] = await db.select({ count: sql<number>`count(*)` }).from(messageCounts).where(eq(messageCounts.date, today));
  const [totalChats] = await db.select({ total: sql<number>`coalesce(sum(count),0)` }).from(messageCounts);
  const [pendingPaymentsCount] = await db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.status, "pending"));
  const [approvedRevenue] = await db.select({ total: sql<number>`coalesce(sum(amount),0)` }).from(payments).where(eq(payments.status, "approved"));
  const [todayNewUsers] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(gte(users.createdAt, todayStart), lt(users.createdAt, todayEnd)));
  const [totalPayments] = await db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.status, "approved"));

  res.json({
    totalUsers: Number(totalUsers?.count ?? 0),
    premiumUsers: Number(premiumUsers?.count ?? 0),
    freeUsers: Number(totalUsers?.count ?? 0) - Number(premiumUsers?.count ?? 0),
    suspendedUsers: Number(suspendedUsers?.count ?? 0),
    todayChats: Number(todayChats?.count ?? 0),
    totalChats: Number(totalChats?.total ?? 0),
    pendingPayments: Number(pendingPaymentsCount?.count ?? 0),
    totalRevenue: Number(approvedRevenue?.total ?? 0),
    todayNewUsers: Number(todayNewUsers?.count ?? 0),
    totalPremiumPurchases: Number(totalPayments?.count ?? 0),
  });
});

// ─── USERS ────────────────────────────────────────────────────────────────────
router.get("/users", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { search, filter } = req.query as { search?: string; filter?: string };
  const today = new Date().toISOString().slice(0, 10);

  let allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  if (search) {
    const q = search.toLowerCase();
    allUsers = allUsers.filter(u =>
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.name ?? "").toLowerCase().includes(q) ||
      u.clerkId.includes(q)
    );
  }
  if (filter === "premium") allUsers = allUsers.filter(u => u.isPremium);
  if (filter === "free") allUsers = allUsers.filter(u => !u.isPremium);
  if (filter === "suspended") allUsers = allUsers.filter(u => u.isSuspended);

  const todayCounts = await db.select().from(messageCounts).where(eq(messageCounts.date, today));
  const countMap = new Map(todayCounts.map(c => [c.clerkId, c.count]));

  const result = allUsers.map(u => ({ ...u, todayChats: countMap.get(u.clerkId) ?? 0 }));
  res.json(result);
});

router.post("/users/:id/suspend", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params["id"]);
  const updated = await db.update(users).set({ isSuspended: true }).where(eq(users.clerkId, id)).returning().then(r => r[0]);
  if (!updated) { res.status(404).json({ error: "User tidak ditemukan" }); return; }
  res.json(updated);
});

router.post("/users/:id/unsuspend", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params["id"]);
  const updated = await db.update(users).set({ isSuspended: false }).where(eq(users.clerkId, id)).returning().then(r => r[0]);
  if (!updated) { res.status(404).json({ error: "User tidak ditemukan" }); return; }
  res.json(updated);
});

router.delete("/users/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params["id"]);
  await db.delete(messageCounts).where(eq(messageCounts.clerkId, id));
  await db.delete(payments).where(eq(payments.clerkId, id));
  const deleted = await db.delete(users).where(eq(users.clerkId, id)).returning().then(r => r[0]);
  if (!deleted) { res.status(404).json({ error: "User tidak ditemukan" }); return; }
  res.json({ ok: true });
});

router.post("/users/:id/reset-limit", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params["id"]);
  const today = new Date().toISOString().slice(0, 10);
  await db.delete(messageCounts).where(and(eq(messageCounts.clerkId, id), eq(messageCounts.date, today)));
  res.json({ ok: true });
});

router.post("/users/:id/set-premium", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params["id"]);
  const { days } = req.body as { days?: number };
  const d = Number(days ?? 30);
  const premiumUntil = new Date(Date.now() + d * 24 * 60 * 60 * 1000);
  const updated = await db.update(users).set({ isPremium: true, premiumUntil }).where(eq(users.clerkId, id)).returning().then(r => r[0]);
  if (!updated) { res.status(404).json({ error: "User tidak ditemukan" }); return; }
  res.json(updated);
});

router.post("/users/:id/revoke-premium", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params["id"]);
  const updated = await db.update(users).set({ isPremium: false, premiumUntil: null }).where(eq(users.clerkId, id)).returning().then(r => r[0]);
  if (!updated) { res.status(404).json({ error: "User tidak ditemukan" }); return; }
  res.json(updated);
});

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
router.get("/payments", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const result = await db.select().from(payments).orderBy(desc(payments.createdAt));
  res.json(result);
});

router.post("/payments/:id/approve", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  const payment = await db.select().from(payments).where(eq(payments.id, id)).then(r => r[0]);
  if (!payment) { res.status(404).json({ error: "Tidak ditemukan" }); return; }

  const updated = await db.update(payments)
    .set({ status: "approved", approvedAt: new Date() })
    .where(eq(payments.id, id))
    .returning()
    .then(r => r[0]);

  await db.update(users)
    .set({ isPremium: true, premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
    .where(eq(users.clerkId, payment.clerkId));

  await sendTelegram(
    `✅ <b>Pembayaran Disetujui!</b>\n\n👤 ${payment.name} | ID: ${id}\n💰 Rp${Number(payment.amount).toLocaleString("id-ID")}\n🌟 Akun diupgrade ke Premium 30 hari.`
  );

  res.json(updated);
});

router.post("/payments/:id/reject", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  const updated = await db.update(payments)
    .set({ status: "rejected" })
    .where(eq(payments.id, id))
    .returning()
    .then(r => r[0]);
  if (!updated) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(updated);
});

// ─── PAYMENT METHODS ──────────────────────────────────────────────────────────
router.get("/payment-methods", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const result = await db.select().from(paymentMethods).orderBy(desc(paymentMethods.createdAt));
  res.json(result);
});

router.post("/payment-methods", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, logo, qrisLink, isActive } = req.body as { name?: string; logo?: string; qrisLink?: string; isActive?: boolean };
  if (!name) { res.status(400).json({ error: "name wajib diisi" }); return; }
  const result = await db.insert(paymentMethods).values({
    name, logo: logo ?? "", qrisLink: qrisLink ?? "", isActive: isActive !== false,
  }).returning().then(r => r[0]);
  res.status(201).json(result);
});

router.put("/payment-methods/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  const { name, logo, qrisLink, isActive } = req.body as { name?: string; logo?: string; qrisLink?: string; isActive?: boolean };
  const updated = await db.update(paymentMethods)
    .set({ name: name ?? "", logo: logo ?? "", qrisLink: qrisLink ?? "", isActive: isActive !== false })
    .where(eq(paymentMethods.id, id))
    .returning()
    .then(r => r[0]);
  if (!updated) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(updated);
});

router.delete("/payment-methods/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params["id"]);
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  res.json({ ok: true });
});

// ─── PRICING ──────────────────────────────────────────────────────────────────
router.get("/pricing", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  await ensureDefaultSettings();
  const result = await db.select().from(pricing).limit(1).then(r => r[0]);
  res.json(result);
});

router.put("/pricing", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await ensureDefaultSettings();
  const { daily, weekly, monthly, yearly, dailyName, weeklyName, monthlyName, yearlyName } = req.body as {
    daily?: number; weekly?: number; monthly?: number; yearly?: number;
    dailyName?: string; weeklyName?: string; monthlyName?: string; yearlyName?: string;
  };
  const existing = await db.select().from(pricing).limit(1).then(r => r[0]);
  const updated = await db.update(pricing)
    .set({
      daily: Number(daily ?? existing.daily),
      weekly: Number(weekly ?? existing.weekly),
      monthly: Number(monthly ?? existing.monthly),
      yearly: Number(yearly ?? existing.yearly),
      dailyName: dailyName ?? existing.dailyName,
      weeklyName: weeklyName ?? existing.weeklyName,
      monthlyName: monthlyName ?? existing.monthlyName,
      yearlyName: yearlyName ?? existing.yearlyName,
      updatedAt: new Date(),
    })
    .where(eq(pricing.id, existing.id))
    .returning()
    .then(r => r[0]);
  res.json(updated);
});

// ─── SITE SETTINGS ────────────────────────────────────────────────────────────
router.get("/settings", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  await ensureDefaultSettings();
  const result = await db.select().from(siteSettings).limit(1).then(r => r[0]);
  res.json(result);
});

router.put("/settings", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await ensureDefaultSettings();
  const { siteName, logoUrl, bannerUrl, themeColor, freeLimit } = req.body as {
    siteName?: string; logoUrl?: string; bannerUrl?: string; themeColor?: string; freeLimit?: number;
  };
  const existing = await db.select().from(siteSettings).limit(1).then(r => r[0]);
  const updated = await db.update(siteSettings)
    .set({
      siteName: siteName ?? existing.siteName,
      logoUrl: logoUrl ?? existing.logoUrl,
      bannerUrl: bannerUrl ?? existing.bannerUrl,
      themeColor: themeColor ?? existing.themeColor,
      freeLimit: Number(freeLimit ?? existing.freeLimit),
      updatedAt: new Date(),
    })
    .where(eq(siteSettings.id, existing.id))
    .returning()
    .then(r => r[0]);
  res.json(updated);
});

// ─── BROADCAST ────────────────────────────────────────────────────────────────
router.post("/broadcast", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { message, type } = req.body as { message?: string; type?: string };
  if (!message) { res.status(400).json({ error: "message wajib diisi" }); return; }

  const allUsers = await db.select({ clerkId: users.clerkId }).from(users);
  const prefix = type === "promo" ? "🎉 <b>PROMO PREMIUM!</b>" :
    type === "maintenance" ? "🔧 <b>MAINTENANCE</b>" : "📢 <b>PENGUMUMAN</b>";

  await sendTelegram(`${prefix}\n\n${message}\n\n<i>Dikirim ke ${allUsers.length} user</i>`);
  res.json({ ok: true, sent: allUsers.length });
});

// ─── PUBLIC endpoints (tanpa auth) ───────────────────────────────────────────
router.get("/public/settings", async (_req: Request, res: Response): Promise<void> => {
  await ensureDefaultSettings();
  const result = await db.select().from(siteSettings).limit(1).then(r => r[0]);
  res.json(result);
});

router.get("/public/payment-methods", async (_req: Request, res: Response): Promise<void> => {
  const result = await db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true));
  res.json(result);
});

router.get("/public/pricing", async (_req: Request, res: Response): Promise<void> => {
  await ensureDefaultSettings();
  const result = await db.select().from(pricing).limit(1).then(r => r[0]);
  res.json(result);
});

export default router;
