import { Queue } from "bullmq";
import cron from "node-cron";
import { v4 as uuidv4 } from "uuid";

console.log("[Scheduler] Initializing...");

// Redis connection options (default localhost)
const connection = {
  host: "127.0.0.1",
  port: 6379,
};

try {
  // Create a BullMQ queue for bot execution jobs
  console.log("[Scheduler] Connecting to Redis for BullMQ queue...");
  const botQueue = new Queue("bot-execution", { connection });
  console.log("[Scheduler] BullMQ queue connected.");

  // Example: Schedule all active bots every minute (placeholder logic)
  console.log("[Scheduler] Setting up cron schedule...");
  cron.schedule("* * * * *", async () => {
    console.log(
      "[Scheduler] Cron triggered: Triggering scheduled bot executions"
    );

    // TODO: Fetch active bots from DB
    const activeBots = [
      { id: "bot1", userId: "user1" },
      { id: "bot2", userId: "user2" },
    ];

    try {
      // Added try-catch for enqueueing
      for (const bot of activeBots) {
        await botQueue.add("execute-bot", {
          botId: bot.id,
          userId: bot.userId,
          executionId: uuidv4(),
          trigger: "scheduled",
        });
        console.log(`[Scheduler] Enqueued bot ${bot.id}`);
      }
    } catch (enqueueError) {
      console.error("[Scheduler] Error enqueueing jobs:", enqueueError);
    }
  });
  console.log("[Scheduler] Cron schedule set up. Waiting for triggers...");
} catch (error) {
  console.error("[Scheduler] Failed to initialize:", error);
  process.exit(1); // Exit if initialization fails
}

// Placeholder for event-driven triggers
// e.g., subscribe to price alerts, order fills, etc., then enqueue jobs similarly
