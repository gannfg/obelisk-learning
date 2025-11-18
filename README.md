# Obelisk Learning Platform

A modern learning and courses platform built with Next.js 14, TailwindCSS, and Supabase-ready architecture.

## Features

- 🎓 **Course Management**: Browse courses with module and lesson structure
- 👨‍🏫 **Instructor Profiles**: View instructor profiles with social links
- 📚 **Markdown Lessons**: Rich markdown content rendering
- 🎥 **Video Support**: Embedded video player for lessons
- 📊 **Progress Tracking**: Placeholder for Supabase integration
- 🌙 **Dark Mode**: Automatic dark mode support
- 📱 **Responsive Design**: Mobile-first responsive layout

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS 4
- **UI Components**: Custom components (Shadcn-inspired)
- **Markdown**: react-markdown with remark-gfm
- **Video**: react-player
- **TypeScript**: Full type safety
- **Database**: Supabase-ready (placeholders included)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
obelisk-learning/
├── app/                    # Next.js App Router pages
│   ├── courses/           # Course pages
│   ├── instructors/       # Instructor pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # UI primitives (Button, Card, etc.)
│   ├── course-card.tsx   # Course card component
│   ├── header.tsx        # Site header
│   ├── footer.tsx        # Site footer
│   ├── lesson-sidebar.tsx # Lesson navigation sidebar
│   ├── markdown-content.tsx # Markdown renderer
│   └── video-player.tsx  # Video player component
├── lib/                  # Utilities and data
│   ├── mock-data.ts      # Mock course/instructor data
│   ├── utils.ts          # Utility functions
│   └── supabase-placeholder.ts # Supabase integration placeholders
└── types/                # TypeScript type definitions
    └── index.ts          # Course, Lesson, Instructor types
```

## Routes

- `/` - Landing page with featured courses
- `/courses` - All courses listing
- `/courses/[id]` - Course overview page
- `/courses/[id]/[moduleId]/[lessonId]` - Individual lesson page
- `/instructors` - All instructors listing
- `/instructors/[id]` - Instructor profile page

## Features in Development

The following features have placeholders ready for implementation:

- ✅ Quiz component (placeholder)
- ✅ Progress tracking (Supabase-ready)
- ✅ User enrollment
- ✅ Authentication (Supabase Auth ready)

## Supabase Integration

To connect Supabase:

1. Create **two Supabase projects**:
   - **Auth Supabase** (for lantaidua-universal-auth): See `AUTH_SETUP.md`
   - **Learning Supabase** (for platform data): See `SUPABASE_SETUP.md`

2. Set up environment variables:
   ```env
   # Auth Supabase (lantaidua-universal-auth)
   NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_URL=your_auth_supabase_url
   NEXT_PUBLIC_LANTAIDUA_UNIVERSAL_AUTH_SUPABASE_ANON_KEY=your_auth_anon_key
   
   # Learning Supabase (obelisk-learning)
   NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL=your_learning_supabase_url
   NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY=your_learning_anon_key
   ```
3. Replace placeholder functions in `lib/supabase-placeholder.ts` with actual Supabase client calls
4. Set up database schema for courses, lessons, progress, and enrollments in the **learning Supabase** project

See `DATABASE_ARCHITECTURE.md` for more details on the two-database setup.

## Customization

### Styling

The project uses TailwindCSS with custom theme variables defined in `app/globals.css`. The color scheme follows the Obelisk ecosystem design with dark mode support.

### Adding Courses

Currently, courses are defined in `lib/mock-data.ts`. To add new courses, extend the `mockCourses` array with your course data.

## License

MIT
