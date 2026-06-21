import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, users, messageUsage } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { getSettings } from "../admin";

const router: IRouter = Router();

async function ensureUser(userId: string, email?: string) {
  const [existing] = await db.select().from(users).where(eq(users.id, userId));
  if (!existing) {
    await db.insert(users).values({ id: userId, email: email ?? `${userId}@clerk.local` });
    return (await db.select().from(users).where(eq(users.id, userId)))[0];
  }
  return existing;
}

router.get("/user/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const user = await ensureUser(auth.userId);
  const now = new Date();
  const isActuallyPremium = user.isPremium && (!user.premiumUntil || user.premiumUntil > now);
  if (user.isPremium && !isActuallyPremium) {
    await db.update(users).set({ isPremium: false }).where(eq(users.id, user.id));
  }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    isPremium: isActuallyPremium,
    premiumUntil: user.premiumUntil,
  });
});

router.get("/user/usage", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await ensureUser(auth.userId);

  const today = new Date().toISOString().split("T")[0];
  const [usage] = await db.select().from(messageUsage)
    .where(and(eq(messageUsage.userId, auth.userId), eq(messageUsage.usageDate, today)));

  const s = await getSettings();
  const limit = parseInt(s.daily_limit_free, 10) || 20;

  res.json({ used: usage?.count ?? 0, limit });
});

export { ensureUser };
export default router;
