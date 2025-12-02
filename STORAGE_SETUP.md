# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for profile pictures and user uploads.

## Quick Setup

1. **Open Supabase Dashboard** → SQL Editor
2. **Run the storage setup SQL**: Copy and paste the contents of `supabase/storage-setup.sql`
3. **Click "Run"** to execute

## What Gets Created

### Storage Buckets

1. **`avatars`** - Public bucket for profile pictures
   - Public access (images can be viewed directly)
   - 5MB file size limit
   - Accepts: JPEG, JPG, PNG, GIF, WEBP

2. **`user-uploads`** - Private bucket for user files (optional)
   - Private access (requires authentication)
   - 10MB file size limit
   - Accepts: Images, PDF, Text files

### Storage Policies

The setup creates RLS (Row Level Security) policies that ensure:
- ✅ Anyone can view public avatars
- ✅ Users can only upload/update/delete their own avatars
- ✅ Users can only access their own files in the user-uploads bucket

## File Path Structure

Files are stored with the following structure:
- **Avatars**: `avatars/{userId}/{timestamp}.{ext}`
- **User Uploads**: `user-uploads/{userId}/{filename}`

This ensures each user's files are organized in their own folder.

## Usage in Code

### Upload Profile Picture

```typescript
import { uploadProfilePicture } from '@/lib/storage';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const imageUrl = await uploadProfilePicture(file, userId, supabase);
```

### Get Profile Picture URL

```typescript
import { getProfilePictureUrl } from '@/lib/storage';

const url = getProfilePictureUrl(filePath, supabase);
```

### Delete Profile Picture

```typescript
import { deleteProfilePicture } from '@/lib/storage';

await deleteProfilePicture(filePath, supabase);
```

## Verify Setup

After running the SQL, verify the buckets exist:

1. Go to **Storage** in Supabase Dashboard
2. You should see two buckets: `avatars` and `user-uploads`
3. Check that the policies are set correctly:
   - Go to **Storage** → **Policies**
   - Verify policies for both buckets exist

## Troubleshooting

### Error: "Bucket does not exist"
- **Solution**: Run `supabase/storage-setup.sql` again

### Error: "new row violates row-level security policy"
- **Solution**: Check that storage policies were created correctly
- Verify the user is authenticated when uploading

### Error: "File size exceeds limit"
- **Solution**: The file is too large (avatars: 5MB max, uploads: 10MB max)
- Compress the image or use a smaller file

### Images not displaying
- **Solution**: 
  - Check that the `avatars` bucket is set to **public**
  - Verify the file path is correct
  - Check browser console for CORS errors

## Next Steps

After setting up storage:

1. ✅ Test uploading a profile picture in the profile page
2. ✅ Verify images display correctly
3. ✅ Test updating/deleting profile pictures
4. ✅ Check that users can only access their own files

## Security Notes

- The `avatars` bucket is public, so anyone with the URL can view images
- The `user-uploads` bucket is private and requires authentication
- RLS policies ensure users can only modify their own files
- File paths include user IDs to prevent unauthorized access

