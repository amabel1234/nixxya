import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./users";

export const subscriptionPlans = [
  { id: "monthly",   label: "Bulanan",     price: 15000, days: 30  },
  { id: "quarterly", label: "3 Bulan",     price: 40000, days: 90  },
  { id: "yearly",    label: "Tahunan",     price: 120000, days: 365 },
] as const;

export type PlanId = typeof subscriptionPlans[number]["id"];

export const paymentRequests = pgTable("payment_requests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  planId: text("plan_id").notNull(),
  amountRp: integer("amount_rp").notNull(),
  status: text("status").notNull().default("pending"), // pending | confirmed | rejected
  danaNumber: text("dana_number"),
  note: text("note"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PaymentRequest = typeof paymentRequests.$inferSelect;
