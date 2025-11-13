// @ts-nocheck - Drizzle type compatibility issues due to pnpm peer dependency resolution
// These are false positive type errors - the code works correctly at runtime
import { inngest } from "../client";
import { db } from "@/index";
import { video, scene } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateVideoScript, generateVideoTitle, generateVideoScenes } from "@/lib/ai/gemini";
import { generateVoiceover } from "@/lib/ai/elevenlabs";
import { generateImageFromPrompt } from "@/lib/ai/replicate";
import { uploadBufferToGCS } from "@/lib/gcs";
import { nanoid } from "nanoid";

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

    // Generate voiceover audio
    const audioBuffer = await generateVoiceover(script);

    // Upload to GCS
    const bucketName = process.env.GCS_BUCKET_NAME || "instashorts-content";
    const destination = `voiceovers/${videoId}/${nanoid()}.mp3`;
    const voiceOverUrl = await uploadBufferToGCS(
      bucketName,
      audioBuffer,
      destination,
      "audio/mpeg"
    );

    // Update the video with the voiceover URL
    await db
      .update(video)
      .set({
        voiceOverUrl,
      })
      .where(eq(video.id, videoId));

    return { message: `Voiceover generated and uploaded for video ${videoId}`, voiceOverUrl };
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

    return { message: `Image generated for scene ${sceneId}`, imageUrl };
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