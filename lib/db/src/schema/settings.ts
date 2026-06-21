import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type AppSetting = typeof appSettings.$inferSelect;

export const DEFAULT_SETTINGS: Record<string, string> = {
  qris_link: "",
  dana_number: "",
  dana_name: "Nixx AI",
  price_monthly: "15000",
  price_quarterly: "40000",
  price_yearly: "120000",
  daily_limit_free: "20",
  premium_model_ids:
    "gpt4o,perplexity,perplexed,felo,gemma,mistral,aoyo,gptoss120,gptoss20,gemini25v1,gemini25v2,grok4fast,grok3mini,grok3jail1,grok3jail2,venice,muslim,llama4,llama33,groqmini",
};
