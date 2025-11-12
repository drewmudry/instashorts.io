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
    prompt: `Write a compelling 1 paragraph script for a short video about: ${theme}. Make it engaging, clear, and suitable for a short-form video format.`,
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
