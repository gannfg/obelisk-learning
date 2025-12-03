# Missions Seed Data

This file contains seed data for 3 dummy missions that you can add to your database.

## How to Use

1. **Run the seed file in your Supabase SQL Editor:**
   ```sql
   -- Copy and paste the contents of seed-missions.sql
   -- Or run it directly if you have psql access
   ```

2. **Verify the missions were created:**
   ```sql
   SELECT id, title, difficulty, stack_type FROM missions ORDER BY order_index;
   ```

## Missions Created

### Mission 1: Build Your First Next.js App
- **Difficulty:** Beginner
- **Stack:** Next.js
- **Time:** 30 minutes
- **ID:** `mission-1`

### Mission 2: Create a REST API with Python
- **Difficulty:** Intermediate
- **Stack:** Python
- **Time:** 45 minutes
- **ID:** `mission-2`

### Mission 3: Deploy Your First Solana Program
- **Difficulty:** Advanced
- **Stack:** Solana
- **Time:** 60 minutes
- **ID:** `mission-3`

## Adding Images Later

When you're ready to add images for the missions:

1. **Option 1: Add image URL to missions table**
   - You can add an `image_url` column to the missions table:
   ```sql
   ALTER TABLE missions ADD COLUMN IF NOT EXISTS image_url TEXT;
   ```
   - Then update each mission:
   ```sql
   UPDATE missions 
   SET image_url = '/path/to/your/image.png' 
   WHERE id = 'mission-1'::uuid;
   ```

2. **Option 2: Store images in Supabase Storage**
   - Upload images to Supabase Storage bucket
   - Get the public URL
   - Update the missions table with the URL

3. **Option 3: Use public folder**
   - Place images in `/public/missions/` folder
   - Reference them as `/missions/mission-1.png` in your code

## Next Steps

After seeding:
1. Add your mission images (see above)
2. Test the missions page at `/missions`
3. Customize mission content as needed
4. Add more missions following the same pattern

