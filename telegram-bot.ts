#!/usr/bin/env node
/**
 * Telegram Bot Runner
 *
 * This script starts the Telegram bot that listens for mentions.
 * Run with: npm run bot
 *
 * Make sure to set TELEGRAM_BOT_TOKEN in your .env file
 */

// Load environment variables from .env file before importing anything else
import { config } from "dotenv";

config();

import { startBot } from "./src/server/telegram/bot.js";

// Start the bot
startBot().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exit(1);
});
