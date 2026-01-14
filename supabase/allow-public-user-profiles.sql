  -- Allow guests (anonymous users) to view user profiles
  -- This enables public profile viewing for better discoverability

  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Public can view user profiles" ON users;

  -- Create policy to allow public read access to user profiles
  -- This allows guests to view basic user information (name, username, bio, image, etc.)
  CREATE POLICY "Public can view user profiles"
    ON users
    FOR SELECT
    USING (true);  -- Allow anyone (including anonymous users) to read user profiles

  -- Note: This policy allows public read access to all user profile fields
  -- Users can still only update their own profiles via the existing update policy
  -- If you want to restrict certain fields from public view, you can:
  -- 1. Create a view with only public fields
  -- 2. Use column-level security (if supported)
  -- 3. Filter fields in the application layer
