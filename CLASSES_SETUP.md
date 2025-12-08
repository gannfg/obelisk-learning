# Semester-Based Classes Management System

## Overview

This system provides comprehensive admin management for semester-based classes with weekly modules, live sessions, enrollments, assignments, announcements, and gamification integration.

## Database Setup

1. **Run the schema migration:**
   ```sql
   -- Run this in your Learning Supabase SQL Editor
   -- File: supabase/classes-schema.sql
   ```

   This creates the following tables:
   - `users` - Minimal users table (id, is_admin) - **MUST BE SYNCED FROM AUTH SUPABASE**
   - `classes` - Semester-based classes
   - `class_modules` - Weekly curriculum modules
   - `live_sessions` - Live class sessions with QR code attendance
   - `class_enrollments` - Student enrollments
   - `session_attendance` - Attendance tracking per session
   - `class_assignments` - Module assignments
   - `assignment_submissions` - Student submissions
   - `class_announcements` - Class announcements
   - `class_instructors` - Many-to-many instructor assignments
   - `class_xp_config` - XP rewards configuration

2. **Sync Admin Users from Auth Supabase:**
   
   After running the schema, you need to sync admin users from your Auth Supabase to the Learning Supabase `users` table.
   
   **Option A: Manual Sync (Quick Setup)**
   ```sql
   -- Run this in Learning Supabase SQL Editor
   -- Replace with your actual admin user IDs from Auth Supabase
   INSERT INTO users (id, is_admin) 
   VALUES 
     ('user-uuid-from-auth-supabase-1', TRUE),
     ('user-uuid-from-auth-supabase-2', TRUE)
   ON CONFLICT (id) DO UPDATE SET is_admin = EXCLUDED.is_admin;
   ```
   
   **Option B: Get User IDs from Auth Supabase**
   ```sql
   -- Run this in Auth Supabase SQL Editor to get admin user IDs
   SELECT id, email, is_admin 
   FROM users 
   WHERE is_admin = TRUE;
   ```
   
   Then use those IDs in Option A above.

   **Important:** The `users` table in Learning Supabase is minimal and only needs `id` and `is_admin` columns. It's used by RLS policies to check admin status. You can set up automated syncing later if needed.

## Features

### 1. Class Management
- ✅ Create/edit/delete semester-based classes
- ✅ Set start & end dates (auto-updates status: upcoming → ongoing → completed)
- ✅ Assign instructors
- ✅ Set max capacity
- ✅ Publish/unpublish classes
- ✅ Lock/unlock enrollment
- ✅ Upload class thumbnails

### 2. Weekly Module Management
- ✅ Create weekly modules (Week 1, Week 2, etc.)
- ✅ Set module dates (auto-unlocks on scheduled date)
- ✅ Attach live session links
- ✅ Add learning materials
- ✅ Lock/unlock modules

### 3. Live Session Management
- ✅ Schedule live sessions per module
- ✅ Set date, time, location (online/offline)
- ✅ Enable attendance tracking
- ✅ Generate QR codes (auto-expires after session)
- ✅ View session attendance

### 4. Enrollment Management
- ✅ View all enrolled students
- ✅ Manually add/remove students
- ✅ Lock enrollment
- ✅ Override capacity limits
- ✅ Track enrollment timestamps

### 5. Assignment Management
- ✅ Create assignments per module
- ✅ Set due dates & submission types (text/file/url/git)
- ✅ Auto-mark late submissions
- ✅ Lock submissions after deadline
- ✅ View all submissions
- ✅ Review submissions with feedback

### 6. Announcement Management
- ✅ Post announcements to class or specific modules
- ✅ Pin important announcements
- ✅ Edit/delete announcements
- ✅ Chronological display with pinned priority

### 7. Statistics & KPIs
- ✅ Total & active enrollments
- ✅ Attendance rates
- ✅ Assignment completion rates
- ✅ Average XP per student
- ✅ Team-level metrics (for grant eligibility)

### 8. Gamification Integration
- ✅ Configure XP rewards per action type
- ✅ Session attendance → XP
- ✅ Assignment submission → XP
- ✅ Assignment approval → XP
- ✅ Module completion → XP
- ✅ Badge integration ready

## Admin Access

The system supports two permission levels:

1. **Admin** - Full platform control
   - Can manage all classes
   - Can override any settings
   - Can manually enroll/remove students

2. **Instructor** - Class-level control
   - Can manage assigned classes
   - Can create modules, sessions, assignments
   - Can view enrollments and attendance
   - Can review submissions

## Usage

1. **Access Admin Panel:**
   - Navigate to `/admin`
   - Click "Semester Classes" → "Open Classes Admin"

2. **Create a Class:**
   - Click "New" in the classes sidebar
   - Fill in title, semester, dates, capacity
   - Assign instructor
   - Upload thumbnail (optional)
   - Publish when ready

3. **Add Weekly Modules:**
   - Select a class
   - Go to "Modules" tab
   - Click "Add Module"
   - Set week number, title, dates
   - Add learning materials

4. **Schedule Live Sessions:**
   - In Modules tab, click calendar icon on a module
   - Set date, time, location type
   - Enable attendance tracking
   - QR code will be auto-generated

5. **Manage Enrollments:**
   - Go to "Enrollments" tab
   - Click "Add Student" to manually enroll
   - View enrollment status
   - Remove enrollments if needed

6. **Create Assignments:**
   - Go to "Assignments" tab
   - Select a module
   - Click "Add Assignment"
   - Set due date, submission type, XP reward

7. **Post Announcements:**
   - Go to "Announcements" tab
   - Click "New Announcement"
   - Target entire class or specific module
   - Pin important announcements

8. **View Statistics:**
   - Go to "Stats & KPIs" tab
   - View enrollment, attendance, and completion metrics

## Integration Points

### XP System
- XP is awarded automatically based on `class_xp_config`
- Default rewards can be configured per class
- XP is logged to user's XP total

### Badge System
- Badges can be awarded for:
  - Perfect attendance
  - Assignment completion milestones
  - Class completion
- Integration ready via existing badge system

### Attendance System
- Uses same QR code system as workshops
- Attendance records roll up to team KPIs
- Used for grant eligibility calculations

## API Routes

All class management functions are available via:
- `lib/classes.ts` - Data access layer
- Server-side Supabase clients used for security

## Next Steps

1. **Student View:**
   - Create student-facing class pages
   - Show enrolled classes
   - Display modules, assignments, announcements
   - Allow assignment submissions

2. **Real-time Updates:**
   - Add Supabase real-time subscriptions
   - Live announcement notifications
   - Assignment deadline reminders

3. **Advanced Features:**
   - Team-based assignments
   - Peer review system
   - Gradebook integration
   - Certificate generation

