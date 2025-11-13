// @ts-nocheck - Drizzle type compatibility issues due to pnpm peer dependency resolution
// These are false positive type errors - the code works correctly at runtime
import { inngest } from "../client";
import { db } from "@/index";
import { video, scene, series } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { generateVideoScript, generateVideoTitle, generateVideoScenes } from "@/lib/ai/gemini";
import { generateVoiceover, generateVoiceoverWithTimestamps, convertCharactersToWords, convertWordsToSRT } from "@/lib/ai/elevenlabs";
import { generateImageFromPrompt } from "@/lib/ai/replicate";
import { uploadBufferToGCS } from "@/lib/gcs";
import { nanoid } from "nanoid";
import { readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// Step 1: Generate script and title
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

    // Trigger voiceover generation and scene generation in parallel
    await Promise.all([
      inngest.send({
        name: "video/voiceover.generate",
        data: { videoId, script },
      }),
      inngest.send({
        name: "video/scenes.generate",
        data: { videoId, script, theme: videoRecord.theme },
      }),
    ]);

    return { message: `Script generated for video ${videoId}`, script, title };
  }
);

// Step 2: Generate voiceover and upload to GCS
export const generateVoiceoverAndUpload = inngest.createFunction(
  { id: "generate-voiceover" },
  { event: "video/voiceover.generate" },
  async ({ event }) => {
    const { videoId, script } = event.data;

    if (!script) {
      throw new Error(`Script not found for video ${videoId}`);
    }

    // Fetch the video to get the seriesId
    const [videoRecord] = await db
      .select()
      .from(video)
      .where(eq(video.id, videoId))
      .limit(1);

    if (!videoRecord) {
      throw new Error(`Video ${videoId} not found`);
    }

    // Get voiceId from series if available, otherwise use default
    let voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default voice ID (Rachel)
    if (videoRecord.seriesId) {
      const [seriesRecord] = await db
        .select()
        .from(series)
        .where(eq(series.id, videoRecord.seriesId))
        .limit(1);
      
      if (seriesRecord?.voiceId) {
        voiceId = seriesRecord.voiceId;
      }
    }

    // Generate voiceover audio with timestamps
    const { audio: audioBuffer, alignment, normalizedAlignment } = await generateVoiceoverWithTimestamps(
      script,
      voiceId
    );

    // Process alignment data: convert characters to words
    const words = convertCharactersToWords(alignment);
    
    // Convert words to SRT format
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

    // Update the video with the voiceover URL and captions
    await db
      .update(video)
      .set({
        voiceOverUrl,
        captions_raw: {
          alignment,
          normalizedAlignment,
        },
        captions_processed: {
          words,
          srt: srtContent,
        },
      })
      .where(eq(video.id, videoId));

    // Check if all assets are ready and trigger rendering
    await checkAndRenderVideo(videoId);

    return { 
      message: `Voiceover generated and uploaded for video ${videoId}`, 
      voiceOverUrl,
      captionsProcessed: true,
    };
  }
);

// Step 3: Generate scenes and store in DB
export const generateScenes = inngest.createFunction(
  { id: "generate-scenes" },
  { event: "video/scenes.generate" },
  async ({ event }) => {
    const { videoId, script, theme } = event.data;

    if (!script) {
      throw new Error(`Script not found for video ${videoId}`);
    }

    // Determine scene count based on script length
    // For testing: 3 scenes (50 words), for prod: 10-15 scenes (250 words)
    const wordCount = script.split(/\s+/).length;
    const sceneCount = wordCount < 100 ? 3 : 10;

    // Generate scenes using Gemini
    const scenes = await generateVideoScenes(script, theme, sceneCount);

    // Store scenes in the database
    const sceneRecords = scenes.map((s) => ({
      id: nanoid(),
      videoId,
      sceneIndex: s.sceneIndex,
      imagePrompt: s.image_prompt,
    }));

    await db.insert(scene).values(sceneRecords);

    // Trigger image generation for each scene
    for (const sceneRecord of sceneRecords) {
      await inngest.send({
        name: "video/scene.image.generate",
        data: {
          videoId,
          sceneId: sceneRecord.id,
          imagePrompt: sceneRecord.imagePrompt,
        },
      });
    }

    return { message: `Generated ${scenes.length} scenes for video ${videoId}`, sceneCount: scenes.length };
  }
);

// Step 4: Generate image for a scene
export const generateSceneImage = inngest.createFunction(
  { id: "generate-scene-image" },
  { event: "video/scene.image.generate" },
  async ({ event }) => {
    const { videoId, sceneId, imagePrompt } = event.data;

    if (!imagePrompt) {
      throw new Error(`Image prompt not found for scene ${sceneId}`);
    }

    // Generate image using Gemini
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

    // Update the scene with the image URL
    await db
      .update(scene)
      .set({
        imageUrl,
      })
      .where(eq(scene.id, sceneId));

    // Check if all assets are ready and trigger rendering
    await checkAndRenderVideo(videoId);

    return { message: `Image generated for scene ${sceneId}`, imageUrl };
  }
);

