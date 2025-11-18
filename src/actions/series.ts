"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
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
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Failed to fetch series:", errorMessage);
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
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Failed to fetch videos in series:", errorMessage);
    return [];
  }
}

/**
 * Creates a new series with autopilot settings.
 */
export async function createSeries(formData: FormData) {
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
  const emojiCaptions = formData.get("emojiCaptions") === "true";
  const voiceId = (formData.get("voiceId") as string) || null;


  if (!theme) {
    return { error: "Theme is required" };
  }

  if (!artStyle) {
    return { error: "Art style is required" };
  }

  const newSeriesId = nanoid();

  try {
    await db.insert(series).values({
      id: newSeriesId,
      theme: theme,
      artStyle: artStyle,
      captionHighlightColor: captionHighlightColor,
      captionPosition: captionPosition,
      emojiCaptions: emojiCaptions,
      schedule: "daily", // Always daily
      voiceId: voiceId,
      isActive: true, // Start active by default
      userId: sessionData.user.id,
    });

    revalidatePath("/dashboard");
    revalidatePath("/series");

    return { success: true, seriesId: newSeriesId };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return { error: `Failed to create series: ${errorMessage}` };
  }
}

/**
 * Toggles the active status of a series (pause/resume autopilot).
 */
export async function toggleSeriesActive(seriesId: string) {
  const sessionData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionData?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    // First, verify the series belongs to the user
    const [seriesRecord] = await db
      .select()
      .from(series)
      .where(and(eq(series.id, seriesId), eq(series.userId, sessionData.user.id)))
      .limit(1);

    if (!seriesRecord) {
      return { error: "Series not found" };
    }

    // Toggle the active status
    await db
      .update(series)
      .set({ isActive: !seriesRecord.isActive })
      .where(eq(series.id, seriesId));

    revalidatePath("/dashboard");
    revalidatePath("/series");

    return { success: true, isActive: !seriesRecord.isActive };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return { error: `Failed to toggle series: ${errorMessage}` };
  }
}

