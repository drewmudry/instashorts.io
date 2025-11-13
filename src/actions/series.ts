// @ts-nocheck - Drizzle type compatibility issues due to pnpm peer dependency resolution
// These are false positive type errors - the code works correctly at runtime
"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/index";
import { video, series } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";

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

