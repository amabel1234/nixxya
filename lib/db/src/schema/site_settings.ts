import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").default("Nixx AI").notNull(),
  logoUrl: text("logo_url").default("").notNull(),
  bannerUrl: text("banner_url").default("").notNull(),
  themeColor: text("theme_color").default("#7c3aed").notNull(),
  freeLimit: integer("free_limit").default(20).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
