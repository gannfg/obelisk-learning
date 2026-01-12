-- Universal script to mark a user as having completed all modules in any class
-- Run this in your Learning Supabase SQL Editor
-- 
-- USAGE OPTIONS:
-- 
-- Option 1: By Email and Class Name (Easiest - recommended)
--   1. Replace the email and class name below
--   2. Run the script
--
-- Option 2: By UUIDs (If Option 1 doesn't work)
--   1. Get the user UUID from Auth Supabase:
--      SELECT id, email FROM auth.users WHERE email = 'user@example.com';
--   2. Get the class UUID:
--      SELECT id, title FROM classes WHERE title ILIKE '%Class Name%';
--   3. Set use_uuids = true and replace the UUIDs below

DO $$
DECLARE
    -- Configuration: Choose your method
    use_uuids BOOLEAN := true;  -- Set to true if you want to use UUIDs directly
    
    -- Option 1: By Email and Class Name (recommended)
    v_user_email TEXT := 'user@example.com';      -- Replace with user email
    v_class_name TEXT := 'Gamejam';               -- Class name for fallback lookup
    
    -- Option 2: By UUIDs (if use_uuids = true)
    -- Replace these with actual UUIDs when using UUID method
    v_user_id TEXT := 'faa90e6f-ea34-4ac6-bd40-75edaf5d6100';  -- User UUID
    v_class_id TEXT := 'CLASS_UUID_HERE';                      -- Will be found by class name
    
    -- Internal variables
    v_found_user_id UUID;
    v_found_class_id UUID;
    v_class_title TEXT;
    v_week INTEGER;
BEGIN
    -- Method 1: Lookup by email and class name
    IF NOT use_uuids THEN
        -- Find user by email (from auth.users - if accessible)
        -- Note: This requires access to auth.users schema
        -- If this fails, you'll need to use UUIDs instead
        BEGIN
            SELECT id INTO v_found_user_id
            FROM auth.users
            WHERE email = v_user_email
            LIMIT 1;
            
            IF v_found_user_id IS NULL THEN
                RAISE EXCEPTION 'User with email % not found. Please use UUID method instead.', v_user_email;
            END IF;
            
            RAISE NOTICE 'Found user: % (%)', v_user_email, v_found_user_id;
        EXCEPTION
            WHEN insufficient_privilege OR undefined_table THEN
                RAISE EXCEPTION 'Cannot access auth.users. Please set use_uuids = true and provide UUIDs manually.';
        END;
        
        -- Find class by name
        SELECT id, title INTO v_found_class_id, v_class_title
        FROM classes
        WHERE title ILIKE '%' || v_class_name || '%'
        LIMIT 1;
        
        IF v_found_class_id IS NULL THEN
            RAISE EXCEPTION 'Class matching "%" not found', v_class_name;
        END IF;
        
    -- Method 2: Use provided UUIDs (or find class by name if class_id is placeholder)
    ELSE
        -- Validate and convert user UUID
        IF v_user_id = 'USER_UUID_HERE' THEN
            RAISE EXCEPTION 'Please replace USER_UUID_HERE with actual user UUID when using UUID method.';
        END IF;
        
        BEGIN
            v_found_user_id := v_user_id::UUID;
        EXCEPTION
            WHEN invalid_text_representation THEN
                RAISE EXCEPTION 'Invalid user UUID format. Please check your UUID value.';
        END;
        
        RAISE NOTICE 'Using provided user UUID: %', v_found_user_id;
        
        -- Find class by name if class_id is placeholder, otherwise use provided UUID
        IF v_class_id = 'CLASS_UUID_HERE' THEN
            -- Try to find class by name (fallback to Gamejam if v_class_name is set)
            IF v_class_name IS NOT NULL AND v_class_name != 'Class Name' THEN
                SELECT id, title INTO v_found_class_id, v_class_title
                FROM classes
                WHERE title ILIKE '%' || v_class_name || '%'
                LIMIT 1;
                
                IF v_found_class_id IS NULL THEN
                    RAISE EXCEPTION 'Class matching "%" not found', v_class_name;
                END IF;
            ELSE
                -- Default to Gamejam if no class name specified
                SELECT id, title INTO v_found_class_id, v_class_title
                FROM classes
                WHERE title ILIKE '%Gamejam%'
                LIMIT 1;
                
                IF v_found_class_id IS NULL THEN
                    RAISE EXCEPTION 'Class "Gamejam!" not found. Please provide class UUID or name.';
                END IF;
            END IF;
        ELSE
            -- Use provided class UUID
            BEGIN
                v_found_class_id := v_class_id::UUID;
            EXCEPTION
                WHEN invalid_text_representation THEN
                    RAISE EXCEPTION 'Invalid class UUID format. Please check your UUID value.';
            END;
            
            -- Verify class exists
            SELECT id, title INTO v_found_class_id, v_class_title
            FROM classes
            WHERE id = v_found_class_id;
            
            IF v_found_class_id IS NULL THEN
                RAISE EXCEPTION 'Class with UUID % not found', v_class_id;
            END IF;
        END IF;
        
        RAISE NOTICE 'Found class: % (%)', v_class_title, v_found_class_id;
    END IF;
    
    RAISE NOTICE 'Found class: % (%)', v_class_title, v_found_class_id;
    
    -- Mark attendance for all weeks
    FOR v_week IN 
        SELECT DISTINCT week_number 
        FROM class_modules 
        WHERE class_id = v_found_class_id 
        ORDER BY week_number
    LOOP
        INSERT INTO class_attendance (class_id, user_id, week_number, method, checked_in_by)
        VALUES (v_found_class_id, v_found_user_id, v_week, 'manual', v_found_user_id)
        ON CONFLICT (class_id, user_id, week_number) DO UPDATE
        SET checked_in_at = TIMEZONE('utc', NOW()),
            method = 'manual',
            checked_in_by = v_found_user_id;
        
        RAISE NOTICE 'Marked attendance for week %', v_week;
    END LOOP;
    
    RAISE NOTICE 'Successfully marked all attendance for class "%"!', v_class_title;
    RAISE NOTICE 'Badges will be awarded automatically if configured.';
END $$;

-- Verify the attendance was marked (run this after the DO block):
-- Replace the values with your actual email/class name or UUIDs
/*
-- If using email/class name:
SELECT 
    ca.week_number,
    cm.title as module_title,
    ca.checked_in_at
FROM class_attendance ca
JOIN class_modules cm ON cm.class_id = ca.class_id AND cm.week_number = ca.week_number
WHERE ca.class_id = (SELECT id FROM classes WHERE title ILIKE '%Class Name%' LIMIT 1)
  AND ca.user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com' LIMIT 1)
ORDER BY ca.week_number;

-- If using UUIDs:
SELECT 
    ca.week_number,
    cm.title as module_title,
    ca.checked_in_at
FROM class_attendance ca
JOIN class_modules cm ON cm.class_id = ca.class_id AND cm.week_number = ca.week_number
WHERE ca.class_id = 'CLASS_UUID_HERE'
  AND ca.user_id = 'USER_UUID_HERE'
ORDER BY ca.week_number;
*/
