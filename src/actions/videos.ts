// @ts-nocheck - Drizzle type compatibility issues due to pnpm peer dependency resolution
// These are false positive type errors - the code works correctly at runtime
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { db } from "@/index";
import { video, series } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { desc, eq, isNull, and } from "drizzle-orm";

export async function createVideo(formData: FormData) {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user?.id) {
    return { error: "Not authenticated" };
  }

  const theme = formData.get("theme") as string;

  if (!theme) {
    return { error: "Theme is required" };
  }

  const newVideoId = nanoid(); // Generate a new unique ID

  try {
    // 1. Insert the video into the DB
    await db.insert(video).values({
      id: newVideoId,
      theme: theme,
      userId: sessionData.user.id,
      status: "PENDING", // From your schema.ts
    });

    // 2. Send an event to Inngest to kick off the job
    await inngest.send({
      name: "video/created", // This name matches your function trigger
      data: {
        videoId: newVideoId,
      },
    });

    // 3. Revalidate the pages to show the new video
    revalidatePath("/dashboard");
    revalidatePath("/videos");

    return { success: true, videoId: newVideoId };
  } catch (e: any) {
    return { error: `Failed to create video: ${e.message}` };
  }
}

/**
 * Fetches all videos for the currently authenticated user.
 */
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

/**
 * Fetches videos that are NOT part of a series for the currently authenticated user.
 */
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
 * Fetches all series for the currently authenticated user.
 */
export async function getSeries() {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user?.id) {
    return [];
  }

  try {
    const userSeries = await db
      .select()
      .from(series)
      .where(eq(series.userId, sessionData.user.id))
      .orderBy(desc(series.createdAt));

    return userSeries;
  } catch (e: any) {
    console.error("Failed to fetch series:", e.message);
    return [];
  }
}

/**
 * Fetches all videos in a specific series.
 */
export async function getVideosInSeries(seriesId: string) {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user?.id) {
    return [];
  }

  try {
    const seriesVideos = await db
      .select()
      .from(video)
      .where(and(eq(video.userId, sessionData.user.id), eq(video.seriesId, seriesId)))
      .orderBy(desc(video.createdAt));

    return seriesVideos;
  } catch (e: any) {
    console.error("Failed to fetch videos in series:", e.message);
    return [];
  }
}