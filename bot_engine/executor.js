import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";

console.log("[Executor] Initializing...");

const connection = {
  host: "127.0.0.1",
  port: 6379,
};

const prisma = new PrismaClient();

const FAILURE_THRESHOLD = 3; // Disable bot after 3 consecutive failures

console.log("[Executor] Connecting to Redis for BullMQ worker...");

let worker;
try {
  worker = new Worker(
    "bot-execution",
    async (job) => {
      const { botId, userId, executionId, trigger } = job.data;
      const startTime = Date.now();

      console.log(
        `[Executor] Starting bot ${botId} for user ${userId} (trigger: ${trigger})`
      );

      try {
        // Log start
        await prisma.botExecutionLog.create({
          data: {
            executionId,
            botId,
            userId,
            status: "STARTED",
            trigger,
            startTime: new Date(),
          },
        });

        // Placeholder: Simulate bot execution
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Log success
        await prisma.botExecutionLog.updateMany({
          where: { executionId },
          data: {
            status: "SUCCESS",
            endTime: new Date(),
            durationMs: Date.now() - startTime,
          },
        });

        // Reset failure count
        await prisma.bot.updateMany({
          where: { id: botId },
          data: { consecutiveFailures: 0 },
        });

        console.log(`[Executor] Bot ${botId} executed successfully`);
      } catch (error) {
        console.error(`[Executor] Error executing bot ${botId}:`, error);

        // Log failure
        await prisma.botExecutionLog.updateMany({
          where: { executionId },
          data: {
            status: "FAILED",
            endTime: new Date(),
            durationMs: Date.now() - startTime,
            errorMessage: error.message,
          },
        });

        // Increment failure count
        const bot = await prisma.bot.update({
          where: { id: botId },
          data: {
            consecutiveFailures: { increment: 1 },
          },
        });

        // Disable bot if failure threshold exceeded
        if (bot.consecutiveFailures >= FAILURE_THRESHOLD) {
          await prisma.bot.update({
            where: { id: botId },
            data: { isActive: false },
          });
          console.warn(
            `[Executor] Bot ${botId} disabled after ${FAILURE_THRESHOLD} failures`
          );
        }

        throw error; // Let BullMQ handle retries
      }
    },
    {
      connection,
      concurrency: 5,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    }
  );
  console.log("[Executor] BullMQ worker connected and listening for jobs.");

  // Attach event listeners only if worker creation succeeded
  worker.on("completed", (job) => {
    console.log(`[Executor] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Executor] Job ${job.id} failed:`, err);
  });

  worker.on("error", (err) => {
    console.error("[Executor] Worker error:", err);
  });
} catch (error) {
  console.error("[Executor] Failed to initialize:", error);
  process.exit(1); // Exit if initialization fails
}