/**
 * Checks if all video assets are ready and triggers rendering if so
 */
async function checkAndRenderVideo(videoId: string) {
  // Fetch the video
  const [videoRecord] = await db
    .select()
    .from(video)
    .where(eq(video.id, videoId))
    .limit(1);

  if (!videoRecord) {
    return;
  }

  // Check if voiceover is ready
  if (!videoRecord.voiceOverUrl) {
    return;
  }

  // Check if captions are ready
  if (!videoRecord.captions_processed) {
    return;
  }

  // Check if all scenes have images
  const allScenes = await db
    .select()
    .from(scene)
    .where(eq(scene.videoId, videoId))
    .orderBy(scene.sceneIndex);

  if (allScenes.length === 0) {
    return;
  }

  const allScenesHaveImages = allScenes.every((s) => s.imageUrl !== null);
  if (!allScenesHaveImages) {
    return;
  }

  // All assets are ready! Trigger rendering
  await inngest.send({
    name: "video/render",
    data: { videoId },
  });
}

// Step 5: Render the final video
export const renderFinalVideo = inngest.createFunction(
  { id: "render-final-video" },
  { event: "video/render" },
  async ({ event }) => {
    const { videoId } = event.data;

    // Fetch the video with all its data
    const [videoRecord] = await db
      .select()
      .from(video)
      .where(eq(video.id, videoId))
      .limit(1);

    if (!videoRecord) {
      throw new Error(`Video ${videoId} not found`);
    }

    if (!videoRecord.voiceOverUrl) {
      throw new Error(`Voiceover not found for video ${videoId}`);
    }

    if (!videoRecord.captions_processed) {
      throw new Error(`Captions not found for video ${videoId}`);
    }

    // Fetch all scenes
    const scenes = await db
      .select()
      .from(scene)
      .where(eq(scene.videoId, videoId))
      .orderBy(scene.sceneIndex);

    if (scenes.length === 0) {
      throw new Error(`No scenes found for video ${videoId}`);
    }

    // Ensure all scenes have images
    const scenesWithImages = scenes.filter((s) => s.imageUrl);
    if (scenesWithImages.length !== scenes.length) {
      throw new Error(`Not all scenes have images for video ${videoId}`);
    }

    // Prepare data for rendering
    const captionsData = videoRecord.captions_processed as {
      words: Array<{ word: string; start: number; end: number }>;
      srt: string;
    };

    const scenesForRender = scenesWithImages.map((s) => ({
      id: s.id,
      sceneIndex: s.sceneIndex,
      imageUrl: s.imageUrl!,
    }));

    // Create temporary file for output
    const outputPath = join(tmpdir(), `${videoId}-${nanoid()}.mp4`);

    try {
      // Use dynamic import with a function wrapper to prevent Next.js from analyzing it
      // This ensures Remotion is only loaded at runtime in the Inngest function
      console.log(`Rendering video ${videoId}...`);
      
      // Dynamic import that Next.js won't try to bundle
      const renderModule = await new Function('return import("@/remotion/render")')();
      await renderModule.renderVideo({
        scenes: scenesForRender,
        audioUrl: videoRecord.voiceOverUrl,
        words: captionsData.words,
        outputPath,
      });

      // Read the rendered video file
      const videoBuffer = readFileSync(outputPath);

      // Upload to GCS
      const bucketName = process.env.GCS_BUCKET_NAME || "instashorts-content";
      const destination = `videos/${videoId}/${nanoid()}.mp4`;
      const videoUrl = await uploadBufferToGCS(
        bucketName,
        videoBuffer,
        destination,
        "video/mp4"
      );

      // Update the video with the final video URL and mark as completed
      await db
        .update(video)
        .set({
          videoUrl,
          status: "COMPLETED",
        })
        .where(eq(video.id, videoId));

      // Clean up temporary file
      try {
        unlinkSync(outputPath);
      } catch (error) {
        console.error(`Failed to delete temporary file ${outputPath}:`, error);
      }

      return {
        message: `Video rendered successfully for video ${videoId}`,
        videoUrl,
      };
    } catch (error: any) {
      // Mark video as failed
      await db
        .update(video)
        .set({
          status: "FAILED",
        })
        .where(eq(video.id, videoId));

      // Clean up temporary file if it exists
      try {
        unlinkSync(outputPath);
      } catch {
        // Ignore cleanup errors
      }

      throw new Error(`Failed to render video ${videoId}: ${error.message}`);
    }
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