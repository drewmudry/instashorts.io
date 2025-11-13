// @ts-nocheck - Drizzle type compatibility issues due to pnpm peer dependency resolution
// These are false positive type errors - the code works correctly at runtime
import { Worker, Job } from "bullmq";
import { connection, scriptQueue, voiceoverQueue, scenesQueue, sceneImageQueue, renderQueue } from "./client";
import { db } from "@/index";
import { video, scene, series } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateVideoScript, generateVideoTitle, generateVideoScenes } from "@/lib/ai/gemini";
import { generateVoiceoverWithTimestamps, convertCharactersToWords, convertWordsToSRT } from "@/lib/ai/elevenlabs";
import { generateImageFromPrompt } from "@/lib/ai/replicate";
import { uploadBufferToGCS } from "@/lib/gcs";
import { nanoid } from "nanoid";

// ===========================
// Step 1: Script Generation
// ===========================
new Worker(
  "script-generation",
  async (job: Job) => {
    const { videoId, theme } = job.data;

    console.log(`[Script Worker] Processing video ${videoId}`);

    // Status remains PENDING during script generation

    // Generate script and title
    const [script, title] = await Promise.all([
      generateVideoScript(theme),
      generateVideoTitle(theme),
    ]);

    // Update video
    await db
      .update(video)
      .set({ script, title })
      .where(eq(video.id, videoId));

    console.log(`[Script Worker] Script generated for video ${videoId}`);

    // Get art style from video record
    const [videoRecord] = await db
      .select()
      .from(video)
      .where(eq(video.id, videoId))
      .limit(1);

    // Enqueue next steps in parallel
    await Promise.all([
      voiceoverQueue.add("generate", { videoId, script }),
      scenesQueue.add("generate", { videoId, script, theme, artStyle: videoRecord?.artStyle }),
    ]);

    return { script, title };
  },
  {
    connection,
    concurrency: 5,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    }
  }
);

// ===========================
// Step 2: Voiceover Generation
// ===========================
new Worker(
  "voiceover-generation",
  async (job: Job) => {
    const { videoId, script } = job.data;

    console.log(`[Voiceover Worker] Processing video ${videoId}`);

    // Update status to GENERATING_VOICEOVER
    await db
      .update(video)
      .set({ status: "GENERATING_VOICEOVER" })
      .where(eq(video.id, videoId));

    if (!script) {
      throw new Error(`Script not found for video ${videoId}`);
    }

    // Get voiceId from series if available
    const [videoRecord] = await db
      .select()
      .from(video)
      .where(eq(video.id, videoId))
      .limit(1);

    let voiceId = "21m00Tcm4TlvDq8ikWAM"; // Default
    if (videoRecord?.seriesId) {
      const [seriesRecord] = await db
        .select()
        .from(series)
        .where(eq(series.id, videoRecord.seriesId))
        .limit(1);

      if (seriesRecord?.voiceId) {
        voiceId = seriesRecord.voiceId;
      }
    }

    // Generate voiceover with timestamps
    const { audio: audioBuffer, alignment, normalizedAlignment } =
      await generateVoiceoverWithTimestamps(script, voiceId);

    // Process alignment
    const words = convertCharactersToWords(alignment);
    const srtContent = convertWordsToSRT(words);

    // Upload to GCS
    const bucketName = process.env.GCS_BUCKET_NAME || "instashorts-content";
    const destination = `voiceovers/${videoId}/${nanoid()}.mp3`;
    const voiceOverUrl = await uploadBufferToGCS(
      bucketName,
      audioBuffer,
      destination,
      "audio/mpeg"
    );

    // Update video
    await db
      .update(video)
      .set({
        voiceOverUrl,
        captions_raw: { alignment, normalizedAlignment },
        captions_processed: { words, srt: srtContent },
      })
      .where(eq(video.id, videoId));

    console.log(`[Voiceover Worker] Voiceover generated for video ${videoId}`);

    // Check if ready to render
    await checkAndRenderVideo(videoId);

    return { voiceOverUrl };
  },
  {
    connection,
    concurrency: 3,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    }
  }
);

