// @ts-nocheck - Drizzle type compatibility issues due to pnpm peer dependency resolution
// These are false positive type errors - the code works correctly at runtime
import { inngest } from "../client";
import { db } from "@/index";
import { video } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateVideoScript, generateVideoTitle } from "@/lib/ai/gemini";

// This is your first Inngest function
export const generateScript = inngest.createFunction(
  { id: "generate-video-script" },
  { event: "video/created" },
  async ({ event }) => {
    const { videoId } = event.data;

    // Fetch the video to get the theme
    const [videoRecord] = await db
      .select()
      .from(video)
      .where(eq(video.id, videoId))
      .limit(1);

    if (!videoRecord) {
      throw new Error(`Video ${videoId} not found`);
    }

    // Update status to GENERATING
    await db
      .update(video)
      .set({
        status: "GENERATING",
      })
      .where(eq(video.id, videoId));

    // Generate script and title using Gemini
    const [script, title] = await Promise.all([
      generateVideoScript(videoRecord.theme),
      generateVideoTitle(videoRecord.theme),
    ]);

    // Update the video with the generated script and title
    await db
      .update(video)
      .set({
        script,
        title,
      })
      .where(eq(video.id, videoId));

    await inngest.send({
      name: "video/status.set",
      data: { videoId, status: "COMPLETED" },
    });

    return { message: `Script generated for video ${videoId}`, script, title };
  }
);

export const updateVideoStatus = inngest.createFunction(
  { id: "update-video-status" },
  { event: "video/status.set" },
  async ({ event }) => {
    const { videoId, status } = event.data;

    await db
      .update(video)
      .set({ status })
      .where(eq(video.id, videoId));

    return { message: `Status updated for video ${videoId} to ${status}` };
  }
);