# Classroom Notifications Setup Guide

This guide explains how to set up automatic notifications for classroom students.

## Overview

The classroom notification system automatically sends notifications to enrolled students for:
- **New Announcements** - When instructor posts an announcement
- **New Assignments** - When a new assignment is created
- **Assignment Graded** - When instructor grades a submission
- **Module Released** - When a module becomes available
- **Weekly Reminders** - Reminder before each week/module starts (scheduled)
- **Assignment Reminders** - Reminder before assignment due dates (scheduled)

## Database Setup

### 1. Run the Migration

Execute the notification migration in your **Auth Supabase** (where notifications table exists):

```sql
-- Run in Auth Supabase SQL Editor
\i supabase/classroom-notifications.sql
```

This migration:
- Adds 'class' notification type
- Creates triggers for automatic notifications
- Creates functions for scheduled reminders
- Sets up notification helpers

### 2. Verify Notification Type

Make sure the notifications table allows 'class' type:

```sql
-- Check constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'notifications_type_check';
```

## Automatic Notifications (Database Triggers)

These notifications are sent automatically via database triggers:

### ✅ New Announcement
- **Trigger**: `trigger_notify_new_announcement`
- **When**: New announcement is created
- **Recipients**: All enrolled students
- **Type**: `class`

### ✅ New Assignment
- **Trigger**: `trigger_notify_new_assignment`
- **When**: New assignment is created
- **Recipients**: All enrolled students
- **Type**: `assignment`

### ✅ Assignment Graded
- **Trigger**: `trigger_notify_assignment_graded`
- **When**: Assignment submission is graded or feedback is added
- **Recipients**: The student who submitted
- **Type**: `feedback`

### ✅ Module Released
- **Trigger**: `trigger_notify_module_released`
- **When**: Module `is_released` changes from `false` to `true`
- **Recipients**: All enrolled students
- **Type**: `class`

## Scheduled Reminders

These require a scheduled job to run periodically:

### Weekly Class Reminders

Sends reminders 24 hours before each module starts.

**Function**: `send_weekly_class_reminders()`

**Setup Options**:

#### Option 1: Supabase pg_cron (Recommended)

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily check at 9 AM UTC
SELECT cron.schedule(
  'weekly-class-reminders',
  '0 9 * * *',  -- Every day at 9 AM UTC
  $$
  SELECT send_weekly_class_reminders();
  $$
);
```

#### Option 2: API Endpoint + External Cron

Use a service like Vercel Cron, GitHub Actions, or a cron service:

```bash
# Call this endpoint daily at 9 AM
curl -X POST https://your-domain.com/api/classroom/reminders \
  -H "Content-Type: application/json" \
  -d '{"type": "weekly"}'
```

### Assignment Reminders

Sends reminders 24-48 hours before assignment due dates.

**Function**: `send_assignment_reminders()`

**Setup**:

```sql
-- Schedule twice daily (morning and evening)
SELECT cron.schedule(
  'assignment-reminders',
  '0 9,21 * * *',  -- 9 AM and 9 PM UTC
  $$
  SELECT send_assignment_reminders();
  $$
);
```

Or via API:

```bash
curl -X POST https://your-domain.com/api/classroom/reminders \
  -H "Content-Type: application/json" \
  -d '{"type": "assignments"}'
```

## Manual Notification Functions

You can also call notification functions manually from your application:

```typescript
import { 
  notifyNewAnnouncement,
  notifyNewAssignment,
  notifyAssignmentGraded,
  notifyModuleReleased,
  notifyWeeklyReminder,
  notifyAssignmentReminder
} from "@/lib/classroom-notifications";
```

## Notification Types

- **`class`** - General classroom notifications (announcements, module releases, weekly reminders)
- **`assignment`** - Assignment-related notifications (new assignments, reminders)
- **`feedback`** - Feedback notifications (assignment graded, reviewed)

## Testing

### Test Announcement Notification

1. Create a new announcement in a class
2. Check notifications for all enrolled students
3. Should see notification with type `class`

### Test Assignment Notification

1. Create a new assignment
2. Check notifications for all enrolled students
3. Should see notification with type `assignment`

### Test Grading Notification

1. Grade a student's assignment
2. Check that student's notifications
3. Should see notification with type `feedback`

### Test Scheduled Reminders

```sql
-- Manually trigger weekly reminders
SELECT send_weekly_class_reminders();

-- Manually trigger assignment reminders
SELECT send_assignment_reminders();
```

## Notification Links

All notifications include deep links to relevant pages:

- Announcements: `/class/{classId}?tab=announcements`
- Assignments: `/class/{classId}?tab=assignments`
- Modules: `/class/{classId}?tab=modules`

## Metadata

Each notification includes metadata in JSONB format:

```json
{
  "class_id": "uuid",
  "announcement_id": "uuid",  // for announcements
  "assignment_id": "uuid",    // for assignments
  "module_id": "uuid",        // for modules
  "week_number": 1,           // for weekly reminders
  "due_date": "ISO string",  // for assignments
  "grade": 85,                // for graded assignments
  "status": "approved"        // for graded assignments
}
```

## Troubleshooting

### Notifications not being sent

1. Check if triggers are enabled:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';
```

2. Check if functions exist:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%notify%' OR routine_name LIKE '%reminder%';
```

3. Check notification type constraint:
```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'notifications_type_check';
```

### Scheduled reminders not running

1. Check if pg_cron is enabled:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Check scheduled jobs:
```sql
SELECT * FROM cron.job;
```

3. Check job run history:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-class-reminders')
ORDER BY start_time DESC LIMIT 10;
```

## Security

- All notification functions use `SECURITY DEFINER` to bypass RLS
- Functions check enrollment status before sending
- Only active enrollments receive notifications
- RLS policies on notifications table ensure users only see their own notifications

