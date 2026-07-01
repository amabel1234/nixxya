import { Router } from "express";
  import { getAuth } from "@clerk/express";
  import { db, appSettings } from "@workspace/db";
  import { eq } from "drizzle-orm";

  const DEFAULT: Record<string, string> = {
    qris_link: "",
    dana_number: "",
    dana_name: "Nixx AI",
    price_monthly: "15000",
    price_quarterly: "40000",
    price_yearly: "120000",
    pricing_tiers: "",
  };

  async function getSettings(): Promise<Record<string, string>> {
    try {
      const rows = await db.select().from(appSettings);
      const result = { ...DEFAULT };
      rows.forEach((r) => { result[r.key] = r.value; });
      return result;
    } catch { return { ...DEFAULT }; }
  }

  async function upsert(key: string, value: string) {
    const existing = await db.select().from(appSettings).where(eq(appSettings.key, key));
    if (existing.length) {
      await db.update(appSettings).set({ value, updatedAt: new Date() }).where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value });
    }
  }

  const router = Router();

  // Public: pricing tiers + payment info
  router.get("/", async (_req, res): Promise<void> => {
    try {
      const s = await getSettings();
      let plans: any[] = [];
      if (s.pricing_tiers) {
        try { plans = JSON.parse(s.pricing_tiers); } catch {}
      }
      if (!plans.length) {
        plans = [
          { id: "monthly",   name: "Bulanan",  duration: "30 hari",  price: parseInt(s.price_monthly)   || 15000, popular: false },
          { id: "quarterly", name: "3 Bulan",  duration: "90 hari",  price: parseInt(s.price_quarterly) || 40000, popular: true  },
          { id: "yearly",    name: "Tahunan",  duration: "365 hari", price: parseInt(s.price_yearly)    || 120000, popular: false },
        ];
      }
      res.json({ plans, qrisLink: s.qris_link, danaNumber: s.dana_number, danaName: s.dana_name });
    } catch { res.status(500).json({ error: "Internal error" }); }
  });

  // Admin: POST — update any settings keys
  router.post("/admin", async (req, res): Promise<void> => {
    const auth = getAuth(req);
    if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    try {
      const updates = req.body as Record<string, string>;
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === "string") await upsert(key, value);
      }
      res.json({ ok: true });
    } catch { res.status(500).json({ error: "Internal error" }); }
  });

  // Admin: GET — read all settings
  router.get("/admin", async (req, res): Promise<void> => {
    const auth = getAuth(req);
    if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    try { res.json(await getSettings()); }
    catch { res.status(500).json({ error: "Internal error" }); }
  });

  export default router;
  