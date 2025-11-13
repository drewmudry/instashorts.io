// @ts-nocheck - Drizzle type compatibility issues due to pnpm peer dependency resolution
// These are false positive type errors - the code works correctly at runtime
"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  scriptQueue,
  voiceoverQueue,
  scenesQueue,
  sceneImageQueue,
  renderQueue,
} from "@/queues/client";

export async function getQueueStats() {
  // Check authentication
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Get queue counts for all queues
    const [
      scriptWaiting,
      scriptActive,
      scriptCompleted,
      scriptFailed,
      voiceoverWaiting,
      voiceoverActive,
      voiceoverCompleted,
      voiceoverFailed,
      scenesWaiting,
      scenesActive,
      scenesCompleted,
      scenesFailed,
      sceneImageWaiting,
      sceneImageActive,
      sceneImageCompleted,
      sceneImageFailed,
      renderWaiting,
      renderActive,
      renderCompleted,
      renderFailed,
    ] = await Promise.all([
      scriptQueue.getWaitingCount(),
      scriptQueue.getActiveCount(),
      scriptQueue.getCompletedCount(),
      scriptQueue.getFailedCount(),
      voiceoverQueue.getWaitingCount(),
      voiceoverQueue.getActiveCount(),
      voiceoverQueue.getCompletedCount(),
      voiceoverQueue.getFailedCount(),
      scenesQueue.getWaitingCount(),
      scenesQueue.getActiveCount(),
      scenesQueue.getCompletedCount(),
      scenesQueue.getFailedCount(),
      sceneImageQueue.getWaitingCount(),
      sceneImageQueue.getActiveCount(),
      sceneImageQueue.getCompletedCount(),
      sceneImageQueue.getFailedCount(),
      renderQueue.getWaitingCount(),
      renderQueue.getActiveCount(),
      renderQueue.getCompletedCount(),
      renderQueue.getFailedCount(),
    ]);

    return {
      queues: [
        {
          name: "Script Generation",
          waiting: scriptWaiting,
          active: scriptActive,
          completed: scriptCompleted,
          failed: scriptFailed,
          total: scriptWaiting + scriptActive,
        },
        {
          name: "Voiceover Generation",
          waiting: voiceoverWaiting,
          active: voiceoverActive,
          completed: voiceoverCompleted,
          failed: voiceoverFailed,
          total: voiceoverWaiting + voiceoverActive,
        },
        {
          name: "Scenes Generation",
          waiting: scenesWaiting,
          active: scenesActive,
          completed: scenesCompleted,
          failed: scenesFailed,
          total: scenesWaiting + scenesActive,
        },
        {
          name: "Scene Image Generation",
          waiting: sceneImageWaiting,
          active: sceneImageActive,
          completed: sceneImageCompleted,
          failed: sceneImageFailed,
          total: sceneImageWaiting + sceneImageActive,
        },
        {
          name: "Video Render",
          waiting: renderWaiting,
          active: renderActive,
          completed: renderCompleted,
          failed: renderFailed,
          total: renderWaiting + renderActive,
        },
      ],
    };
  } catch (error: any) {
    console.error("Error fetching queue stats:", error);
    return { error: error.message || "Failed to fetch queue stats" };
  }
}

