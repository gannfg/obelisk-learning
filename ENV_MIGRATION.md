# Environment Variables Migration Guide

## What Changed

All references to `LANTAIDUA_UNIVERSAL_AUTH` have been changed to `OBELISK_LEARNING_AUTH` to reflect the Obelisk Learning branding.

## Updated Environment Variables

### Old Names (Deprecated)
```env
NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL
NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY
```

### New Names (Current)
```env
NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL
NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY
```

## Migration Steps

1. **Update your `.env.local` file:**
   ```bash
   # Rename the variables
   NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL=<your_old_lantaidua_url>
   NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY=<your_old_lantaidua_key>
   
   # Remove the old variables
   # NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL (remove this)
   # NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY (remove this)
   ```

2. **Restart your development server:**
   ```bash
   npm run dev
   ```

3. **Verify the setup:**
   ```bash
   node scripts/check-env.js
   ```

## Files Updated

The following files have been updated to use the new variable names:

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `lib/profile.ts`
- `app/api/webhooks/clerk/route.ts`
- `scripts/check-env.js`
- All documentation files

## Notes

- The Supabase project itself doesn't need to change - only the environment variable names
- Your existing Supabase URL and keys will work with the new variable names
- No database migrations are required
- The functionality remains exactly the same

## Troubleshooting

If you see errors about missing environment variables:

1. Check that `.env.local` exists in the project root
2. Verify the variable names match exactly (case-sensitive)
3. Restart your dev server after making changes
4. Run `node scripts/check-env.js` to verify your setup

