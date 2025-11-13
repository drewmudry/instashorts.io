// src/lib/ai/gemini.ts
import { createVertex } from "@ai-sdk/google-vertex";
import { generateText } from "ai";

export const vertex = createVertex({
  location: process.env.GOOGLE_VERTEX_LOCATION || "us-central1",
  project: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

export const createChatModel = (modelId = "gemini-2.5-flash") => {
  return vertex(modelId);
};

/**
 * Generates a video script based on a theme
 */
export async function generateVideoScript(theme: string): Promise<string> {
  const model = createChatModel();
  const { text } = await generateText({
    model,
    prompt: `Write a compelling 1 paragraph script for a short video about: ${theme}. Make it engaging, clear, and suitable for a short-form video format. The script should be in paragraph format and should not have any voice changes or other formatting. Be slightly poetic in a way that the listener/reader can appreciate a conclusive story or theme by the end of the script.
    The script should be approximately 50 words long. `,
  });
  return text;
}

/**
 * Generates a short title (less than 10 words, no punctuation) based on a theme
 */
export async function generateVideoTitle(theme: string): Promise<string> {
  const model = createChatModel();
  const { text } = await generateText({
    model,
    prompt: `Generate a short, catchy title (less than 10 words, no punctuation) for a video about: ${theme}. Return only the title text, nothing else.`,
  });
  // Clean up the title: remove punctuation and ensure it's under 10 words
  const cleaned = text
    .replace(/[^\w\s]/g, "") // Remove all punctuation
    .trim()
    .split(/\s+/)
    .slice(0, 10) // Take first 10 words max
    .join(" ");
  return cleaned;
}

export interface Scene {
  sceneIndex: number;
  image_prompt: string;
}
export async function generateVideoScenes(
  script: string,
  theme: string,
  sceneCount: number = 3,
  artStyle?: string | null
): Promise<Scene[]> {
  const model = createChatModel();
  
  // Map art style IDs to descriptive prompts
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

  const artStyleDescription = artStyle && artStylePrompts[artStyle] 
    ? artStylePrompts[artStyle] 
    : "consistent art style";

  const { text } = await generateText({
    model,
    prompt: `Based on this video script and theme, generate ${sceneCount} detailed scenes for a short video.

Script: ${script}
Theme: ${theme}
Art Style: ${artStyleDescription}

For each scene, create a detailed image prompt that includes:
- The specified art style: ${artStyleDescription}
- Color theme and vibe matching the art style
- Camera/animation style
- What's happening in the scene
- Who is doing what (if applicable)
- Background and foreground details
- Overall atmosphere and mood

IMPORTANT: All scenes must consistently use the ${artStyleDescription} art style throughout.

Return ONLY a valid JSON array with this exact structure:
[
  {"sceneIndex": 0, "image_prompt": "detailed description here"},
  {"sceneIndex": 1, "image_prompt": "detailed description here"},
  ...
]

Do not include any text before or after the JSON array.`,
  });

  // Parse the JSON response
  try {
    let jsonText = text.trim();
    if (jsonText.startsWith("```")) {
      // Remove opening ```json or ```
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, "");
      // Remove closing ```
      jsonText = jsonText.replace(/\s*```$/i, "");
      jsonText = jsonText.trim();
    }

    const scenes = JSON.parse(jsonText) as Scene[];
    // Ensure sceneIndex matches array position
    return scenes.map((scene, index) => ({
      ...scene,
      sceneIndex: index,
    }));
  } catch (error) {
    throw new Error(
      `Failed to parse scenes JSON: ${error}. Raw response: ${text.substring(
        0,
        200
      )}`
    );
  }
}
