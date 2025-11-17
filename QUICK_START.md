# Quick Start Guide

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Overview

### Pages Created

- ✅ **Landing Page** (`/`) - Hero section, featured courses, why Obelisk Learning
- ✅ **Courses List** (`/courses`) - Grid of all available courses
- ✅ **Course Overview** (`/courses/[id]`) - Course details with sidebar navigation
- ✅ **Lesson Page** (`/courses/[id]/[moduleId]/[lessonId]`) - Markdown content + video player
- ✅ **Instructors List** (`/instructors`) - All instructors
- ✅ **Instructor Profile** (`/instructors/[id]`) - Instructor details with courses

### Components

- `Header` - Site navigation header
- `Footer` - Site footer
- `CourseCard` - Course display card
- `LessonSidebar` - Course navigation sidebar
- `MarkdownContent` - Markdown renderer
- `VideoPlayer` - Video player component
- `Button`, `Card` - UI primitives

### Features Implemented

- ✅ Full routing structure
- ✅ Markdown lesson rendering
- ✅ Video embedding support
- ✅ Progress tracking placeholders
- ✅ Dark mode support
- ✅ Responsive design
- ✅ TypeScript types
- ✅ Mock data structure

### Ready for Integration

- 🔄 Supabase Auth (placeholders ready)
- 🔄 Progress tracking (Supabase-ready)
- 🔄 Quiz component (placeholder)
- 🔄 Enrollment system (ready for Supabase)

## 🎨 Styling

The platform uses:
- TailwindCSS 4 with custom theme
- Obelisk ecosystem color scheme
- Automatic dark mode
- Responsive breakpoints

## 📝 Adding Content

Edit `lib/mock-data.ts` to:
- Add new courses
- Add new instructors
- Add modules and lessons
- Update course content

## 🔧 Next Steps

1. **Connect Supabase:**
   - Set up environment variables
   - Replace placeholder functions in `lib/supabase-placeholder.ts`
   - Create database schema

2. **Add Authentication:**
   - Integrate Supabase Auth
   - Add protected routes
   - User dashboard

3. **Enhance Features:**
   - Implement quiz system
   - Add course search/filter
   - Add user reviews/ratings
   - Add course completion certificates

## 📚 Documentation

See `README.md` for full documentation.

