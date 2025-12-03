    -- Verification script for Supabase Learning Platform setup
    -- Run this after completing all setup steps to verify everything is configured correctly

    -- 1. Check if all required tables exist
    SELECT 
    'Tables Check' as check_type,
    CASE 
        WHEN COUNT(*) = 7 THEN '✅ All tables exist'
        ELSE '❌ Missing tables: ' || (7 - COUNT(*))::text || ' table(s) missing'
    END as status,
    string_agg(table_name, ', ') as details
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('instructors', 'courses', 'modules', 'lessons', 'enrollments', 'lesson_progress', 'course_progress');

    -- 2. Check if RLS is enabled on all tables
    SELECT 
    'RLS Check' as check_type,
    CASE 
        WHEN COUNT(*) = 7 THEN '✅ RLS enabled on all tables'
        ELSE '❌ RLS not enabled on: ' || string_agg(tablename, ', ')
    END as status,
    '' as details
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('instructors', 'courses', 'modules', 'lessons', 'enrollments', 'lesson_progress', 'course_progress')
    AND rowsecurity = false;

    -- 3. Check public read policies
    SELECT 
    'Public Read Policies' as check_type,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ Public read policies exist'
        ELSE '❌ Missing public read policies'
    END as status,
    string_agg(policyname, ', ') as details
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('instructors', 'courses', 'modules', 'lessons')
    AND policyname LIKE '%view%' OR policyname LIKE '%Public%';

    -- 4. Check admin policies for courses
    SELECT 
    'Courses Admin Policies' as check_type,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ Admin policies exist for courses'
        ELSE '❌ Missing admin policies for courses'
    END as status,
    string_agg(policyname, ', ') as details
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'courses'
    AND policyname LIKE '%Authenticated%';

    -- 5. Check admin policies for modules
    SELECT 
    'Modules Admin Policies' as check_type,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ Admin policies exist for modules'
        ELSE '❌ Missing admin policies for modules'
    END as status,
    string_agg(policyname, ', ') as details
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'modules'
    AND policyname LIKE '%Authenticated%';

    -- 6. Check admin policies for lessons
    SELECT 
    'Lessons Admin Policies' as check_type,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ Admin policies exist for lessons'
        ELSE '❌ Missing admin policies for lessons'
    END as status,
    string_agg(policyname, ', ') as details
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'lessons'
    AND policyname LIKE '%Authenticated%';

    -- 7. Check storage buckets
    SELECT 
    'Storage Buckets' as check_type,
    CASE 
        WHEN COUNT(*) >= 1 THEN '✅ Course images bucket exists'
        ELSE '❌ Course images bucket missing'
    END as status,
    string_agg(id, ', ') as details
    FROM storage.buckets 
    WHERE id = 'course-images';

    -- 8. Check storage policies for course-images
    SELECT 
    'Course Images Storage Policies' as check_type,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ Storage policies exist for course-images'
        ELSE '❌ Missing storage policies for course-images'
    END as status,
    string_agg(policyname, ', ') as details
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%course%';

    -- 9. Check indexes (performance)
    SELECT 
    'Indexes' as check_type,
    CASE 
        WHEN COUNT(*) >= 6 THEN '✅ Key indexes exist'
        ELSE '⚠️ Some indexes may be missing'
    END as status,
    COUNT(*)::text || ' indexes found' as details
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename IN ('courses', 'modules', 'lessons')
    AND indexname LIKE 'idx_%';

    -- 10. Check triggers (updated_at)
    SELECT 
    'Triggers' as check_type,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ Updated_at triggers exist'
        ELSE '⚠️ Some triggers may be missing'
    END as status,
    string_agg(tgname, ', ') as details
    FROM pg_trigger 
    WHERE tgname LIKE 'update_%_updated_at'
    AND NOT tgisinternal;

    -- Summary
    SELECT 
    '=== SETUP VERIFICATION SUMMARY ===' as summary,
    '' as status,
    'Review the results above to ensure all checks pass' as details;

