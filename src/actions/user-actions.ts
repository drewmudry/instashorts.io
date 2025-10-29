'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  if (!name || !email) {
    return { error: 'Name and email are required' };
  }

  try {
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
      })
      .returning();

    revalidatePath('/');
    return { success: true, user: newUser };
  } catch (error) {
    console.error('Error creating user:', error);
    return { error: 'Failed to create user' };
  }
}

export async function getUsers() {
  try {
    const allUsers = await db.select().from(users);
    return allUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

