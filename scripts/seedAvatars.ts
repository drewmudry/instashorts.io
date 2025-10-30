import { config } from 'dotenv';

// Load environment variables FIRST before anything else
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { avatars } from '../src/db/schema';

// Create database connection after env is loaded
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle({ client: pool });

interface HiggsfieldItem {
  id: string;
  status: string;
  result?: {
    type: string;
    url: string;
  };
  results?: {
    raw?: {
      type: string;
      url: string;
    };
    min?: {
      type: string;
      url: string;
    };
  };
  params?: {
    prompt: string;
    width?: number;
    height?: number;
    quality?: string;
    style?: {
      id: string;
      name: string;
      url: string;
    };
    style_id?: string;
  };
  created_at?: number;
}

interface HiggsfieldResponse {
  items: HiggsfieldItem[];
  cursor?: string;
  total?: number;
}

async function fetchHiggsfieldSamples() {
  console.log('🔍 Fetching sample avatars from Higgsfield...');
  
  const response = await fetch('https://fnf.higgsfield.ai/soul-samples?size=200&cursor=1754954042.240207', {
    headers: {
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'origin': 'https://higgsfield.ai',
      'priority': 'u=1, i',
      'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'sec-gpc': '1',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: HiggsfieldResponse = await response.json();
  console.log(`✅ Fetched ${data.items?.length || 0} items (total: ${data.total || 'unknown'})`);
  
  return data;
}

async function seedAvatars() {
  try {
    console.log('🌱 Starting avatar seeding process...\n');

    // Fetch samples from Higgsfield
    const data = await fetchHiggsfieldSamples();
    
    if (!data.items || data.items.length === 0) {
      console.log('⚠️  No items found to seed');
      return;
    }

    console.log(`\n📦 Processing ${data.items.length} avatars...`);

    const avatarsToInsert = [];
    let skipCount = 0;

    for (const item of data.items) {
      // Get image URLs
      const imageUrl = item.results?.raw?.url || item.result?.url;
      const thumbnailUrl = item.results?.min?.url || null;
      
      // Skip if no image URL
      if (!imageUrl) {
        skipCount++;
        continue;
      }

      // Get dimensions
      const width = item.params?.width || 1152;
      const height = item.params?.height || 2048;
      const dimensions = `${width}x${height}`;

      // Prepare avatar data
      avatarsToInsert.push({
        userId: null, // No user association for seed data
        prompt: item.params?.prompt || 'Sample avatar from Higgsfield',
        enhancedPrompt: null,
        imageUrl: imageUrl,
        thumbnailUrl: thumbnailUrl,
        styleId: item.params?.style?.id || item.params?.style_id || null,
        styleName: item.params?.style?.name || null,
        dimensions: dimensions,
        quality: (item.params?.quality || '1080p') as '720p' | '1080p',
        jobId: item.id,
        status: item.status || 'completed',
      });
    }

    console.log(`  📝 Prepared ${avatarsToInsert.length} avatars for insertion...`);
    
    if (avatarsToInsert.length === 0) {
      console.log('⚠️  No valid avatars to insert');
      return;
    }

    // Bulk insert all avatars
    console.log(`  💾 Inserting ${avatarsToInsert.length} avatars into database...`);
    try {
      await db.insert(avatars).values(avatarsToInsert);
      console.log('\n🎉 Seeding complete!');
      console.log(`  ✅ Successfully inserted: ${avatarsToInsert.length}`);
      if (skipCount > 0) {
        console.log(`  ⏭️  Skipped: ${skipCount}`);
      }
    } catch (error) {
      console.error('❌ Bulk insert failed:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAvatars()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

