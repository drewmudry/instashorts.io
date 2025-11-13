import Replicate from "replicate";
import { uploadImageToGCS } from "@/lib/gcs";
import { nanoid } from "nanoid";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});


export async function generateImageFromPrompt(
  prompt: string
): Promise<Buffer> {
  const input = {
    prompt,
    prompt_upsampling: true,
    aspect_ratio: "9:16",
  };

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

/**
 * Generates an image using Replicate and uploads it to GCS
 * Returns the public URL of the uploaded image
 */
export async function generateAndUploadImage(
  prompt: string
): Promise<string> {
  const imageBuffer = await generateImageFromPrompt(prompt);
  const fileName = `scene_${nanoid()}.png`;

  // Upload the buffer to GCS
  const publicUrl = await uploadImageToGCS(imageBuffer, fileName);

  return publicUrl;
}

