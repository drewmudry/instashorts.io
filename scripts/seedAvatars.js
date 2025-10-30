// JavaScript version for easy execution with tsx
const { db } = require('../src/db');
const { avatars } = require('../src/db/schema');

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

  const data = await response.json();
  console.log(`✅ Fetched ${data.samples?.length || 0} samples`);
  
  return data;
}

async function seedAvatars() {
  try {
    console.log('🌱 Starting avatar seeding process...\n');

    // Fetch samples from Higgsfield
    const data = await fetchHiggsfieldSamples();
    
    if (!data.samples || data.samples.length === 0) {
      console.log('⚠️  No samples found to seed');
      return;
    }

    console.log(`\n📦 Processing ${data.samples.length} avatars...`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const sample of data.samples) {
      try {
        // Skip if no image URL
        if (!sample.image_url) {
          skipCount++;
          continue;
        }

        // Prepare avatar data
        const avatarData = {
          userId: null,
          prompt: sample.prompt || 'Sample avatar from Higgsfield',
          enhancedPrompt: sample.enhanced_prompt || null,
          imageUrl: sample.image_url,
          thumbnailUrl: sample.thumbnail_url || null,
          styleId: sample.style_id || null,
          styleName: sample.style_name || null,
          dimensions: sample.dimensions || '1152x2048',
          quality: sample.quality || '1080p',
          jobId: sample.id || `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'completed',
        };

        // Insert into database
        await db.insert(avatars).values(avatarData);
        successCount++;

        // Show progress every 20 items
        if (successCount % 20 === 0) {
          console.log(`  ✓ Inserted ${successCount} avatars...`);
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) {
          console.error(`  ✗ Error inserting avatar:`, error.message || error);
        }
      }
    }

    console.log('\n🎉 Seeding complete!');
    console.log(`  ✅ Successfully inserted: ${successCount}`);
    if (skipCount > 0) {
      console.log(`  ⏭️  Skipped: ${skipCount}`);
    }
    if (errorCount > 0) {
      console.log(`  ❌ Errors: ${errorCount}`);
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

