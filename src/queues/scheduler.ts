import { Queue } from "bullmq";
import { connection } from "./client";

// Create a new queue dedicated to scheduling
export const seriesSchedulerQueue = new Queue("series-scheduler", { connection });

/**
 * Sets up the repeatable job that will check all active series periodically.
 * This should be called once when the application starts (or in a separate process).
 */
export async function setupSeriesScheduler() {
  console.log("Setting up repeatable series scheduler job...");

  // Remove any existing repeatable jobs with the same key to avoid duplicates
  const repeatableJobs = await seriesSchedulerQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === "check-all-series") {
      await seriesSchedulerQueue.removeRepeatableByKey(job.key);
      console.log(`Removed existing repeatable job: ${job.key}`);
    }
  }

  // Add the repeatable job
  await seriesSchedulerQueue.add(
    "check-all-series", // Job name
    {}, // No data needed, it will check all series
    {
      repeat: {
        pattern: "0 0 * * *",
      },
      removeOnComplete: true,
      removeOnFail: 1000,
    }
  );

  console.log("✅ Scheduler job added. It will run daily at midnight UTC.");
}

// Run the setup when this file is executed directly
setupSeriesScheduler()
  .then(() => {
    console.log("Scheduler setup complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to set up scheduler:", error);
    process.exit(1);
  });

