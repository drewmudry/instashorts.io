#!/usr/bin/env tsx

/**
 * Script to generate preview images for each art style and upload them to GCS
 * 
 * Usage: tsx scripts/generate-art-style-previews.ts
 */

import Replicate from "replicate";
import { uploadBufferToGCS } from "../src/lib/gcs";
import "dotenv/config";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

// Art styles from art-style-selector.tsx
const ART_STYLES = [
  { id: "collage", name: "Collage", description: "Layered, mixed-media aesthetic" },
  { id: "cinematic", name: "Cinematic", description: "Film-like, dramatic visuals" },
  { id: "digital-art", name: "Digital Art", description: "Modern digital illustration" },
  { id: "neon-futuristic", name: "Neon Futuristic", description: "Cyberpunk, neon-lit scenes" },
  { id: "comic-book", name: "Comic Book", description: "Bold, stylized comic art" },
  { id: "playground", name: "Playground", description: "Bright, playful cartoon style" },
  { id: "4k-realistic", name: "4k Realistic", description: "Ultra-realistic, high detail" },
  { id: "cartoon", name: "Cartoon", description: "Classic animated style" },
  { id: "kawaii", name: "Kawaii", description: "Cute, Japanese-inspired" },
  { id: "anime", name: "Anime", description: "Japanese animation style" },
  { id: "line-art", name: "Line Art", description: "Minimalist line drawings" },
  { id: "japanese-ink", name: "Japanese Ink", description: "Traditional ink painting" },
] as const;

// Art style prompts from gemini.ts
const artStylePrompts: Record<string, string> = {
  "collage": "collage style, layered mixed-media aesthetic, paper cutouts, textured elements, artistic composition",
  "cinematic": "cinematic style, film-like quality, dramatic lighting, cinematic composition, movie aesthetic",
  "digital-art": "modern digital art style, digital illustration, vibrant colors, contemporary art",
  "neon-futuristic": "neon futuristic style, cyberpunk aesthetic, neon lights, futuristic urban environment, vibrant neon colors",
  "comic-book": "comic book style, bold lines, vibrant colors, stylized illustration, comic art aesthetic",
  "playground": "playground style, bright and playful cartoon aesthetic, cheerful colors, fun and energetic",
  "4k-realistic": "ultra-realistic 4K style, photorealistic, high detail, professional photography quality",
  "cartoon": "cartoon style, classic animation, expressive characters, vibrant colors, animated aesthetic",
  "kawaii": "kawaii style, cute Japanese aesthetic, pastel colors, adorable characters, soft and sweet",
  "anime": "anime style, Japanese animation aesthetic, expressive eyes, vibrant colors, anime art",
  "line-art": "line art style, minimalist black and white line drawings, clean lines, simple elegant",
  "japanese-ink": "Japanese ink painting style, sumi-e aesthetic, black and red ink, traditional Japanese art",
};

interface ArtStylePreview {
  id: string;
  name: string;
  description: string;
  icarusImageUrl: string;
  cleopatraImageUrl: string;
}

// Characters to use for consistent previews
const CHARACTERS = {
  icarus: {
    name: "Icarus",
    description: "Icarus, the Greek mythological figure with wings, flying through the sky",
    scene: "Icarus with wings made of wax and feathers, soaring through a dramatic sky, reaching toward the sun, with a determined expression, dynamic pose, classical Greek aesthetic"
  },
  cleopatra: {
    name: "Cleopatra",
    description: "Cleopatra, the legendary Egyptian queen",
    scene: "Cleopatra, the Egyptian queen, standing regally with elaborate headdress and traditional Egyptian jewelry, in an ancient Egyptian palace setting, confident and powerful pose, rich historical details"
  }
};

async function generateImageFromPrompt(prompt: string): Promise<Buffer> {
  const input = {
    prompt,
    prompt_upsampling: true,
    aspect_ratio: "4:3", // Match the UI aspect ratio for previews
  };

  console.log(`Generating image with prompt: ${prompt.substring(0, 100)}...`);

  const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

  let imageUrl: string;
  if (Array.isArray(output)) {
    imageUrl = output[0] as string;
  } else if (typeof output === "string") {
    imageUrl = output;
  } else {
    imageUrl = (output as any).url?.() || (output as any);
  }

  const response = await fetch(imageUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch image from Replicate: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generateArtStylePreviews(bucketName: string): Promise<ArtStylePreview[]> {
  const results: ArtStylePreview[] = [];

  console.log(`Generating preview images for ${ART_STYLES.length} art styles...`);
  console.log(`Using consistent characters: ${CHARACTERS.icarus.name} and ${CHARACTERS.cleopatra.name}\n`);

  for (const style of ART_STYLES) {
    try {
      console.log(`[${style.id}] Generating previews for "${style.name}"...`);
      
      const artStyleDescription = artStylePrompts[style.id] || style.description;
      
      // Generate Icarus preview
      console.log(`  → Generating ${CHARACTERS.icarus.name} preview...`);
      const icarusPrompt = `${CHARACTERS.icarus.scene}, ${artStyleDescription}, high quality, professional composition, suitable as a preview thumbnail`;
      const icarusBuffer = await generateImageFromPrompt(icarusPrompt);
      const icarusDestination = `art-styles/${style.id}-icarus.png`;
      const icarusImageUrl = await uploadBufferToGCS(
        bucketName,
        icarusBuffer,
        icarusDestination,
        "image/png"
      );
      console.log(`  ✓ ${CHARACTERS.icarus.name} uploaded: ${icarusImageUrl}`);

      // Generate Cleopatra preview
      console.log(`  → Generating ${CHARACTERS.cleopatra.name} preview...`);
      const cleopatraPrompt = `${CHARACTERS.cleopatra.scene}, ${artStyleDescription}, high quality, professional composition, suitable as a preview thumbnail`;
      const cleopatraBuffer = await generateImageFromPrompt(cleopatraPrompt);
      const cleopatraDestination = `art-styles/${style.id}-cleopatra.png`;
      const cleopatraImageUrl = await uploadBufferToGCS(
        bucketName,
        cleopatraBuffer,
        cleopatraDestination,
        "image/png"
      );
      console.log(`  ✓ ${CHARACTERS.cleopatra.name} uploaded: ${cleopatraImageUrl}`);

      results.push({
        id: style.id,
        name: style.name,
        description: style.description,
        icarusImageUrl,
        cleopatraImageUrl,
      });

      console.log(`[${style.id}] ✓ Completed "${style.name}"\n`);
    } catch (error) {
      console.error(`[${style.id}] ✗ Error:`, error);
      throw error;
    }
  }

  return results;
}

async function main() {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("REPLICATE_API_KEY environment variable is required");
  }

  const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || process.env.GCS_BUCKET_NAME || "instashorts-content";

  try {
    const previews = await generateArtStylePreviews(bucketName);
    
    console.log("\n" + "=".repeat(60));
    console.log(`✓ All preview images generated successfully!`);
    console.log(`  Generated ${previews.length} art styles × 2 characters = ${previews.length * 2} total images`);
    console.log("=".repeat(60) + "\n");
    
    // Output JSON for easy reference
    console.log("Preview URLs:");
    console.log(JSON.stringify(previews, null, 2));
    
    // Also save to a file
    const fs = await import("fs/promises");
    await fs.writeFile(
      "art-style-previews.json",
      JSON.stringify(previews, null, 2)
    );
    console.log("\n✓ Saved preview URLs to art-style-previews.json");
    
  } catch (error) {
    console.error("Failed to generate art style previews:", error);
    process.exit(1);
  }
}

main();

