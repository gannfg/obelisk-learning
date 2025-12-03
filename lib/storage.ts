/**
 * Storage utilities for Supabase Storage
 * Handles profile picture uploads and other user files
 */

const OBELISK_LEARNING_AUTH_SUPABASE_URL =
  process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL || '';
const OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY || '';

/**
 * Upload a profile picture to Supabase Storage
 * @param file - The file to upload
 * @param userId - The user ID
 * @param supabaseClient - Authenticated Supabase client
 * @returns The public URL of the uploaded image, or null if upload failed
 */
export async function uploadProfilePicture(
  file: File,
  userId: string,
  supabaseClient: any
): Promise<string | null> {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    // Path relative to bucket (not including bucket name)
    const filePath = `${userId}/${fileName}`;

    // Upload the file
    const { data, error } = await supabaseClient.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Replace existing file if it exists
      });

    if (error) {
      console.error('Error uploading profile picture:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabaseClient.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    return null;
  }
}

/**
 * Delete a profile picture from Supabase Storage
 * @param filePath - The path to the file (e.g., "avatars/user-id/filename.jpg")
 * @param supabaseClient - Authenticated Supabase client
 * @returns true if deletion was successful
 */
export async function deleteProfilePicture(
  filePath: string,
  supabaseClient: any
): Promise<boolean> {
  try {
    // Extract the path relative to the bucket
    const relativePath = filePath.includes('avatars/') 
      ? filePath.split('avatars/')[1] 
      : filePath;

    const { error } = await supabaseClient.storage
      .from('avatars')
      .remove([relativePath]);

    if (error) {
      console.error('Error deleting profile picture:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteProfilePicture:', error);
    return false;
  }
}

/**
 * Get the public URL for a profile picture
 * @param filePath - The path to the file
 * @param supabaseClient - Supabase client
 * @returns The public URL
 */
export function getProfilePictureUrl(
  filePath: string,
  supabaseClient: any
): string {
  // If it's already a full URL, return it
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Extract the path relative to the bucket
  const relativePath = filePath.includes('avatars/') 
    ? filePath.split('avatars/')[1] 
    : filePath;

  const { data } = supabaseClient.storage
    .from('avatars')
    .getPublicUrl(relativePath);

  return data.publicUrl;
}

/**
 * Upload a course thumbnail image to Supabase Storage
 * @param file - The file to upload
 * @param courseId - The course ID (optional, for organizing files)
 * @param supabaseClient - Authenticated Supabase client (from learning database)
 * @returns The public URL of the uploaded image, or null if upload failed
 */
export async function uploadCourseImage(
  file: File,
  courseId: string | null,
  supabaseClient: any
): Promise<string | null> {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = courseId 
      ? `${courseId}/${timestamp}.${fileExt}`
      : `${timestamp}.${fileExt}`;
    
    // Path relative to bucket (not including bucket name)
    const filePath = `courses/${fileName}`;

    // Upload the file
    const { data, error } = await supabaseClient.storage
      .from('course-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Replace existing file if it exists
      });

    if (error) {
      console.error('Error uploading course image:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabaseClient.storage
      .from('course-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadCourseImage:', error);
    return null;
  }
}

/**
 * Upload a mission image to Supabase Storage.
 * Reuses the public `course-images` bucket so missions and courses share the same image space.
 * @param file - The file to upload
 * @param missionId - The mission ID (optional, for organizing files)
 * @param supabaseClient - Authenticated Supabase client
 * @returns The public URL of the uploaded image, or null if upload failed
 */
export async function uploadMissionImage(
  file: File,
  missionId: string | null,
  supabaseClient: any
): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const fileName = missionId
      ? `${missionId}/${timestamp}.${fileExt}`
      : `${timestamp}.${fileExt}`;

    const filePath = `missions/${fileName}`;

    const { error } = await supabaseClient.storage
      .from("course-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading mission image:", error);
      return null;
    }

    const { data: urlData } = supabaseClient.storage
      .from("course-images")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadMissionImage:", error);
    return null;
  }
}

/**
 * Delete a course image from Supabase Storage
 * @param filePath - The path to the file (e.g., "course-images/course-id/filename.jpg")
 * @param supabaseClient - Authenticated Supabase client
 * @returns true if deletion was successful
 */
export async function deleteCourseImage(
  filePath: string,
  supabaseClient: any
): Promise<boolean> {
  try {
    // Extract the path relative to the bucket
    const relativePath = filePath.includes('course-images/') 
      ? filePath.split('course-images/')[1] 
      : filePath;

    const { error } = await supabaseClient.storage
      .from('course-images')
      .remove([relativePath]);

    if (error) {
      console.error('Error deleting course image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCourseImage:', error);
    return false;
  }
}

