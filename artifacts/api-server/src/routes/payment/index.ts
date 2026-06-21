import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, paymentRequests, users } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { getSettings } from "../admin";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  try {
    const s = await getSettings();
    res.json({
      qrisLink: s.qris_link,
      danaNumber: s.dana_number,
      danaName: s.dana_name,
      priceMonthly: parseInt(s.price_monthly, 10) || 15000,
      priceQuarterly: parseInt(s.price_quarterly, 10) || 40000,
      priceYearly: parseInt(s.price_yearly, 10) || 120000,
      dailyLimitFree: parseInt(s.daily_limit_free, 10) || 20,
      premiumModelIds: s.premium_model_ids.split(",").map(id => id.trim()).filter(Boolean),
    });
  } catch { res.status(500).json({ error: "Internal error" }); }
});

router.post("/payments", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { planId, danaNumber, note } = req.body as { planId: string; danaNumber: string; note?: string };
  if (!planId || !danaNumber) { res.status(400).json({ error: "planId dan danaNumber wajib diisi" }); return; }

  const s = await getSettings();
  let amountRp = 0;
  if (planId === "monthly") amountRp = parseInt(s.price_monthly, 10) || 15000;
  else if (planId === "quarterly") amountRp = parseInt(s.price_quarterly, 10) || 40000;
  else if (planId === "yearly") amountRp = parseInt(s.price_yearly, 10) || 120000;
  else { res.status(400).json({ error: "planId tidak valid" }); return; }

  const [created] = await db.insert(paymentRequests).values({
    userId: auth.userId, planId, amountRp, danaNumber, note: note ?? null,
  }).returning();

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (botToken && chatId) {
    const [user] = await db.select().from(users).where(eq(users.id, auth.userId));
    const planLabel = planId === "monthly" ? "Bulanan (30 hari)" : planId === "quarterly" ? "3 Bulan (90 hari)" : "Tahunan (365 hari)";
    const msg = `🔔 *PEMBAYARAN BARU - Nixx AI*\n\n👤 User: ${user?.email ?? auth.userId}\n📦 Plan: ${planLabel}\n💰 Harga: Rp ${amountRp.toLocaleString("id-ID")}\n📱 Dana: ${danaNumber}\n📝 Catatan: ${note ?? "-"}\n\n⏰ ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB\n\nBuka admin: /admin`;
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "Markdown" }),
    }).catch(() => {});
  }

  res.status(201).json(created);
});

router.get("/payments/my", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const payments = await db.select().from(paymentRequests)
    .where(eq(paymentRequests.userId, auth.userId))
    .orderBy(desc(paymentRequests.createdAt));
  res.json(payments);
});

export default router;