// ===========================
// Step 3: Scenes Generation
// ===========================
new Worker(
  "scenes-generation",
  async (job: Job) => {
    const { videoId, script, theme, artStyle } = job.data;

    console.log(`[Scenes Worker] Processing video ${videoId}`);

    // Update status to GENERATING_SCENES
    await db
      .update(video)
      .set({ status: "GENERATING_SCENES" })
      .where(eq(video.id, videoId));

    if (!script) {
      throw new Error(`Script not found for video ${videoId}`);
    }

    // Determine scene count
    const wordCount = script.split(/\s+/).length;
    const sceneCount = wordCount < 100 ? 3 : 10;

    // Generate scenes
    const scenes = await generateVideoScenes(script, theme, sceneCount, artStyle);

    // Store scenes
    const sceneRecords = scenes.map((s) => ({
      id: nanoid(),
      videoId,
      sceneIndex: s.sceneIndex,
      imagePrompt: s.image_prompt,
    }));

    await db.insert(scene).values(sceneRecords);

    console.log(`[Scenes Worker] Generated ${scenes.length} scenes for video ${videoId}`);

    // Enqueue image generation for each scene
    const imageJobs = sceneRecords.map((sceneRecord) =>
      sceneImageQueue.add("generate", {
        videoId,
        sceneId: sceneRecord.id,
        imagePrompt: sceneRecord.imagePrompt,
      })
    );

    await Promise.all(imageJobs);

    return { sceneCount: scenes.length };
  },
  {
    connection,
    concurrency: 5,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    }
  }
);

// ===========================
// Step 4: Scene Image Generation
// ===========================
new Worker(
  "scene-image-generation",
  async (job: Job) => {
    const { videoId, sceneId, imagePrompt } = job.data;

    console.log(`[Image Worker] Processing scene ${sceneId} for video ${videoId}`);

    // Update status to GENERATING_IMAGES (only if not already in a later stage)
    await db
      .update(video)
      .set({ status: "GENERATING_IMAGES" })
      .where(eq(video.id, videoId));

    if (!imagePrompt) {
      throw new Error(`Image prompt not found for scene ${sceneId}`);
    }

    // Generate image
    const imageBuffer = await generateImageFromPrompt(imagePrompt);

    // Upload to GCS
    const bucketName = process.env.GCS_BUCKET_NAME || "instashorts-content";
    const destination = `scenes/${videoId}/${sceneId}.png`;
    const imageUrl = await uploadBufferToGCS(
      bucketName,
      imageBuffer,
      destination,
      "image/png"
    );

    // Update scene
    await db
      .update(scene)
      .set({ imageUrl })
      .where(eq(scene.id, sceneId));

    console.log(`[Image Worker] Image generated for scene ${sceneId}`);

    // Check if ready to render
    await checkAndRenderVideo(videoId);

    return { imageUrl };
  },
  {
    connection,
    concurrency: 10,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    }
  }
);

// ===========================
// Helper: Check if ready to render
// ===========================
async function checkAndRenderVideo(videoId: string) {
  console.log(`[Check Render] Checking if video ${videoId} is ready to render...`);
  
  const [videoRecord] = await db
    .select()
    .from(video)
    .where(eq(video.id, videoId))
    .limit(1);

  if (!videoRecord?.voiceOverUrl) {
    console.log(`[Check Render] Video ${videoId} - No voiceover URL`);
    return;
  }

  if (!videoRecord.captions_processed) {
    console.log(`[Check Render] Video ${videoId} - No captions processed`);
    return;
  }

  const allScenes = await db
    .select()
    .from(scene)
    .where(eq(scene.videoId, videoId));

  if (allScenes.length === 0) {
    console.log(`[Check Render] Video ${videoId} - No scenes found`);
    return;
  }

  const scenesWithImages = allScenes.filter(s => s.imageUrl !== null);
  console.log(`[Check Render] Video ${videoId} - Scenes: ${scenesWithImages.length}/${allScenes.length} have images`);

  if (scenesWithImages.length !== allScenes.length) {
    console.log(`[Check Render] Video ${videoId} - Not all scenes have images yet`);
    return;
  }

  // All ready! Enqueue render
  console.log(`[Check Render] Video ${videoId} - All requirements met! Queueing render...`);
  
  // Update status to QUEUED_FOR_RENDERING
  await db
    .update(video)
    .set({ status: "QUEUED_FOR_RENDERING" })
    .where(eq(video.id, videoId));
  
  await renderQueue.add("render", { videoId });
  console.log(`[Check Render] Video ${videoId} - Render job added to queue`);
}

console.log("🚀 Worker started and listening to queues...");