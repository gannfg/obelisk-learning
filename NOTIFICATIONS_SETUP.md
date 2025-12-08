# Notifications System Setup Guide

This guide explains how to set up and use the comprehensive notification system for the Superteam Study Platform.

## Overview

The notification system supports various types of notifications:
- **Welcome** - Sent when a new user signs up
- **Message** - New messages from mentors/peers
- **Invitation** - Team or project invitations
- **Submission** - Submission feedback and reviews
- **Assignment** - New assignments in courses
- **Course** - Course completion, new courses, etc.
- **Achievement** - Achievements and milestones
- **Feedback** - Feedback on submissions
- **Team** - Team-related notifications
- **Project** - Project-related notifications
- **Badge** - Badge earned notifications
- **System** - System-wide announcements

## Database Setup

### 1. Run the Notifications Schema

Execute the SQL file in your **Auth Supabase** project (where users are stored):

```sql
-- Run this in your Auth Supabase SQL Editor
-- File: supabase/notifications-schema.sql
```

This creates:
- `notifications` table with all necessary columns
- Indexes for performance
- RLS policies for security
- Helper functions for marking notifications as read

### 2. Run the Notification Triggers

Execute the SQL file in your **Auth Supabase** project:

```sql
-- Run this in your Auth Supabase SQL Editor
-- File: supabase/notifications-triggers.sql
```

This creates:
- Welcome notification trigger (fires on user signup)
- Helper functions for creating various notification types
- Functions that can be called from the application

### 3. Enable Real-time (Optional but Recommended)

In your Supabase dashboard:
1. Go to Database → Replication
2. Enable replication for the `notifications` table
3. This allows real-time updates in the UI

## Application Integration

### Components

1. **NotificationsDropdown** (`components/notifications-dropdown.tsx`)
   - Bell icon with unread count badge
   - Dropdown menu showing recent notifications
   - Real-time updates via Supabase subscriptions
   - Integrated into the header component

2. **NotificationsPage** (`app/notifications/page.tsx`)
   - Full page view of all notifications
   - Mark individual or all notifications as read
   - Filter and search capabilities (can be extended)

### Utility Functions

1. **lib/notifications.ts**
   - Core notification CRUD operations
   - `createNotification()` - Create a new notification
   - `getUserNotifications()` - Fetch user notifications
   - `getUnreadNotificationCount()` - Get unread count
   - `markNotificationAsRead()` - Mark as read
   - `markAllNotificationsAsRead()` - Mark all as read
   - `formatNotificationTime()` - Format timestamps

2. **lib/notifications-helpers.ts**
   - High-level helper functions for common scenarios:
   - `notifyWelcome()` - Welcome notification
   - `notifyTeamInvitation()` - Team invitations
   - `notifyProjectInvitation()` - Project invitations
   - `notifyCourseCompletion()` - Course completion
   - `notifyBadgeEarned()` - Badge earned
   - `notifyNewCourse()` - New course available
   - `notifyNewAssignment()` - New assignment
   - `notifySubmissionFeedback()` - Submission feedback
   - `notifyNewMessage()` - New message

## Usage Examples

### Creating a Welcome Notification

```typescript
import { notifyWelcome } from "@/lib/notifications-helpers";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
await notifyWelcome(userId, supabase);
```

### Creating a Team Invitation Notification

```typescript
import { notifyTeamInvitation } from "@/lib/notifications-helpers";

await notifyTeamInvitation(
  invitedUserId,
  teamId,
  teamName,
  inviterName,
  supabase
);
```

### Creating a Course Completion Notification

```typescript
import { notifyCourseCompletion } from "@/lib/notifications-helpers";

await notifyCourseCompletion(
  userId,
  courseId,
  courseTitle,
  badgeName,
  supabase
);
```

### Creating a Custom Notification

```typescript
import { createNotification } from "@/lib/notifications";

await createNotification(
  {
    userId: "user-id",
    type: "system",
    title: "System Maintenance",
    message: "Scheduled maintenance on Friday at 2 AM",
    link: "/announcements",
    metadata: { maintenance_id: "123" },
  },
  supabase
);
```

## Automatic Notifications

The following notifications are created automatically:

1. **Welcome Notification**
   - Triggered when a new user signs up
   - Created in `components/user-sync.tsx`

2. **Course Completion & Badge Notifications**
   - Triggered when a course is completed
   - Created in `lib/progress.ts` → `awardCourseBadge()`
   - Called from `components/lesson-navigation.tsx`

3. **Mission Submission Feedback**
   - Triggered when an admin/mentor reviews a mission submission
   - Created in `app/admin/missions/page.tsx` → `handleUpdateSubmission()`
   - Sends notification when feedback or status is updated

## Manual Integration Points

To add notifications for other events, integrate the helper functions:

### Team Invitations
When adding a member to a team:
```typescript
// In your team invitation logic
await notifyTeamInvitation(
  newMemberId,
  teamId,
  teamName,
  inviterName,
  authSupabase
);
```

### Project Invitations
When adding a member to a project:
```typescript
// In your project invitation logic
await notifyProjectInvitation(
  newMemberId,
  projectId,
  projectTitle,
  inviterName,
  authSupabase
);
```

### Submission Feedback
When a mentor reviews a submission:
```typescript
// In your feedback submission logic
await notifySubmissionFeedback(
  studentId,
  submissionId,
  submissionTitle,
  reviewerName,
  feedbackSummary,
  authSupabase
);
```

**Note**: This is already integrated in `app/admin/missions/page.tsx` - notifications are automatically sent when admins review mission submissions.

### New Course Announcements
When an admin publishes a new course:
```typescript
// In your course publishing logic
// Get all enrolled users and notify them
const enrolledUsers = await getEnrolledUsers();
for (const user of enrolledUsers) {
  await notifyNewCourse(
    user.id,
    courseId,
    courseTitle,
    courseCategory,
    authSupabase
  );
}
```

## Real-time Updates

The notification system uses Supabase real-time subscriptions to automatically update the UI when new notifications arrive. This is handled in:

- `components/notifications-dropdown.tsx` - Real-time updates in header
- `app/notifications/page.tsx` - Real-time updates on notifications page

## Database Architecture

### Notifications Table Structure

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);
```

### Important Notes

1. **Database Separation**: Notifications are stored in the **Auth Supabase** (where users are), not the Learning Supabase
2. **RLS Policies**: Users can only view/update their own notifications
3. **Real-time**: Enable replication in Supabase dashboard for real-time updates
4. **Performance**: Indexes are created on `user_id`, `read`, and `created_at` for fast queries

## Testing

1. Sign up as a new user → Should receive welcome notification
2. Complete a course → Should receive course completion and badge notifications
3. Create a team and invite a user → Should receive team invitation notification
4. Create a project and invite a user → Should receive project invitation notification

## Troubleshooting

### Notifications not appearing
- Check that the schema has been run in the Auth Supabase
- Verify RLS policies are correct
- Check browser console for errors
- Verify the user is authenticated

### Real-time not working
- Enable replication for `notifications` table in Supabase dashboard
- Check that Supabase real-time is enabled for your project
- Verify network connectivity

### Welcome notification not created
- Check `components/user-sync.tsx` is running
- Verify the user is new (not existing)
- Check browser console for errors

## Future Enhancements

Potential improvements:
- Email notifications (via Supabase Edge Functions)
- Push notifications (via service workers)
- Notification preferences (user settings)
- Notification grouping (e.g., "3 new messages")
- Notification sounds
- Desktop notifications

