'use server';

import { db } from '@/db';
import { avatars } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface SaveAvatarInput {
  userId?: string;
  prompt: string;
  imageUrl: string;
  thumbnailUrl?: string;
  styleId?: string;
  styleName?: string;
  dimensions: string;
  quality: string;
  jobId: string;
  status?: string;
  enhancedPrompt?: string;
}

/**
 * Save a generated avatar to the database
 */
export async function saveAvatar(input: SaveAvatarInput) {
  try {
    const [avatar] = await db
      .insert(avatars)
      .values({
        userId: input.userId,
        prompt: input.prompt,
        imageUrl: input.imageUrl,
        thumbnailUrl: input.thumbnailUrl,
        styleId: input.styleId,
        styleName: input.styleName,
        dimensions: input.dimensions,
        quality: input.quality,
        jobId: input.jobId,
        status: input.status || 'completed',
        enhancedPrompt: input.enhancedPrompt,
      })
      .returning();

    revalidatePath('/');
    return avatar;
  } catch (error) {
    console.error('Error saving avatar:', error);
    throw error;
  }
}

/**
 * Get all avatars from the database
 * @param limit - Maximum number of avatars to return (default: 50)
 */
export async function getAvatars(limit: number = 50) {
  try {
    const allAvatars = await db
      .select()
      .from(avatars)
      .orderBy(desc(avatars.createdAt))
      .limit(limit);

    return allAvatars;
  } catch (error) {
    console.error('Error fetching avatars:', error);
    throw error;
  }
}

/**
 * Get a single avatar by ID
 */
export async function getAvatarById(id: number) {
  try {
    const [avatar] = await db.select().from(avatars).where(eq(avatars.id, id));
    return avatar;
  } catch (error) {
    console.error('Error fetching avatar:', error);
    throw error;
  }
}

/**
 * Get all avatars for a specific user
 */
export async function getAvatarsByUserId(userId: string) {
  try {
    const userAvatars = await db
      .select()
      .from(avatars)
      .where(eq(avatars.userId, userId))
      .orderBy(desc(avatars.createdAt));

    return userAvatars;
  } catch (error) {
    console.error('Error fetching user avatars:', error);
    throw error;
  }
}

/**
 * Get an avatar by job ID
 */
export async function getAvatarByJobId(jobId: string) {
  try {
    const [avatar] = await db.select().from(avatars).where(eq(avatars.jobId, jobId));
    return avatar;
  } catch (error) {
    console.error('Error fetching avatar by job ID:', error);
    throw error;
  }
}

/**
 * Delete an avatar by ID
 */
export async function deleteAvatar(id: number) {
  try {
    await db.delete(avatars).where(eq(avatars.id, id));
    revalidatePath('/');
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw error;
  }
}

