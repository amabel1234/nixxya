import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo").default("").notNull(),
  qrisLink: text("qris_link").default("").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
