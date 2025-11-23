import { config } from "dotenv";
import { z } from "zod";

config();

/**
 * Minimal environment configuration for the Telegram bot
 * This allows the bot to run without requiring DATABASE_URL
 */
const botEnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const botEnv = botEnvSchema.parse({
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  NODE_ENV: process.env.NODE_ENV ?? "development",
});
