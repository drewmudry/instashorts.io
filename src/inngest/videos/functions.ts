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

    // Update the video in the DB with the new script
    // (as you requested)
    await db
      .update(video)
      .set({
        script: "THIS IS THE SCRIPT",
        status: "SCRIPT_GENERATED",
      })
      // @ts-expect-error - pnpm hoisting causes multiple drizzle-orm instances, causing type incompatibility
      .where(eq(video.id, videoId));

    // You could then trigger the *next* step, e.g., scene generation
    // await inngest.send({
    //   name: "video/script.generated",
    //   data: { videoId }
    // });

    return { message: `Script generated for video ${videoId}` };
  }
);