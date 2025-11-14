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
  const emojiCaptions = formData.get("emojiCaptions") === "true";

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
      emojiCaptions: emojiCaptions,
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
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return { error: `Failed to create video: ${errorMessage}` };
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
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Failed to fetch videos:", errorMessage);
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
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Failed to fetch videos not in series:", errorMessage);
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
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Failed to fetch recent videos:", errorMessage);
    return [];
  }
}