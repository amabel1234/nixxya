import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, users, paymentRequests, appSettings, messageUsage, DEFAULT_SETTINGS } from "@workspace/db";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const adminIds = (process.env.ADMIN_USER_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  if (adminIds.length > 0 && !adminIds.includes(auth.userId)) {
    res.status(403).json({ error: "Akses ditolak. Anda bukan admin." }); return;
  }
  next();
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(appSettings);
  const result: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) { result[row.key] = row.value; }
  return result;
}

router.get("/admin/stats", adminMiddleware, async (_req, res): Promise<void> => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [[totalRow], [premiumRow], [pendingRow], [todayRow]] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.isPremium, true)),
      db.select({ count: sql<number>`count(*)::int` }).from(paymentRequests).where(eq(paymentRequests.status, "pending")),
      db.select({ total: sql<number>`coalesce(sum(count), 0)::int` }).from(messageUsage).where(eq(messageUsage.usageDate, today)),
    ]);
    res.json({
      totalUsers: totalRow?.count ?? 0,
      premiumUsers: premiumRow?.count ?? 0,
      pendingPayments: pendingRow?.count ?? 0,
      todayMessages: todayRow?.total ?? 0,
    });
  } catch { res.status(500).json({ error: "Internal error" }); }
});

router.get("/admin/payments", adminMiddleware, async (_req, res): Promise<void> => {
  try {
    const payments = await db.select({
      id: paymentRequests.id,
      userId: paymentRequests.userId,
      planId: paymentRequests.planId,
      amountRp: paymentRequests.amountRp,
      status: paymentRequests.status,
      danaNumber: paymentRequests.danaNumber,
      note: paymentRequests.note,
      confirmedAt: paymentRequests.confirmedAt,
      createdAt: paymentRequests.createdAt,
      userEmail: users.email,
      userName: users.name,
    }).from(paymentRequests)
      .leftJoin(users, eq(paymentRequests.userId, users.id))
      .orderBy(desc(paymentRequests.createdAt));
    res.json(payments);
  } catch { res.status(500).json({ error: "Internal error" }); }
});

router.put("/admin/payments/:id", adminMiddleware, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { action } = req.body as { action: "approve" | "reject" };
    if (!["approve", "reject"].includes(action)) { res.status(400).json({ error: "Invalid action" }); return; }
    const [payment] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id));
    if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
    if (action === "approve") {
      const days = payment.planId === "monthly" ? 30 : payment.planId === "quarterly" ? 90 : 365;
      const premiumUntil = new Date();
      const [user] = await db.select().from(users).where(eq(users.id, payment.userId));
      if (user?.isPremium && user.premiumUntil && user.premiumUntil > new Date()) {
        premiumUntil.setTime(user.premiumUntil.getTime());
      }
      premiumUntil.setDate(premiumUntil.getDate() + days);
      await db.update(users).set({ isPremium: true, premiumUntil }).where(eq(users.id, payment.userId));
      await db.update(paymentRequests).set({ status: "confirmed", confirmedAt: new Date() }).where(eq(paymentRequests.id, id));
    } else {
      await db.update(paymentRequests).set({ status: "rejected" }).where(eq(paymentRequests.id, id));
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Internal error" }); }
});

router.get("/admin/users", adminMiddleware, async (_req, res): Promise<void> => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    res.json(allUsers);
  } catch { res.status(500).json({ error: "Internal error" }); }
});

router.put("/admin/users/:id/premium", adminMiddleware, async (req, res): Promise<void> => {
  try {
    const userId = req.params.id as string;
    const { isPremium, days } = req.body as { isPremium: boolean; days?: number };
    let premiumUntil: Date | null = null;
    if (isPremium && days && days > 0) {
      premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + days);
    }
    await db.update(users).set({ isPremium, premiumUntil: isPremium && premiumUntil ? premiumUntil : null }).where(eq(users.id, userId));
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Internal error" }); }
});

router.get("/admin/settings", adminMiddleware, async (_req, res): Promise<void> => {
  try { res.json(await getSettings()); } catch { res.status(500).json({ error: "Internal error" }); }
});

router.put("/admin/settings", adminMiddleware, async (req, res): Promise<void> => {
  try {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      await db.insert(appSettings).values({ key, value }).onConflictDoUpdate({
        target: appSettings.key,
        set: { value, updatedAt: new Date() },
      });
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Internal error" }); }
});

export default router;
