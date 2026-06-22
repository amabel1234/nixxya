import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const pricing = pgTable("pricing", {
  id: serial("id").primaryKey(),
  daily: integer("daily").default(5000).notNull(),
  weekly: integer("weekly").default(25000).notNull(),
  monthly: integer("monthly").default(79000).notNull(),
  yearly: integer("yearly").default(699000).notNull(),
  dailyName: text("daily_name").default("Paket Harian").notNull(),
  weeklyName: text("weekly_name").default("Paket Mingguan").notNull(),
  monthlyName: text("monthly_name").default("Paket Bulanan").notNull(),
  yearlyName: text("yearly_name").default("Paket Tahunan").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Pricing = typeof pricing.$inferSelect;
