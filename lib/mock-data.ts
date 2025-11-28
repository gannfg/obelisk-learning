import { Course, Instructor, CourseCategory } from "@/types";

// Mock Instructors - AI-first teaching model
export const mockInstructors: Instructor[] = [
  {
    id: "ai-instructor-1",
    name: "DeMentor",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Web3AIMentor",
    bio: "Your AI-native mentor for Web3 and modern development. Available 24/7 to guide you through coding challenges, review your progress, and personalize your learning path.",
    specializations: ["Web3", "Solana", "Fullstack", "AI-Powered Teaching"],
    socials: {},
  },
];

// Mock Courses - primary AI-taught Web3 curriculum
export const mockCourses: Course[] = [
  {
    id: "course-web3-1",
    title: "Web3 Coding Academy: Full Stack Web3 Developer",
    description:
      "Go from zero to building real Web3 dApps. Learn Solidity, Solana, smart contracts, and full-stack Web3 with an AI mentor guiding you at every step.",
    thumbnail: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=450&fit=crop",
    instructorId: "ai-instructor-1",
    category: "Solana Integration",
    featured: true,
    modules: [
      {
        id: "module-1",
        title: "AI Development Fundamentals",
        description:
          "Learn how to use AI as your coding copilot: prompting, context, workflows, and the AI developer mindset.",
        lessons: [
          {
            id: "lesson-1-1",
            title: "How AI-Assisted Coding Works",
            markdownContent: `# AI Development Fundamentals

In this module you'll learn how to work with AI as a **development partner**, not a code generator.

You’ll cover:

- How context windows work
- How models understand codebases
- Structuring prompts for refactors and new features
- Conversation-first coding and chain-of-thought with dev tools
- When **not** to trust AI
- Cursor deep dive: workspaces, Composer, commands, and edit workflows

By the end, you'll think like an architect and use AI as the builder.`,
            duration: 20,
          },
        ],
      },
      {
        id: "module-2",
        title: "Engineering Environment Mastery",
        description:
          "Set up professional-grade local environments, version control, and repo hygiene so AI can work effectively with your code.",
        lessons: [
          {
            id: "lesson-2-1",
            title: "Local Dev, Envs, and Git Basics",
            markdownContent: `# Engineering Environment Mastery

This module gives you the foundations most beginners lack.

You’ll cover:

- Local dev setup (Node.js versions, nvm, Python envs)
- Package managers and dependency hygiene
- Virtual environments and lockfiles
- Git and GitHub workflows (branches, commits, reviews, conflicts)
- Workspace structure, .gitignore, and .env + secret management

The goal is simple: **you** control the environment so AI can safely operate inside it.`,
            duration: 25,
          },
        ],
      },
      {
        id: "module-3",
        title: "The Modern Web Stack",
        description:
          "Understand APIs, databases, auth, and deployment so you can make architectural decisions before asking AI for code.",
        lessons: [
          {
            id: "lesson-3-1",
            title: "APIs, Databases, Auth, and Deployment",
            markdownContent: `# The Modern Web Stack

This module is framework-agnostic: you’ll learn the **concepts** behind modern web systems.

You’ll cover:

- APIs: REST vs RPC vs GraphQL, status codes, rate limits, API keys, webhooks
- Databases: SQL vs NoSQL, schemas, migrations, indexing, ORMs, pooling
- Auth basics: sessions vs JWT vs OAuth, RBAC, cookie security, CSRF, CORS
- Deployment architecture: Vercel vs Docker vs VPS, CI/CD, secrets, logging

After this, you’ll be able to reason about architecture before you ever prompt AI.`,
            duration: 30,
          },
        ],
      },
      {
        id: "module-4",
        title: "Language Survival Kits",
        description:
          "Learn just enough JavaScript/TypeScript and Python fundamentals to understand and debug what AI generates.",
        lessons: [
          {
            id: "lesson-4-1",
            title: "JS/TS and Python Survival Kits",
            markdownContent: `# Language Survival Kits

You are **not** memorizing syntax — you are learning how to survive in AI-generated codebases.

JavaScript / TypeScript survival kit:

- Modules (import/export)
- async/await and promises
- Event loop basics
- NPM ecosystem and tsconfig mental model
- Types: interfaces and simple generics

Python survival kit:

- pip and virtual environments
- requirements.txt and pip freeze
- File system imports and common import errors
- Script vs notebook workflows

Outcome: you can read, navigate, and debug AI-generated JS/TS and Python.`,
            duration: 30,
          },
        ],
      },
      {
        id: "module-5",
        title: "Framework Mental Models",
        description:
          "Understand how Next.js and similar frameworks work conceptually so you can prompt AI precisely.",
        lessons: [
          {
            id: "lesson-5-1",
            title: "Next.js Architecture, Not Code",
            markdownContent: `# Framework Deep-Dive: Next.js Mental Model

This module focuses on **how the framework works**, not how to memorize its APIs.

You’ll cover:

- App Router mental model
- Server vs Client Components
- Server Actions and route handlers
- Layouts and nested routes
- Data fetching strategies and caching
- Env vars (public vs private), middleware, and deployment on Vercel

Outcome: you can explain the framework to AI and ask for the right abstractions.`,
            duration: 25,
          },
        ],
      },
      {
        id: "module-6",
        title: "Supabase / Firebase / Prisma Mastery",
        description:
          "Learn how modern backend platforms and ORMs are structured so you can design schemas and auth flows with AI.",
        lessons: [
          {
            id: "lesson-6-1",
            title: "Databases and Auth with Modern Tools",
            markdownContent: `# Supabase / Firebase / Prisma Mastery

In this module you’ll learn:

- Typical project structure for hosted backends
- Row Level Security (RLS) and why it matters
- Auth flows and how clients talk to auth services
- Query design and using Supabase SDKs intelligently
- Migrations and schema versioning with tools like Prisma/Drizzle

Goal: you can describe the data layer you want, and have AI implement it safely.`,
            duration: 25,
          },
        ],
      },
      {
        id: "module-7",
        title: "Solana Builder Track (AI-First)",
        description:
          "Deep mental model of the Solana runtime, Anchor, testing, and AI-first Solana development workflows.",
        lessons: [
          {
            id: "lesson-7-1",
            title: "Solana Runtime and Anchor Mental Models",
            markdownContent: `# Solana Builder Track (AI-First)

This module teaches **how Solana works**, so you can ask AI for the right on-chain code.

You’ll cover:

- Solana runtime: accounts, programs, lamports, transactions, PDAs
- How Anchor abstracts Solana (IDLs, macros, client bindings)
- The Anchor dev loop: init → build → test → deploy
- Safe account reads/writes, rent, serialization, signer logic
- Testing strategies: Rust unit tests and client integration tests
- Connecting frontends to Solana programs (wallet adapters, connections)
- Localnet and CI patterns (solana-test-validator)
- How to spot and fix AI hallucinations in Solana code

Outcome: you can supervise AI as it writes Solana and Anchor code.`,
            duration: 35,
          },
        ],
      },
      {
        id: "module-8",
        title: "Debugging & QA with AI",
        description:
          "Use AI to debug, review, and harden code without blindly trusting its first answer.",
        lessons: [
          {
            id: "lesson-8-1",
            title: "AI-First Debugging and Code Review",
            markdownContent: `# Debugging & QA with AI

In this module you’ll learn:

- How to feed logs and stack traces to AI
- How to isolate bugs and ask targeted debugging questions
- How to detect hallucinated fixes
- How to perform AI-assisted code reviews
- Security and efficiency pitfalls
- Detecting dependency bloat and tech debt early

Goal: you become the **QA layer** on top of AI, not a passive user.`,
            duration: 25,
          },
        ],
      },
      {
        id: "module-9",
        title: "Real Project Building (AI-First Workflow)",
        description:
          "Plan, scaffold, and ship a real project where AI is your primary builder but you own the architecture.",
        lessons: [
          {
            id: "lesson-9-1",
            title: "Capstone: Design and Ship a Real Project",
            markdownContent: `# Real Project Building (Capstone)

This is the academy’s capstone.

You’ll learn:

- How to design a project before building anything
- How to write a Project Specification Prompt
- How to generate scaffolds and iterate new features with AI
- How to structure a roadmap and phases
- How to deploy and handle errors post-launch

You’re not just coding — you’re learning **software development**.`,
            duration: 40,
          },
        ],
      },
      {
        id: "module-10",
        title: "Career & Workflow",
        description:
          "Turn your AI-augmented skills into a portfolio, GitHub presence, and professional workflow.",
        lessons: [
          {
            id: "lesson-10-1",
            title: "Becoming an AI-Powered Developer",
            markdownContent: `# Career & Workflow

In this final module you’ll cover:

- Building a portfolio of AI-built but well-architected projects
- Packaging work for GitHub with good READMEs and docs
- Writing technical documentation with AI as an assistant
- Communicating like an engineer in teams
- Positioning yourself as an AI-powered developer

The goal is to leave with a repeatable workflow you can use in jobs, freelancing, or your own products.`,
            duration: 30,
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

