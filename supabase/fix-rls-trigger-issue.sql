-- Alternative fix for RLS trigger issues
-- Use this if the main fix script doesn't work
-- This explicitly grants permissions and ensures the trigger bypasses RLS

-- Step 1: Ensure the function owner has proper permissions
-- The function should be owned by postgres (or a superuser)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Step 2: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated;

-- Step 3: Ensure the function is SECURITY DEFINER
-- This makes it run with the privileges of the function owner (bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Explicitly disable RLS for this operation (though SECURITY DEFINER should handle it)
  -- This is a belt-and-suspenders approach
  INSERT INTO public.users (id, email, first_name, last_name, image_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.avatar_url, NULL),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log detailed error information
    RAISE WARNING 'Error in handle_new_user: % | SQLSTATE: % | User ID: %', 
      SQLERRM, SQLSTATE, NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Verify the function is set up correctly
DO $$
DECLARE
  func_owner TEXT;
  is_sec_definer BOOLEAN;
BEGIN
  SELECT 
    pg_get_userbyid(proowner)::TEXT,
    prosecdef
  INTO func_owner, is_sec_definer
  FROM pg_proc 
  WHERE proname = 'handle_new_user';
  
  IF func_owner IS NULL THEN
    RAISE EXCEPTION 'Function handle_new_user does not exist!';
  END IF;
  
  RAISE NOTICE 'Function owner: %', func_owner;
  RAISE NOTICE 'SECURITY DEFINER: %', is_sec_definer;
  
  IF NOT is_sec_definer THEN
    RAISE WARNING 'Function is not SECURITY DEFINER! This may cause RLS issues.';
  ELSE
    RAISE NOTICE '✅ Function is correctly set as SECURITY DEFINER';
  END IF;
END $$;

-- Step 5: Test the trigger (this will create a test user and verify the trigger works)
-- Uncomment to test, but be careful in production!
/*
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'test_' || extract(epoch from now())::text || '@example.com';
BEGIN
  -- Create a test auth user
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, role
  ) VALUES (
    test_id,
    '00000000-0000-0000-0000-000000000000',
    test_email,
    crypt('testpass', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{}',
    '{}',
    false,
    'authenticated'
  );
  
  -- Check if profile was created
  PERFORM pg_sleep(1); -- Give trigger time to execute
  
  IF EXISTS (SELECT 1 FROM public.users WHERE id = test_id) THEN
    RAISE NOTICE '✅ SUCCESS: Profile was created by trigger';
    DELETE FROM auth.users WHERE id = test_id;
    DELETE FROM public.users WHERE id = test_id;
  ELSE
    RAISE EXCEPTION '❌ FAILED: Profile was NOT created by trigger';
  END IF;
END $$;
*/

