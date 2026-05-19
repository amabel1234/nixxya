import { pgTable, serial, text, integer, date } from "drizzle-orm/pg-core";
import { users } from "./users";

export const messageUsage = pgTable("message_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  usageDate: date("usage_date").notNull(),
  count: integer("count").notNull().default(0),
});

export type MessageUsage = typeof messageUsage.$inferSelect;

export const FREE_DAILY_LIMIT = 20;
