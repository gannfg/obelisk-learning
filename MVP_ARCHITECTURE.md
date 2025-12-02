# MVP Architecture Plan
## Grant Management + Learning Platform

**Timeline**: Ready before Hackathon (March 2025)
**Focus**: MVP - Don't Overengineer

---

## Core Features (MVP)

### 1. Authentication & User Management
- ✅ User sign in/sign up flow (Supabase Auth)
- User roles: Admin, Grant Recipient, Student
- Profile management

### 2. Grant Management System
- Grant applications & approvals
- Grant recipient dashboard
- **Check-ins**: Regular status updates
- **Status Updates**: Progress tracking
- **Deployments**: Link to deployed work
- **Proof of Work**: Upload evidence (screenshots, code, demos)

### 3. Modular Learning System
- **Training Programs**: Modular content blocks
- **Videos**: Embedded video support
- **Images**: Image galleries
- **Documents**: PDF/Markdown content
- **Code Challenges**: Interactive coding missions

### 4. Coding Academy (Priority)
- Mission-based learning (already exists)
- Progress tracking
- Certificate generation
- Student dashboard

---

## Architecture

### Folder Structure
```
app/
├── (auth)/              # Auth routes
│   ├── sign-in/
│   └── sign-up/
├── (dashboard)/         # Protected routes
│   ├── dashboard/       # Main dashboard
│   ├── grants/          # Grant management
│   │   ├── [grantId]/
│   │   │   ├── check-ins/
│   │   │   ├── deployments/
│   │   │   └── proof-of-work/
│   ├── academy/         # Coding academy
│   │   ├── missions/
│   │   └── progress/
│   └── profile/
├── admin/               # Admin only
│   ├── grants/
│   └── programs/
└── api/                 # API routes
    ├── grants/
    ├── check-ins/
    ├── content/
    └── academy/

components/
├── grants/              # Grant components
│   ├── grant-card.tsx
│   ├── check-in-form.tsx
│   ├── status-update.tsx
│   └── proof-of-work.tsx
├── academy/             # Academy components
│   ├── mission-board.tsx
│   └── progress-tracker.tsx
├── content/             # Modular content
│   ├── content-block.tsx
│   ├── video-player.tsx
│   ├── image-gallery.tsx
│   └── document-viewer.tsx
└── ui/                  # UI primitives

lib/
├── grants/              # Grant utilities
├── content/             # Content management
└── academy/             # Academy utilities

types/
├── grant.ts
├── content.ts
└── academy.ts
```

---

## Database Schema (MVP)

### Grants
- `grants` - Grant applications
- `grant_recipients` - Approved recipients
- `check_ins` - Regular status updates
- `status_updates` - Progress updates
- `deployments` - Links to deployed work
- `proof_of_work` - Evidence uploads

### Content
- `content_blocks` - Modular content (videos, images, docs)
- `training_programs` - Programs composed of content blocks
- `program_enrollments` - User enrollments

### Academy
- `missions` - Coding missions (existing)
- `mission_progress` - Student progress (existing)

---

## Design System

### Superteam Colors
- **Primary**: Blue/Purple gradient
- **Background**: Dark (#0a0a0a)
- **Foreground**: Light (#fafafa)
- **Accent**: Vibrant blue/purple

### Typography
- Clean sans-serif
- Modern, readable

### Components
- Minimalist design
- Ample white space
- Clear CTAs
- Card-based layouts

---

## MVP Priorities

### Phase 1 (Now - Dec 2024)
1. ✅ Update design system (Superteam colors)
2. ✅ Redesign landing page
3. ✅ Modular content system
4. ✅ Grant management basics

### Phase 2 (Jan 2025)
1. Check-ins & status updates
2. Deployments tracking
3. Proof of work uploads
4. Admin dashboard

### Phase 3 (Feb 2025)
1. Coding academy polish
2. Certificate generation
3. Analytics & reporting
4. Testing & bug fixes

---

## Key Principles

1. **Modular**: Content blocks can be reused
2. **Simple**: Don't overengineer
3. **Fast**: Optimize for performance
4. **Scalable**: Easy to add features later
5. **Superteam Brand**: Match Superteam Earn aesthetic



