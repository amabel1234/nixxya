import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  amount: integer("amount").notNull(),
  qrisRef: text("qris_ref"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export type Payment = typeof payments.$inferSelect;
