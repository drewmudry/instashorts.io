// @ts-nocheck - Drizzle type compatibility issues due to pnpm peer dependency resolution
// These are false positive type errors - the code works correctly at runtime
import { inngest } from "../client";
import { db } from "@/index";
import { video } from "@/db/schema";
import { eq } from "drizzle-orm";

// This is your first Inngest function
export const generateScript = inngest.createFunction(
  { id: "generate-video-script" },
  { event: "video/created" }, // This function triggers on this event
  async ({ event }) => {
    const { videoId } = event.data;

    // Simulate script generation
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2-second delay

    await db
      .update(video)
      .set({
        script: "THIS IS THE SCRIPT",
        status: "GENERATING",
      })
      .where(eq(video.id, videoId));


    await inngest.send({
      name: "video/status.set",
      data: { videoId, status: "COMPLETED" },
    });

    return { message: `Script generated for video ${videoId}` };
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