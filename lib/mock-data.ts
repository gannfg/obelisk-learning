import { Course, Instructor, CourseCategory } from "@/types";

// Mock Instructors
export const mockInstructors: Instructor[] = [
  {
    id: "instructor-1",
    name: "Belac",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Belac",
    bio: "Full-stack developer and Solana expert. Passionate about building decentralized applications and teaching the next generation of blockchain developers. Specializes in modern web development, smart contracts, and Solana ecosystem integration.",
    specializations: ["Fullstack Dev", "Solana Mastery"],
    socials: {
      twitter: "@belac",
      github: "belac",
      website: "https://belac.dev",
    },
  },
  {
    id: "instructor-2",
    name: "Yves",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yves",
    bio: "Creative professional specializing in design and video editing. Expert in visual storytelling, UI/UX design, and post-production workflows. Loves bringing ideas to life through beautiful visuals and engaging content.",
    specializations: ["Design", "Editing"],
    socials: {
      twitter: "@yves",
      website: "https://yves.design",
    },
  },
  {
    id: "instructor-3",
    name: "FG",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=FG",
    bio: "Versatile professional with expertise across multiple domains. Specializes in marketing strategy, UI/UX design, full-stack development, and creative design. Known for bridging the gap between technical and creative disciplines.",
    specializations: ["Marketing", "UI/UX", "Fullstack", "Design"],
    socials: {
      twitter: "@fg",
      github: "fg",
      website: "https://fg.dev",
      linkedin: "fg",
    },
  },
];

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: "course-1",
    title: "Complete Next.js Mastery",
    description:
      "Master Next.js 14 with App Router, Server Components, and advanced patterns. Build production-ready applications from scratch.",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
    instructorId: "instructor-1", // Belac
    category: "Developer",
    featured: true,
    modules: [
      {
        id: "module-1",
        title: "Getting Started",
        description: "Introduction to Next.js and project setup",
        lessons: [
          {
            id: "lesson-1-1",
            title: "Introduction to Next.js",
            markdownContent: `# Introduction to Next.js

Welcome to the Complete Next.js Mastery course! In this first lesson, we'll explore what Next.js is and why it's become one of the most popular React frameworks.

## What is Next.js?

Next.js is a React framework that provides:

- **Server-Side Rendering (SSR)**: Render pages on the server for better SEO and performance
- **Static Site Generation (SSG)**: Pre-render pages at build time
- **API Routes**: Build backend functionality alongside your frontend
- **File-based Routing**: Automatic routing based on your file structure
- **Image Optimization**: Built-in image optimization and lazy loading

## Why Next.js?

Next.js solves many common problems in React development:

1. **Performance**: Automatic code splitting and optimization
2. **SEO**: Server-side rendering improves search engine visibility
3. **Developer Experience**: Great tooling and conventions
4. **Production Ready**: Built-in optimizations for production

Let's get started!`,
            duration: 10,
          },
          {
            id: "lesson-1-2",
            title: "Project Setup",
            markdownContent: `# Project Setup

In this lesson, we'll set up a new Next.js project from scratch.

## Creating a New Project

\`\`\`bash
npx create-next-app@latest my-app
\`\`\`

You'll be prompted to configure:
- TypeScript
- ESLint
- Tailwind CSS
- App Router (recommended)
- Import aliases

## Project Structure

\`\`\`
my-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── public/
├── package.json
└── next.config.js
\`\`\`

## Running the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see your app!`,
            duration: 15,
          },
          {
            id: "lesson-1-3",
            title: "Understanding the App Router",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Placeholder
            duration: 20,
          },
        ],
      },
      {
        id: "module-2",
        title: "Core Concepts",
        description: "Server Components, Client Components, and Routing",
        lessons: [
          {
            id: "lesson-2-1",
            title: "Server vs Client Components",
            markdownContent: `# Server vs Client Components

Next.js 14 introduces a powerful distinction between Server and Client Components.

## Server Components

Server Components are the default in the App Router. They:

- Run on the server
- Can directly access backend resources
- Reduce client-side JavaScript bundle
- Improve performance

\`\`\`tsx
// app/page.tsx (Server Component by default)
export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  return <div>{/* Render data */}</div>;
}
\`\`\`

## Client Components

Use Client Components when you need:
- Interactivity (onClick, useState, etc.)
- Browser APIs
- Event listeners

\`\`\`tsx
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
\`\`\``,
            duration: 25,
          },
          {
            id: "lesson-2-2",
            title: "Dynamic Routing",
            markdownContent: `# Dynamic Routing

Next.js App Router supports dynamic routes using folder names with brackets.

## Dynamic Segments

Create a dynamic route by using \`[param]\` in your folder name:

\`\`\`
app/
└── blog/
    └── [slug]/
        └── page.tsx
\`\`\`

## Accessing Parameters

\`\`\`tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <div>Post: {params.slug}</div>;
}
\`\`\`

## Catch-all Routes

Use \`[...slug]\` for catch-all routes that match multiple segments.`,
            duration: 20,
          },
        ],
      },
      {
        id: "module-3",
        title: "Advanced Patterns",
        description: "Data fetching, caching, and optimization",
        lessons: [
          {
            id: "lesson-3-1",
            title: "Data Fetching Strategies",
            markdownContent: `# Data Fetching Strategies

Next.js provides multiple ways to fetch data, each optimized for different use cases.

## fetch() API

Next.js extends the native \`fetch()\` API with automatic caching:

\`\`\`tsx
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // Revalidate every hour
  });
  return res.json();
}
\`\`\`

## Server Actions

Server Actions let you mutate data on the server:

\`\`\`tsx
'use server';

export async function createPost(data: FormData) {
  // Server-side logic
}
\`\`\``,
            duration: 30,
          },
        ],
      },
    ],
  },
  {
    id: "course-2",
    title: "React Fundamentals",
    description:
      "Learn React from the ground up. Master hooks, state management, and component patterns.",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
    instructorId: "instructor-3", // FG
    category: "Developer",
    featured: true,
    modules: [
      {
        id: "module-1",
        title: "React Basics",
        lessons: [
          {
            id: "lesson-1-1",
            title: "What is React?",
            markdownContent: `# What is React?

React is a JavaScript library for building user interfaces.

## Key Concepts

- **Components**: Reusable pieces of UI
- **JSX**: Syntax extension for JavaScript
- **Props**: Data passed to components
- **State**: Component's internal data

## Your First Component

\`\`\`tsx
function Welcome({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}
\`\`\``,
            duration: 15,
          },
        ],
      },
    ],
  },
  {
    id: "course-3",
    title: "Backend Development with Node.js",
    description:
      "Build robust backend services with Node.js, Express, and modern JavaScript patterns.",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
    instructorId: "instructor-1", // Belac
    category: "Developer",
    featured: false,
    modules: [
      {
        id: "module-1",
        title: "Node.js Basics",
        lessons: [
          {
            id: "lesson-1-1",
            title: "Introduction to Node.js",
            markdownContent: `# Introduction to Node.js

Node.js is a JavaScript runtime built on Chrome's V8 engine.

## Why Node.js?

- JavaScript everywhere
- Non-blocking I/O
- Large ecosystem
- Great for APIs and real-time apps`,
            duration: 20,
          },
        ],
      },
    ],
  },
  {
    id: "course-4",
    title: "UI/UX Design Masterclass",
    description:
      "Learn modern design principles, user experience best practices, and create stunning interfaces with Figma and design systems.",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop",
    instructorId: "instructor-3", // FG
    category: "Design",
    featured: true,
    modules: [
      {
        id: "module-1",
        title: "Design Fundamentals",
        lessons: [
          {
            id: "lesson-1-1",
            title: "Introduction to UI/UX Design",
            markdownContent: `# Introduction to UI/UX Design

Learn the fundamentals of creating beautiful and functional user interfaces.`,
            duration: 20,
          },
        ],
      },
    ],
  },
  {
    id: "course-5",
    title: "Video Production Essentials",
    description:
      "Master video production from shooting to editing. Learn camera techniques, lighting, and post-production workflows.",
    thumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=450&fit=crop",
    instructorId: "instructor-2", // Yves
    category: "Videography / Photography",
    featured: false,
    modules: [
      {
        id: "module-1",
        title: "Camera Basics",
        lessons: [
          {
            id: "lesson-1-1",
            title: "Understanding Your Camera",
            markdownContent: `# Understanding Your Camera

Learn the basics of camera settings and composition.`,
            duration: 25,
          },
        ],
      },
    ],
  },
  {
    id: "course-6",
    title: "Digital Marketing Strategy",
    description:
      "Build effective marketing campaigns. Learn SEO, social media marketing, content strategy, and analytics.",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
    instructorId: "instructor-3", // FG
    category: "Marketing",
    featured: false,
    modules: [
      {
        id: "module-1",
        title: "Marketing Fundamentals",
        lessons: [
          {
            id: "lesson-1-1",
            title: "Introduction to Digital Marketing",
            markdownContent: `# Introduction to Digital Marketing

Learn how to create effective marketing campaigns in the digital age.`,
            duration: 30,
          },
        ],
      },
    ],
  },
  {
    id: "course-7",
    title: "Building on Solana",
    description:
      "Complete guide to building decentralized applications on Solana. Learn Rust, Anchor framework, and smart contract development.",
    thumbnail: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=450&fit=crop",
    instructorId: "instructor-1", // Belac
    category: "Solana Integration",
    featured: true,
    modules: [
      {
        id: "module-1",
        title: "Solana Basics",
        lessons: [
          {
            id: "lesson-1-1",
            title: "Introduction to Solana",
            markdownContent: `# Introduction to Solana

Learn about the Solana blockchain and its unique features.`,
            duration: 20,
          },
        ],
      },
    ],
  },
];

// Helper functions
export function getInstructorById(id: string): Instructor | undefined {
  return mockInstructors.find((instructor) => instructor.id === id);
}

export function getCourseById(id: string): Course | undefined {
  return mockCourses.find((course) => course.id === id);
}

export function getCoursesByInstructor(instructorId: string): Course[] {
  return mockCourses.filter((course) => course.instructorId === instructorId);
}

export function getFeaturedCourses(): Course[] {
  return mockCourses.filter((course) => course.featured);
}

export function getCoursesByCategory(category: CourseCategory): Course[] {
  return mockCourses.filter((course) => course.category === category);
}

