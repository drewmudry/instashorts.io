import { Worker, Job } from "bullmq";
import { connection, scriptQueue } from "./client";
import { db } from "@/index";
import { video, series } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateText } from "ai";
import { vertex } from "@/lib/ai/gemini";

/**
 * Generates a new, specific video topic from a master theme.
 * For example, if the master theme is "Ancient Rome", this might return
 * "The invention of Roman concrete" or "The life of a Legionary".
 */
async function generateNewVideoTopic(masterTheme: string): Promise<string> {
  const model = vertex("gemini-2.5-flash"); // Use your existing Gemini setup
  const { text } = await generateText({
    model,
    prompt: `You are an AI assistant for a video generation app.
    A user has a video Series with the main theme: "${masterTheme}".
    Generate one new, specific, and interesting sub-topic for a 1-minute video about this theme.
    
    For example, if the theme is 'Ancient Rome', a good sub-topic is 'The invention of Roman concrete' or 'The life of a Legionary'.
    If the theme is 'Psychology Facts', a good sub-topic is 'The Dunning-Kruger Effect' or 'What is Cognitive Dissonance'.
    
    Return ONLY the new sub-topic text, nothing else.`,
  });
  return text.trim();
}

// Listen to the scheduler queue
new Worker(
  "series-scheduler",
  async (job: Job) => {
    if (job.name === "check-all-series") {
      console.log("[Series Worker] Running scheduled job: checking all active series...");

      // 1. Find all active series
      const activeSeries = await db
        .select()
        .from(series)
        .where(eq(series.isActive, true));

      console.log(`[Series Worker] Found ${activeSeries.length} active series.`);

      for (const s of activeSeries) {
        try {
          // Skip if no theme is set
          if (!s.theme) {
            console.log(`[Series Worker] Skipping series "${s.name}" - no theme set.`);
            continue;
          }

          // 2. Generate a new, specific video topic
          const newVideoTheme = await generateNewVideoTopic(s.theme);
          const newVideoId = nanoid();

          console.log(`[Series Worker] New topic for series "${s.name}": "${newVideoTheme}"`);

          // 3. Create a new video record in the DB, copying all settings from the series
          await db.insert(video).values({
            id: newVideoId,
            theme: newVideoTheme, // The NEW specific theme
            artStyle: s.artStyle || null,
            captionHighlightColor: s.captionHighlightColor || "#FFD700",
            captionPosition: s.captionPosition || "bottom",
            emojiCaptions: s.emojiCaptions || false,
            userId: s.userId,
            seriesId: s.id, // IMPORTANT: Link it to the series
            status: "PENDING",
          });

          // 4. Kick off the EXISTING video pipeline
          //    This is the same as your createVideo action
          await scriptQueue.add("generate", {
            videoId: newVideoId,
            theme: newVideoTheme,
            artStyle: s.artStyle,
          });

          console.log(`[Series Worker] ✅ Queued new video ${newVideoId} for series ${s.id}.`);

        } catch (error) {
          console.error(`[Series Worker] ❌ Failed to process series ${s.id}:`, error);
          // Continue processing other series even if one fails
        }
      }

      console.log(`[Series Worker] ✅ Completed processing all active series.`);
    }
  },
  {
    connection,
    concurrency: 1, // Process one job at a time to avoid overwhelming the system
  }
);

console.log("🚀 Series Worker started and listening to 'series-scheduler' queue...");

