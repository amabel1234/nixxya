import { pgTable, serial, text, integer, date } from "drizzle-orm/pg-core";

export const messageCounts = pgTable("message_counts", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull(),
  date: date("date").notNull(),
  count: integer("count").default(0).notNull(),
});

export type MessageCount = typeof messageCounts.$inferSelect;
