import { Telegraf } from "telegraf";
import { botEnv } from "./env";

const bot = new Telegraf(botEnv.TELEGRAM_BOT_TOKEN);

// Get bot info to know the bot's username
let botUsername: string | undefined;
let botId: number | undefined;

// Initialize bot info
async function initializeBot() {
  if (!botEnv.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set in environment variables");
  }
  console.log("Fetching bot info from Telegram API...");
  const me = await bot.telegram.getMe();
  botUsername = me.username;
  botId = me.id;
  console.log(`Bot started: @${botUsername} (ID: ${botId})`);
}

/**
 * Listen for messages where the bot is mentioned
 * This handles both @mentions and replies to the bot
 */
bot.on("message", async (ctx) => {
  // Wait for bot username to be initialized
  if (!botUsername || !botId) {
    await initializeBot();
  }

  const message = ctx.message;

  // Type guard: check if message has text or caption
  const hasText = "text" in message;
  const hasCaption = "caption" in message;
  const messageText = hasText
    ? message.text
    : hasCaption
    ? message.caption
    : null;

  if (!messageText) {
    // Only process messages with text or caption
    return;
  }

  // Check if the message mentions the bot
  const hasMentionEntity =
    "entities" in message &&
    message.entities?.some(
      (entity: { type: string; offset: number; length: number }) =>
        entity.type === "mention" &&
        messageText
          .substring(entity.offset, entity.offset + entity.length)
          .toLowerCase() === `@${botUsername?.toLowerCase()}`
    );

  const isReplyToBot =
    "reply_to_message" in message &&
    (message.reply_to_message?.from?.id === botId ||
      message.reply_to_message?.from?.username === botUsername);

  const hasMentionInText = messageText
    .toLowerCase()
    .includes(`@${botUsername?.toLowerCase()}`);

  const isMentioned = hasMentionEntity || isReplyToBot || hasMentionInText;

  if (!isMentioned) {
    return;
  }

  try {
    // Prepare the message data to send to our server
    const messageData = {
      messageId: message.message_id,
      chatId: ctx.chat.id,
      chatType: ctx.chat.type,
      from: {
        id: message.from?.id,
        username: message.from?.username,
        firstName: message.from?.first_name,
        lastName: message.from?.last_name,
      },
      text: messageText,
      date: message.date,
      replyToMessageId:
        "reply_to_message" in message
          ? message.reply_to_message?.message_id
          : undefined,
      timestamp: new Date().toISOString(),
    };

    // Send the message to our server
    const serverUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookUrl = `${serverUrl}/api/telegram/webhook`;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      console.error(
        `Failed to send message to server: ${response.status} ${response.statusText}`
      );
    } else {
      console.log(
        `Message forwarded to server: ${messageData.messageId} from @${messageData.from.username}`
      );
    }
  } catch (error) {
    console.error("Error processing mention:", error);
  }
});

// Handle errors
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

export async function startBot() {
  try {
    console.log("Starting bot initialization...");
    // Initialize bot info before launching
    await initializeBot();
    console.log("Bot info initialized successfully");

    // Delete any existing webhook to ensure we use polling
    console.log("Clearing any existing webhook...");
    try {
      // Add timeout to webhook deletion
      const deleteWebhookPromise = bot.telegram.deleteWebhook({
        drop_pending_updates: true,
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Webhook deletion timeout")), 5000)
      );
      await Promise.race([deleteWebhookPromise, timeoutPromise]);
      console.log("Webhook cleared successfully");
    } catch (error) {
      console.warn(
        "Warning: Could not clear webhook (might not exist):",
        error instanceof Error ? error.message : error
      );
    }

    console.log("Launching bot...");
    // Launch bot with polling (default when no webhook is set)
    // Start the bot and don't wait for it to complete (it runs indefinitely)
    await bot.launch().catch((error) => {
      console.error("Error after bot launch:", error);
      process.exit(1);
    });

    // Give it a moment to start, then log success
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Telegram bot is running and listening for mentions...");
  } catch (error) {
    console.error("Failed to start bot:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    process.exit(1);
  }

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

export { bot };
