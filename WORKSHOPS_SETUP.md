# Workshop Calendar & Attendance System

## Overview

The Workshop Calendar & Attendance System enables Superteam Study to host online and offline workshops with verifiable attendance check-ins, attendance-based KPIs, and gamification integration.

## Features

### ✅ Implemented

1. **Workshop Calendar**
   - Display upcoming and past workshops
   - Support for online and offline workshops
   - Workshop cards with key information

2. **Workshop Registration**
   - One-click registration for authenticated users
   - Capacity limits (optional)
   - Duplicate registration prevention

3. **Attendance Check-in System**
   - QR code check-in (primary method)
   - Manual check-in (admin only)
   - Automatic POA (Proof of Attendance) generation
   - QR token expiration after event

4. **Gamification Integration**
   - +100 XP awarded for attendance
   - "Workshop Attendee" badge on first attendance
   - "Workshop Enthusiast" badge at 5+ workshops
   - "Workshop Master" badge at 10+ workshops

5. **Admin Dashboard**
   - Create/edit/delete workshops
   - Generate QR codes for check-in
   - View attendance lists
   - Export attendance as CSV
   - Manual check-in capability

6. **Team-Level KPI Tracking**
   - Total workshops attended per team
   - Online vs offline attendance counts
   - Attendance consistency score
   - Database functions for aggregation

## Database Schema

Run the SQL schema file to set up the database:

```bash
# In Supabase SQL Editor, run:
supabase/workshops-schema.sql
```

### Tables Created

- `workshops` - Workshop information
- `workshop_registrations` - User registrations
- `workshop_attendance` - Attendance records
- `proof_of_attendance` - POA records (auto-generated)

### Helper Functions

- `can_register_for_workshop()` - Checks capacity and duplicate registration
- `get_workshop_stats()` - Returns registration and attendance statistics
- `get_team_attendance_kpis()` - Team-level attendance metrics

## API Routes

### Workshops

- `GET /api/workshops` - List all workshops (supports `?upcomingOnly=true&limit=10`)
- `POST /api/workshops` - Create workshop (admin only)
- `GET /api/workshops/[id]` - Get workshop details
- `PATCH /api/workshops/[id]` - Update workshop (admin only)
- `DELETE /api/workshops/[id]` - Delete workshop (admin only)

### Registration

- `POST /api/workshops/[id]/register` - Register for workshop
- `GET /api/workshops/[id]/register` - Check registration status

### Check-in

- `POST /api/workshops/[id]/checkin` - Check in (QR or manual)
- `GET /api/workshops/[id]/checkin` - Check attendance status

### Admin

- `GET /api/workshops/[id]/qr` - Get QR code data (admin only)
- `GET /api/workshops/[id]/attendance` - Get attendance list (admin only)

## UI Pages

### Public Pages

- `/workshops` - Workshop calendar (list view)
- `/workshops/[id]` - Workshop detail page with registration and check-in

### Admin Pages

- `/admin/workshops` - Workshop management dashboard
- `/admin/workshops/[id]/attendance` - Attendance management for a workshop

## Usage

### Creating a Workshop (Admin)

1. Navigate to `/admin/workshops`
2. Fill in the workshop form:
   - Title (required)
   - Description (optional)
   - Date & Time (required)
   - Location Type: Online or Offline
   - Meeting Link (for online) or Venue Name (for offline)
   - Host Name (required)
   - Capacity (optional, leave empty for unlimited)
3. Click "Create Workshop"
4. QR code is automatically generated

### Registering for a Workshop

1. Navigate to `/workshops`
2. Click "View Details" on a workshop
3. Click "Register for Workshop"
4. You'll see confirmation when registered

### Checking In (User)

1. Navigate to the workshop detail page
2. If registered, click "Check In with QR Code"
3. Enter the QR token (provided by host during event)
4. You'll receive +100 XP and a badge notification

### Checking In (Admin/Host)

1. Navigate to `/admin/workshops/[id]/attendance`
2. Enter user email in "Manual Check-in" section
3. Click "Check In"
4. User receives XP and badge automatically

### Generating QR Code (Admin)

1. Navigate to `/admin/workshops`
2. Click QR code icon on a workshop
3. QR code displays - share during the event
4. QR code expires 2 hours after workshop end time

## Security

- Authentication required for registration and check-in
- Admin-only access for workshop management
- QR tokens expire after event
- Duplicate attendance prevention
- Capacity limits enforced

## Integration Points

### XP System

Workshop attendance automatically awards 100 XP via `awardXP()` function.

### Badge System

Badges are awarded through `awardWorkshopBadge()` and milestone checks:
- First attendance: "Workshop Attendee"
- 5+ workshops: "Workshop Enthusiast"
- 10+ workshops: "Workshop Master"

### Notifications

Users receive notifications for:
- Successful check-in
- XP awarded
- Badge earned

### Team KPIs

Team attendance metrics are available via `getTeamAttendanceKPIs()` function:
- Total workshops attended
- Online vs offline breakdown
- Attendance consistency score

## Future Enhancements

- QR code scanner (camera-based)
- POAP/NFT integration for POA
- Workshop categories/tags
- Recurring workshops
- Waitlist for full workshops
- Email reminders
- Calendar export (iCal)

## Dependencies

- `qrcode.react` - QR code generation
- `date-fns` - Date formatting

## Notes

- QR codes are generated automatically when workshops are created
- POA records are created automatically upon attendance
- All timestamps are stored in UTC
- Capacity limits are enforced at registration time

