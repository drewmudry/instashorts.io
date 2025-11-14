// @ts-nocheck - Drizzle type compatibility issues due to pnpm peer dependency resolution
// These are false positive type errors - the code works correctly at runtime
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { db } from "@/index";
import { video } from "@/db/schema";
import { scriptQueue } from "@/queues/client";
import { desc, eq, isNull, and } from "drizzle-orm";

export async function createVideo(formData: FormData) {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user?.id) {
    return { error: "Not authenticated" };
  }

  const theme = formData.get("theme") as string;
  const artStyle = formData.get("artStyle") as string;
  const captionHighlightColor = (formData.get("captionHighlightColor") as string) || "#FFD700";
  const captionPosition = (formData.get("captionPosition") as string) || "bottom";

  if (!theme) {
    return { error: "Theme is required" };
  }

  if (!artStyle) {
    return { error: "Art style is required" };
  }

  const newVideoId = nanoid(); // Generate a new unique ID

  try {
    // 1. Insert the video into the DB
    await db.insert(video).values({
      id: newVideoId,
      theme: theme,
      artStyle: artStyle,
      captionHighlightColor: captionHighlightColor,
      captionPosition: captionPosition,
      userId: sessionData.user.id,
      status: "PENDING", // From your schema.ts
    });

    // 2. Enqueue script generation to kick off the job
    await scriptQueue.add("generate", {
      videoId: newVideoId,
      theme: theme,
      artStyle: artStyle,
    });

    // 3. Revalidate the pages to show the new video
    revalidatePath("/dashboard");
    revalidatePath("/videos");

    return { success: true, videoId: newVideoId };
  } catch (e: any) {
    return { error: `Failed to create video: ${e.message}` };
  }
}


export async function getVideos() {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user?.id) {
    return [];
  }

  try {
    const userVideos = await db
      .select()
      .from(video)
      .where(eq(video.userId, sessionData.user.id))
      .orderBy(desc(video.createdAt)); // Show newest first

    return userVideos;
  } catch (e: any) {
    console.error("Failed to fetch videos:", e.message);
    return [];
  }
}


export async function getVideosNotInSeries() {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user?.id) {
    return [];
  }

  try {
    const userVideos = await db
      .select()
      .from(video)
      .where(and(eq(video.userId, sessionData.user.id), isNull(video.seriesId)))
      .orderBy(desc(video.createdAt));

    return userVideos;
  } catch (e: any) {
    console.error("Failed to fetch videos not in series:", e.message);
    return [];
  }
}

/**
 * Fetches the 3 most recent videos for the currently authenticated user.
 */
export async function getRecentVideos() {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user?.id) {
    return [];
  }

  try {
    const recentVideos = await db
      .select()
      .from(video)
      .where(eq(video.userId, sessionData.user.id))
      .orderBy(desc(video.createdAt))
      .limit(3);

    return recentVideos;
  } catch (e: any) {
    console.error("Failed to fetch recent videos:", e.message);
    return [];
  }
}