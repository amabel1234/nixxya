import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, users, messageUsage } from "@workspace/db";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();
const FREE_DAILY_LIMIT = 20;

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
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
  });
});

router.get("/user/usage", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await ensureUser(auth.userId);

  const today = new Date().toISOString().split("T")[0];
  const [usage] = await db.select().from(messageUsage)
    .where(and(eq(messageUsage.userId, auth.userId), eq(messageUsage.usageDate, today)));

  res.json({ used: usage?.count ?? 0, limit: FREE_DAILY_LIMIT });
});

export { ensureUser };
export default router;
