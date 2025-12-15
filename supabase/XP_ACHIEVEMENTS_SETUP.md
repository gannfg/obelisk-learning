# XP, Achievements, and Badges Setup Guide

This guide explains how to set up the XP, achievements, and badges system for users.

## Overview

The system consists of:
1. **XP (Experience Points)** - Stored in Auth Supabase `users` table
2. **Badges** - Stored in Learning Supabase `badges` table
3. **XP History** - Optional tracking of XP sources in Learning Supabase
4. **Achievement Milestones** - Defines milestones that award badges

## Database Setup

### Step 1: Auth Supabase - Add XP Column

Run the first part of `xp-achievements-badges-setup.sql` in your **Auth Supabase** project:

```sql
-- Add XP column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC) WHERE xp > 0;
```

Or run the full script and it will handle this automatically.

### Step 2: Learning Supabase - Badges System

Run the second part of `xp-achievements-badges-setup.sql` in your **Learning Supabase** project. This creates:

- `badges` table - Stores user badges
- `xp_history` table - Optional XP transaction log
- `achievement_milestones` table - Defines milestone achievements
- RLS policies for security
- Helper functions

## Tables Structure

### Badges Table

```sql
badges (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,           -- Auth Supabase user ID
  course_id UUID,                  -- Optional: for course badges
  badge_name TEXT NOT NULL,        -- e.g., "Solana Mastery", "Workshop Attendee"
  badge_type TEXT,                 -- 'course', 'workshop', 'mission', 'milestone', 'other'
  description TEXT,                -- Optional description
  earned_at TIMESTAMP,             -- When badge was earned
  metadata JSONB                   -- Additional data (workshop_id, etc.)
)
```

### XP History Table (Optional)

```sql
xp_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,         -- XP amount (can be negative)
  source TEXT NOT NULL,             -- 'workshop_attendance', 'course_completed', etc.
  source_id UUID,                   -- Optional: ID of source
  description TEXT,
  created_at TIMESTAMP
)
```

### Achievement Milestones Table

```sql
achievement_milestones (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,                 -- e.g., "Workshop Enthusiast"
  description TEXT,
  badge_name TEXT,                 -- Badge to award
  milestone_type TEXT,              -- 'workshop_count', 'course_count', etc.
  threshold INTEGER,                -- Number required (e.g., 5)
  metadata JSONB
)
```

## Usage Examples

### Awarding XP

```typescript
import { awardXP } from "@/lib/progress";

await awardXP(userId, 100, "workshop_attendance", authSupabase);
```

### Awarding Badges

```typescript
// Course completion badge
await supabase.from("badges").insert({
  user_id: userId,
  course_id: courseId,
  badge_name: `${courseName} Mastery`,
  badge_type: "course",
  description: `Completed ${courseName} course`
});

// Workshop badge
await supabase.from("badges").insert({
  user_id: userId,
  badge_name: "Workshop Attendee",
  badge_type: "workshop",
  metadata: { workshop_id: workshopId }
});
```

### Checking Milestones

```sql
-- Check if user should get a milestone badge
SELECT * FROM check_and_award_milestone(
  'user-id-here'::UUID,
  'workshop_count',
  5  -- current workshop count
);
```

## Default Milestones

The setup script automatically creates these milestones:

1. **Workshop Enthusiast** - Awarded for attending 5 workshops
2. **Workshop Master** - Awarded for attending 10 workshops

You can add more milestones by inserting into `achievement_milestones`:

```sql
INSERT INTO achievement_milestones (name, description, badge_name, milestone_type, threshold)
VALUES 
  ('Course Master', 'Complete 10 courses', 'Course Master', 'course_count', 10),
  ('XP Champion', 'Reach 10,000 XP', 'XP Champion', 'xp_threshold', 10000);
```

## Security

- **RLS Enabled**: All tables have Row Level Security enabled
- **Public Read**: Badges are publicly readable (for profiles, leaderboards)
- **Authenticated Write**: Only authenticated users can insert badges/XP history
- **Application Verification**: Application should verify `user_id` matches authenticated user

## Migration from Existing System

If you already have a `badges` table with a different structure:

1. **Backup existing data**:
   ```sql
   CREATE TABLE badges_backup AS SELECT * FROM badges;
   ```

2. **Drop and recreate**:
   ```sql
   DROP TABLE badges CASCADE;
   -- Then run the setup script
   ```

3. **Migrate data** (if needed):
   ```sql
   INSERT INTO badges (user_id, badge_name, earned_at)
   SELECT user_id, badge_name, earned_at FROM badges_backup;
   ```

## Troubleshooting

### XP Column Not Found

If you see errors about the `xp` column not existing:
1. Make sure you ran the Auth Supabase migration
2. Check that the column exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'xp';`

### Badge Insertion Fails

1. Check RLS policies are set correctly
2. Verify user is authenticated
3. Check for duplicate badge constraints

### Milestone Function Not Working

1. Ensure function exists: `SELECT * FROM pg_proc WHERE proname = 'check_and_award_milestone';`
2. Check grants: `GRANT EXECUTE ON FUNCTION check_and_award_milestone TO authenticated;`

## Next Steps

After setup:
1. Test XP awarding with `awardXP()`
2. Test badge creation
3. Set up milestone checking in your application
4. Update UI to display XP and badges

