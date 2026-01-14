# Classroom System Setup Guide

This document describes the complete classroom system implementation for Superteam Study.

## Overview

The classroom system provides a full-featured online learning environment with:
- Semester-based classes with weekly modules
- Attendance tracking per week
- Assignment submission and grading
- Announcements feed
- Progress tracking

## Database Setup

### 1. Run the Migration

Execute the migration file to add the required tables and fields:

```sql
-- Run in Learning Supabase SQL Editor
\i supabase/classroom-system-migration.sql
```

This migration adds:
- `content`, `is_released`, `release_date` fields to `class_modules`
- `class_attendance` table for week-based attendance
- `meeting_link` field to `classes`
- `grade` field to `assignment_submissions`
- RLS policies for attendance
- Auto-release trigger for modules

### 2. Storage Bucket Setup

Create a storage bucket for assignment submissions:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `assignments`
3. Set it to **Public** (or configure RLS policies)
4. Enable file uploads

## Features

### 1. Overview Tab

- **Next Session**: Shows upcoming live session or module
- **Student Progress**: Modules unlocked, attendance count, assignments completed
- **Latest Announcement**: Most recent class announcement
- **Upcoming Assignment**: Next assignment with due date

### 2. Modules Tab

- **Weekly Modules**: List of all modules organized by week
- **Content Display**: Markdown content rendering
- **Learning Materials**: Links to documents, videos, files
- **Live Session Links**: Direct access to live sessions
- **Assignment Preview**: Quick view of module assignments
- **Lock/Unlock**: Modules unlock based on `releaseDate` or `startDate`
- **Instructor Tools**: Edit module content, update release dates

### 3. Attendance Tab

**Student View:**
- Per-week attendance status (Present/Absent/Upcoming)
- Manual check-in button for current week
- Visual indicators for attendance status

**Instructor View:**
- Attendance overview for all students
- Per-week attendance rates
- List of present students per week

### 4. Assignments Tab

**Student View:**
- List of all assignments with due dates
- Submission form (file upload or URL)
- View submission status and grades
- Read instructor feedback

**Instructor View:**
- List of all submissions per assignment
- Download student files
- Grade submissions (0-100)
- Provide feedback
- Mark as approved or request changes

### 5. Announcements Tab

- Feed-like UI with pinned announcements at top
- Markdown content support
- Instructor can create, edit, delete announcements
- Pin important announcements

## File Structure

```
app/class/[id]/
  └── page.tsx                    # Main classroom page with tabs

components/classroom/
  ├── classroom-overview.tsx     # Overview tab
  ├── classroom-modules.tsx       # Modules tab
  ├── classroom-attendance.tsx   # Attendance tab
  ├── classroom-assignments.tsx  # Assignments tab
  ├── classroom-announcements.tsx # Announcements tab
  └── module-editor.tsx          # Module editing form

lib/
  ├── classroom.ts               # Classroom-specific data access
  └── classes.ts                 # Updated with content/releaseDate support

supabase/
  └── classroom-system-migration.sql # Database migration

app/api/classroom/
  ├── attendance/route.ts        # Mark attendance API
  ├── submit-assignment/route.ts # Submit assignment API
  └── grade-submission/route.ts   # Grade submission API
```

## Usage

### Accessing a Classroom

1. Navigate to `/class/[classId]` where `classId` is the UUID of the class
2. User must be enrolled or be an instructor
3. If not enrolled, redirects to enrollment page

### Instructor Features

Instructors (admins or class mentors) can:
- Edit module content and release dates
- Post announcements
- View all student attendance
- Grade assignments
- Create new modules (via admin panel)

### Student Features

Students can:
- View unlocked modules
- Mark attendance for current week
- Submit assignments
- View grades and feedback
- Read announcements

## API Endpoints

### POST `/api/classroom/attendance`
Mark attendance for a week.

**Body:**
```json
{
  "classId": "uuid",
  "weekNumber": 1,
  "method": "manual"
}
```

### POST `/api/classroom/submit-assignment`
Submit an assignment.

**Body:**
```json
{
  "assignmentId": "uuid",
  "classId": "uuid",
  "submission": {
    "fileUrl": "https://...",
    "url": "https://...",
    "content": "..."
  }
}
```

### POST `/api/classroom/grade-submission`
Grade a submission (instructor only).

**Body:**
```json
{
  "submissionId": "uuid",
  "grade": 85,
  "feedback": "Great work!",
  "status": "approved"
}
```

## Data Models

### ClassAttendance
- `classId`: UUID
- `userId`: UUID
- `weekNumber`: Integer (1, 2, 3, ...)
- `checkedInAt`: Timestamp
- `method`: "qr" | "manual"

### Module Content
- `content`: JSONB or TEXT (markdown)
- `isReleased`: Boolean
- `releaseDate`: Timestamp

## Security

- RLS policies enforce access control
- Students can only view their own attendance
- Instructors can view all attendance
- Assignment submissions are user-scoped
- Only instructors can grade submissions

## Future Enhancements

- QR code attendance (already in schema, needs UI)
- File upload progress indicator
- Assignment deadline reminders
- Module completion tracking
- Grade statistics and analytics
- Bulk attendance marking

