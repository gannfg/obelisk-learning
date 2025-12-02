/* eslint-disable */
// @ts-nocheck
// Linter false positives from markdown content in template strings - these are all valid string literals
import { Course, Instructor, CourseCategory } from "@/types";

// Mock Instructors - AI-first teaching model
export const mockInstructors: Instructor[] = [
  {
    id: "ai-instructor-1",
    name: "DeMentor",
    // Local DeMentor avatar icon
    avatar: "/dementor_avatar.png",
    bio: "Your AI-native mentor for Web3 and modern development. Available 24/7 to guide you through coding challenges, review your progress, and personalize your learning path.",
    specializations: ["Web3", "Solana", "Fullstack", "AI-Powered Teaching"],
    socials: {},
  },
];

// Mock Courses - primary AI-taught Web3 curriculum
export const mockCourses: Course[] = [
  {
    id: "course-ai-fundamentals-1",
    title: "AI Development Fundamentals",
    description:
      "Master AI-assisted coding from scratch. Learn how to work with AI as your development partner, understand context windows, master Cursor, and develop the AI developer mindset. Perfect for beginners who want to code with AI effectively.",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop",
    instructorId: "ai-instructor-1",
    category: "Developer",
    featured: true,
    modules: [
      {
        id: "module-1",
        title: "Module 1 - How AI-assisted coding works",
        description:
          "Understand the fundamentals of how AI understands code, processes context, and generates solutions. Learn to structure effective prompts and know when to trust (and not trust) AI outputs.",
        lessons: [
          {
            id: "lesson-1-1",
            title: "Understanding Context Windows",
            markdownContent: `# Understanding Context Windows

## What is a Context Window?

A **context window** is the amount of text (measured in tokens) that an AI model can "see" at once. Think of it as the AI's working memory.

### Key Concepts:

**Tokens vs Characters:**
- 1 token ≈ 4 characters (roughly)
- A context window of 128K tokens ≈ 512K characters
- This includes your prompt, code files, and the AI's response

**Why It Matters:**
- If your codebase is larger than the context window, the AI can't see everything
- You need to strategically include only relevant files
- Context is consumed by everything: your messages, code, and AI responses

### Practical Examples:

**Small Project (Fits in Context):**
\`\`\`
✅ Entire project visible
✅ AI can see all relationships
✅ Better understanding of architecture
\`\`\`

**Large Project (Exceeds Context):**
\`\`\`
⚠️ Need to select specific files
⚠️ AI may miss important connections
⚠️ Requires strategic file selection
\`\`\`

### Best Practices:

1. **Start Small**: Include only the files you're working on
2. **Add Context Gradually**: Add related files as needed
3. **Use File References**: Reference files by path instead of including full content
4. **Clear Old Context**: Start new conversations for unrelated tasks

### Exercise:
Think about a project you want to work on. List the files you'd need to include for the AI to understand:
- The specific feature you're building
- Related dependencies
- Configuration files

**Takeaway**: Context windows are limited. Use them wisely by including only what's necessary.`,
            duration: 15,
          },
          {
            id: "lesson-1-2",
            title: "How Models Understand Codebases",
            markdownContent: `# How Models Understand Codebases

## How AI "Reads" Your Code

AI models don't actually "understand" code like humans do. Instead, they:

1. **Pattern Recognition**: Identify patterns from training data
2. **Statistical Prediction**: Predict likely next tokens based on context
3. **Syntactic Analysis**: Parse code structure (functions, classes, imports)
4. **Semantic Mapping**: Connect related concepts across files

### What AI Sees:

**File Structure:**
\`\`\`
project/
├── src/
│   ├── components/
│   ├── utils/
│   └── types/
├── package.json
└── tsconfig.json
\`\`\`

**Code Relationships:**
- Import statements → file dependencies
- Function calls → where functions are defined
- Type definitions → where types are used
- Export statements → what's available to other files

### What AI Struggles With:

❌ **Runtime Behavior**: AI can't execute code, only predict
❌ **External APIs**: Doesn't know live API responses
❌ **Business Logic**: May miss domain-specific requirements
❌ **Recent Changes**: Only sees what you provide in context

### How to Help AI Understand:

**1. Provide Clear Structure:**
\`\`\`
// Good: Clear file organization
src/
  components/
    Button.tsx
  utils/
    helpers.ts
\`\`\`

**2. Include Related Files:**
\`\`\`
// When asking about Button.tsx, include:
- Button.tsx (the file itself)
- types/index.ts (type definitions)
- components/Button.test.tsx (tests showing usage)
\`\`\`

**3. Explain Your Intent:**
\`\`\`
// Instead of: "Fix this"
// Say: "This function should validate email addresses. 
//       It's currently accepting invalid formats."
\`\`\`

**4. Show Examples:**
\`\`\`
// Include example usage:
// "This component is used like: <Button variant='primary'>Click</Button>"
\`\`\`

### Common Misunderstandings:

**Myth**: AI understands your entire codebase automatically
**Reality**: AI only sees what you explicitly include in context

**Myth**: AI knows your project's conventions
**Reality**: You must explain or show examples of your patterns

**Myth**: AI remembers previous conversations
**Reality**: Each conversation is independent (unless using chat history)

### Exercise:

Take a file from your project and list:
1. What other files does it depend on?
2. What files depend on it?
3. What context would AI need to modify it safely?

**Takeaway**: AI understands code through patterns, not true comprehension. Help it by providing clear structure and context.`,
            duration: 20,
          },
          {
            id: "lesson-1-3",
            title: "Structuring Prompts for Files, Refactors, New Features",
            markdownContent: `# Structuring Prompts for Files, Refactors, New Features

## The Art of Prompting

Good prompts are **specific, contextual, and actionable**. Here's how to structure them for different scenarios.

### 1. Working with Existing Files

**Bad Prompt:**
\`\`\`
"Fix this file"
\`\`\`

**Good Prompt:**
\`\`\`
"I need to update the UserProfile component to:
1. Add a 'bio' field to the form
2. Validate bio length (max 500 characters)
3. Show character count as user types

Here's the current file: [file content]
And the User type: [type definition]"
\`\`\`

**Structure:**
1. **Goal**: What you want to achieve
2. **Requirements**: Specific changes needed
3. **Context**: Relevant files and types
4. **Constraints**: Any limitations or rules

### 2. Refactoring Code

**Bad Prompt:**
\`\`\`
"Make this better"
\`\`\`

**Good Prompt:**
\`\`\`
"Refactor this authentication function to:
- Extract validation logic into separate functions
- Use async/await instead of callbacks
- Add proper error handling with specific error types
- Follow our project's error handling pattern (see utils/errors.ts)

Current code: [code]
Pattern to follow: [example]"
\`\`\`

**Refactoring Checklist:**
- ✅ Explain what needs to change
- ✅ Show the pattern you want to follow
- ✅ Include related files (types, utilities)
- ✅ Specify performance or style requirements

### 3. Building New Features

**Bad Prompt:**
\`\`\`
"Create a login page"
\`\`\`

**Good Prompt:**
\`\`\`
"Create a new login feature with these requirements:

**Files to create:**
- app/login/page.tsx (Next.js App Router)
- components/LoginForm.tsx
- lib/auth/login.ts (authentication logic)

**Requirements:**
- Email and password fields
- Form validation (email format, password min 8 chars)
- Error messages displayed below fields
- Submit button disabled until form is valid
- Use our existing Button component (see components/Button.tsx)
- Follow our form styling pattern (see components/ContactForm.tsx)

**Integration:**
- Connect to our auth service (see lib/auth/client.ts)
- Handle success: redirect to /dashboard
- Handle error: show message from API

**Project structure:**
[show relevant existing files]"
\`\`\`

**New Feature Structure:**
1. **File Structure**: What files to create/modify
2. **Requirements**: Functional requirements
3. **Design Patterns**: What patterns to follow
4. **Integration Points**: How it connects to existing code
5. **Examples**: Show similar existing code

### 4. Prompt Templates

**File Modification Template:**
\`\`\`
"I need to [action] in [file].

**Current state:** [describe or show code]
**Desired state:** [describe what you want]
**Related files:** [list relevant files]
**Constraints:** [any rules or limitations]
\`\`\`

**Refactor Template:**
\`\`\`
"Refactor [file/function] to:
- [specific change 1]
- [specific change 2]
- [specific change 3]

**Current code:** [code]
**Pattern to follow:** [example]
**Why:** [reason for refactor]"
\`\`\`

**New Feature Template:**
\`\`\`
"Create [feature name] with:

**Files:**
- [file 1]: [purpose]
- [file 2]: [purpose]

**Functionality:**
- [requirement 1]
- [requirement 2]

**Integration:**
- Uses: [existing components/utils]
- Follows pattern: [example file]
- Connects to: [service/API]"
\`\`\`

### 5. Common Mistakes to Avoid

❌ **Too Vague**: "Make it work"
✅ **Specific**: "Handle the null case when user is undefined"

❌ **No Context**: "Add validation"
✅ **With Context**: "Add email validation using our validateEmail utility (see utils/validation.ts)"

❌ **Unclear Scope**: "Fix the bug"
✅ **Clear Scope**: "The submit button doesn't disable when form is invalid. Fix the disabled state logic."

### Exercise:

Write a prompt for one of these scenarios:
1. Add a "delete account" feature to your user settings
2. Refactor a function to use TypeScript properly
3. Fix a bug in an existing component

**Takeaway**: Good prompts are like good specifications. They're clear, complete, and actionable.`,
            duration: 25,
          },
          {
            id: "lesson-1-4",
            title: "Conversation-first Coding",
            markdownContent: `# Conversation-first Coding

## What is Conversation-first Coding?

Instead of treating AI as a code generator, treat it as a **collaborative partner** in a conversation. Build solutions iteratively through dialogue.

### Traditional Approach (Wrong):
\`\`\`
You: "Create a todo app"
AI: [generates 500 lines of code]
You: [hopes it works]
\`\`\`

### Conversation-first Approach (Right):
\`\`\`
You: "I want to build a todo app. Let's start with the data model."
AI: "Here's a simple Todo type..."
You: "Good. Now let's create the form component."
AI: "Here's a form with validation..."
You: "The validation isn't working. Let me show you the error."
AI: "I see the issue. Here's the fix..."
\`\`\`

## The Conversation-first Workflow

### Step 1: Start with Architecture

**You:** "I want to build a feature that lets users save their favorite articles. How should we structure this?"

**AI:** "We could create:
- A favorites table in the database
- An API endpoint to add/remove favorites
- A component to display favorites
- A button to toggle favorite status"

**You:** "Good. Let's start with the database schema."

### Step 2: Build Incrementally

**You:** "Create the database migration for favorites."

**AI:** [Creates migration]

**You:** "Now create the API endpoint to add a favorite."

**AI:** [Creates endpoint]

**You:** "Add error handling for when the article doesn't exist."

**AI:** [Adds error handling]

### Step 3: Iterate and Refine

**You:** "The endpoint works, but I want to return the updated favorite count."

**AI:** [Modifies endpoint]

**You:** "Actually, let's make it return the full article object with a 'isFavorite' flag."

**AI:** [Refines response]

### Step 4: Test and Debug Together

**You:** "I'm getting an error: 'Cannot read property of undefined'"

**AI:** "Can you share the stack trace and the code where it's happening?"

**You:** [Shares error and code]

**AI:** "The issue is that the user might not be authenticated. Let's add a check."

## Benefits of Conversation-first Coding

### 1. Better Understanding
- You learn as you build
- AI explains decisions
- You catch issues early

### 2. Incremental Progress
- Small, testable changes
- Easy to roll back mistakes
- Clear progress tracking

### 3. Collaborative Learning
- AI teaches you patterns
- You guide the architecture
- Together you build better solutions

### 4. Error Prevention
- Issues caught in conversation
- Requirements clarified early
- Architecture validated before coding

## Practical Examples

### Example 1: Building a Feature

**Conversation Flow:**
1. **Plan**: "Let's discuss the approach"
2. **Design**: "What should the API look like?"
3. **Implement**: "Create the first component"
4. **Test**: "This isn't working, here's why"
5. **Refine**: "Let's improve this part"
6. **Complete**: "Add the final touches"

### Example 2: Debugging

**Conversation Flow:**
1. **Describe**: "The login isn't working"
2. **Investigate**: "Let's check the network request"
3. **Isolate**: "The error happens when..."
4. **Fix**: "Here's what's wrong and how to fix it"
5. **Verify**: "Test this and let me know if it works"

### Example 3: Refactoring

**Conversation Flow:**
1. **Identify**: "This code is getting messy"
2. **Discuss**: "How should we organize it?"
3. **Plan**: "Let's extract these into separate files"
4. **Execute**: "Refactor step by step"
5. **Validate**: "Make sure nothing broke"

## Best Practices

### ✅ Do:
- Start with questions and planning
- Build in small increments
- Test each step
- Ask for explanations
- Iterate based on results

### ❌ Don't:
- Ask for entire features at once
- Accept code without understanding
- Skip testing between steps
- Ignore AI's questions
- Rush to completion

## Conversation Patterns

### Pattern 1: The Explorer
\`\`\`
You: "I'm not sure how to approach this. What are the options?"
AI: "Here are 3 approaches..."
You: "Option 2 sounds good. How would we implement it?"
\`\`\`

### Pattern 2: The Validator
\`\`\`
You: "I'm thinking of doing X. Does that make sense?"
AI: "Yes, but consider Y..."
You: "Good point. Let's incorporate that."
\`\`\`

### Pattern 3: The Debugger
\`\`\`
You: "This code isn't working. Here's what I see..."
AI: "The issue is likely X. Try this..."
You: "That helped, but now Y is happening."
AI: "Ah, that's because Z. Here's the fix..."
\`\`\`

### Exercise:

Practice conversation-first coding:
1. Pick a small feature (e.g., "add a search bar")
2. Start a conversation: "I want to add search. Let's discuss the approach."
3. Build it step-by-step through conversation
4. Notice how the process feels different from asking for everything at once

**Takeaway**: Coding with AI is a conversation, not a transaction. Build iteratively, learn continuously, and collaborate effectively.`,
            duration: 20,
          },
          {
            id: "lesson-1-5",
            title: "Chain-of-thought with Dev Tools",
            markdownContent: `# Chain-of-thought with Dev Tools

## What is Chain-of-thought?

**Chain-of-thought** is a technique where you break down complex problems into smaller, logical steps. When combined with development tools, it becomes a powerful workflow.

### The Concept:

Instead of:
\`\`\`
Problem → Solution
\`\`\`

Do this:
\`\`\`
Problem → Step 1 → Step 2 → Step 3 → Solution
\`\`\`

## Using Chain-of-thought with AI

### Example: Building a User Dashboard

**Without Chain-of-thought:**
\`\`\`
You: "Create a user dashboard with stats, recent activity, and a profile section"
AI: [Generates complex component, might miss requirements]
\`\`\`

**With Chain-of-thought:**
\`\`\`
You: "Let's build a user dashboard. First, what data do we need?"
AI: "We'll need user stats, recent activity, and profile info."
You: "Good. Step 1: Create a data fetching function for user stats."
AI: [Creates function]
You: "Step 2: Create a StatsCard component to display one stat."
AI: [Creates component]
You: "Step 3: Create the dashboard layout using StatsCard."
AI: [Creates layout]
You: "Step 4: Add the activity feed section."
AI: [Adds section]
\`\`\`

## Chain-of-thought with Development Tools

### 1. Terminal/Command Line

**Use AI to understand commands:**
\`\`\`
You: "I need to install a package. What's the command?"
AI: "Use: npm install package-name"
You: "It's giving an error about peer dependencies. What does that mean?"
AI: "Peer dependencies are packages your package needs. Try: npm install --legacy-peer-deps"
\`\`\`

**Break down complex commands:**
\`\`\`
You: "I want to set up a new Next.js project with TypeScript and Tailwind."
AI: "Let's do this step by step:
1. npx create-next-app@latest my-app
2. Select TypeScript when prompted
3. cd my-app
4. npm install -D tailwindcss postcss autoprefixer
5. npx tailwindcss init -p"
\`\`\`

### 2. Git Workflow

**Chain-of-thought for Git operations:**
\`\`\`
You: "I made changes to 3 files. How do I commit them properly?"
AI: "Let's do this step by step:
1. Check what changed: git status
2. Review the changes: git diff
3. Stage specific files: git add file1.ts file2.ts
4. Commit with message: git commit -m 'Add feature X'
5. Push: git push"
\`\`\`

**Handling conflicts:**
\`\`\`
You: "I'm getting a merge conflict. What do I do?"
AI: "Let's resolve it step by step:
1. See which files conflict: git status
2. Open the conflicted file
3. Look for conflict markers: <<<<<<< HEAD
4. Choose which version to keep (or combine)
5. Remove conflict markers
6. Stage the file: git add filename
7. Complete merge: git commit"
\`\`\`

### 3. Debugging Tools

**Using browser DevTools with AI:**
\`\`\`
You: "My React component isn't rendering. How do I debug it?"
AI: "Let's debug step by step:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab if making API calls
4. Use React DevTools to inspect component state
5. Add console.log to trace the issue
6. Share the error message with me"
\`\`\`

**Debugging with logs:**
\`\`\`
You: "I'm getting an error but don't know where it's coming from."
AI: "Let's trace it:
1. Add console.log at the entry point
2. Add logs at each step
3. Run the code and see where it stops
4. The last log before the error is where the issue is"
\`\`\`

### 4. Package Management

**Understanding dependencies:**
\`\`\`
You: "My project has 500 dependencies. Is that normal?"
AI: "Let's analyze:
1. Check package.json for direct dependencies
2. Run: npm list --depth=0 (shows only top-level)
3. Identify which are actually needed
4. Consider if some can be removed
5. Use: npm audit to check for vulnerabilities"
\`\`\`

### 5. Build Tools

**Troubleshooting builds:**
\`\`\`
You: "My build is failing. How do I debug it?"
AI: "Let's debug step by step:
1. Read the error message carefully
2. Check which step failed (compilation, tests, etc.)
3. Look at the specific file mentioned
4. Check if dependencies are installed: npm install
5. Clear cache: npm run clean or delete node_modules
6. Try building again: npm run build"
\`\`\`

## Chain-of-thought Patterns

### Pattern 1: The Investigator
\`\`\`
1. What's the problem? (Define)
2. Where is it happening? (Locate)
3. Why is it happening? (Understand)
4. How do we fix it? (Solve)
5. Did it work? (Verify)
\`\`\`

### Pattern 2: The Builder
\`\`\`
1. What do we need? (Requirements)
2. What exists already? (Inventory)
3. What's missing? (Gap analysis)
4. How do we build it? (Implementation)
5. Does it work? (Testing)
\`\`\`

### Pattern 3: The Optimizer
\`\`\`
1. What's the current state? (Baseline)
2. What's the problem? (Identify issue)
3. What are the options? (Explore)
4. Which is best? (Choose)
5. How do we implement? (Execute)
6. Is it better? (Measure)
\`\`\`

## Practical Workflow

### Setting Up a New Project:

**Step-by-step with AI:**
1. **Plan**: "I want to build X. What do I need?"
2. **Setup**: "Create the project structure"
3. **Configure**: "Set up the configuration files"
4. **Dependencies**: "Install required packages"
5. **Test**: "Verify everything works"
6. **Iterate**: "Add the first feature"

### Fixing a Bug:

**Step-by-step with AI:**
1. **Reproduce**: "How do I make the bug happen?"
2. **Isolate**: "What's the minimal case?"
3. **Investigate**: "What's causing it?"
4. **Fix**: "How do we solve it?"
5. **Test**: "Does the fix work?"
6. **Verify**: "Did we break anything else?"

### Exercise:

Pick a task and work through it with chain-of-thought:
1. Break it into 5-7 steps
2. Complete each step with AI's help
3. Verify each step before moving on
4. Notice how this feels different from doing it all at once

**Takeaway**: Chain-of-thought turns complex problems into manageable steps. Combined with dev tools, it makes you a more effective developer.`,
            duration: 20,
          },
          {
            id: "lesson-1-6",
            title: "When Not to Trust AI",
            markdownContent: `# When Not to Trust AI

## The Critical Skill: Knowing When AI is Wrong

AI is powerful, but it's not infallible. Learning when **not** to trust AI is as important as learning how to use it.

## Common AI Mistakes

### 1. Hallucinated Code

**What it is:** AI generates code that looks correct but doesn't actually work or doesn't exist.

**Example:**
\`\`\`
AI: "Use the getUsers() method from the API client"
Reality: That method doesn't exist. It's actually getAllUsers()
\`\`\`

**How to catch it:**
- ✅ Check the actual API documentation
- ✅ Look at the source code
- ✅ Test the code immediately
- ❌ Don't assume AI knows your specific APIs

### 2. Outdated Information

**What it is:** AI's training data has a cutoff date. It might suggest deprecated methods.

**Example:**
\`\`\`
AI: "Use componentWillMount() in React"
Reality: That's deprecated. Use useEffect() instead.
\`\`\`

**How to catch it:**
- ✅ Check the official documentation
- ✅ Look for deprecation warnings
- ✅ Use the latest stable versions
- ❌ Don't trust version-specific advice without verifying

### 3. Security Vulnerabilities

**What it is:** AI might suggest code that works but is insecure.

**Example:**
\`\`\`
AI: "Store the API key in localStorage"
Reality: This exposes the key to XSS attacks
\`\`\`

**How to catch it:**
- ✅ Review security best practices
- ✅ Never trust AI with security decisions alone
- ✅ Get security review for sensitive code
- ❌ Don't implement security code without understanding it

### 4. Performance Issues

**What it is:** AI might generate code that works but is inefficient.

**Example:**
\`\`\`
AI: "Loop through all users to find one"
Reality: Use a database query with WHERE clause instead
\`\`\`

**How to catch it:**
- ✅ Understand the performance implications
- ✅ Test with realistic data volumes
- ✅ Profile the code if needed
- ❌ Don't assume AI optimizes for performance

### 5. Wrong Patterns for Your Codebase

**What it is:** AI suggests generic patterns that don't match your project's conventions.

**Example:**
\`\`\`
AI: "Use Redux for state management"
Reality: Your project uses Zustand, and this feature doesn't need global state
\`\`\`

**How to catch it:**
- ✅ Know your project's patterns
- ✅ Check existing similar code
- ✅ Follow your team's conventions
- ❌ Don't blindly adopt AI's suggestions

### 6. Missing Edge Cases

**What it is:** AI generates code that works for the happy path but fails on edge cases.

**Example:**
\`\`\`
AI: "Divide by userCount to get average"
Reality: What if userCount is 0? Division by zero error!
\`\`\`

**How to catch it:**
- ✅ Think about edge cases
- ✅ Test with empty/null/undefined values
- ✅ Add proper error handling
- ❌ Don't trust code handles all cases

### 7. Incorrect TypeScript Types

**What it is:** AI might generate TypeScript that compiles but has wrong types.

**Example:**
\`\`\`
AI: "The function returns a string"
Reality: It actually returns string | null, causing runtime errors
\`\`\`

**How to catch it:**
- ✅ Let TypeScript catch type errors
- ✅ Test the actual runtime behavior
- ✅ Understand the types you're working with
- ❌ Don't ignore TypeScript errors

## Red Flags: When to Be Extra Skeptical

### 🚩 AI is Confident About Something You've Never Heard Of
\`\`\`
AI: "Just use the new SuperFramework v2.0"
You: "I've never heard of that..."
Action: Research it first. It might be made up.
\`\`\`

### 🚩 AI Suggests Something That Seems Too Easy
\`\`\`
AI: "Just add this one line and it will work"
You: "That seems too simple for this complex problem..."
Action: Verify it actually works. Test thoroughly.
\`\`\`

### 🚩 AI Contradicts Established Best Practices
\`\`\`
AI: "It's fine to commit API keys to git"
You: "That goes against everything I've learned..."
Action: Trust your instincts. AI is wrong here.
\`\`\`

### 🚩 AI Can't Explain Why
\`\`\`
You: "Why does this work?"
AI: "It just does"
Action: If AI can't explain, be skeptical. Understand the code yourself.
\`\`\`

## How to Verify AI Output

### 1. Test Immediately
\`\`\`
✅ Run the code
✅ Check for errors
✅ Test edge cases
✅ Verify it does what you expect
\`\`\`

### 2. Cross-Reference
\`\`\`
✅ Check official documentation
✅ Look at similar code in your project
✅ Search for the pattern online
✅ Ask on forums if unsure
\`\`\`

### 3. Understand, Don't Just Copy
\`\`\`
✅ Read the code AI generated
✅ Understand what it does
✅ Know why it works
✅ Be able to explain it
\`\`\`

### 4. Get Second Opinions
\`\`\`
✅ Ask teammates
✅ Post on Stack Overflow
✅ Check GitHub discussions
✅ Review with senior developers
\`\`\`

## The Trust Spectrum

### High Trust (Safe to Use):
- ✅ Code structure and organization
- ✅ Common patterns and idioms
- ✅ Syntax and language features
- ✅ General programming concepts

### Medium Trust (Verify):
- ⚠️ API usage and methods
- ⚠️ Framework-specific features
- ⚠️ Performance optimizations
- ⚠️ Library integrations

### Low Trust (Always Verify):
- ❌ Security-related code
- ❌ Authentication/authorization
- ❌ Database queries (SQL injection risk)
- ❌ Financial calculations
- ❌ Production deployment steps

## Best Practices

### ✅ Do:
- Test everything AI generates
- Understand the code before using it
- Verify against documentation
- Review security implications
- Check for edge cases

### ❌ Don't:
- Blindly copy-paste code
- Trust AI with security
- Skip testing
- Ignore your instincts
- Use code you don't understand

## Exercise:

Review some AI-generated code you've used:
1. Did it work correctly?
2. Were there any issues?
3. What would you verify differently next time?
4. What red flags did you miss (if any)?

**Takeaway**: AI is a tool, not a replacement for your judgment. Trust, but verify. Understand, don't just copy.`,
            duration: 25,
          },
        ],
      },
      {
        id: "module-2",
        title: "Module 2 - Cursor Deep Dive",
        description:
          "Master Cursor IDE from scratch. Learn workspaces, Composer, autocomplete, commands, edit workflows, Cursor Rules, and debugging. Become proficient in the most powerful AI coding tool.",
        lessons: [
          {
            id: "lesson-2-1",
            title: "Getting Started with Cursor Workspaces",
            markdownContent: `# Getting Started with Cursor Workspaces

## What is Cursor?

**Cursor** is an AI-powered code editor built on VS Code. It's designed specifically for AI-assisted development.

### Installation and Setup

**Step 1: Download Cursor**
- Visit cursor.sh
- Download for your operating system
- Install like any other application

**Step 2: Open Your First Project**
- File → Open Folder
- Select your project directory
- Cursor will index your codebase

**Step 3: Configure Settings**
- Open Settings (Cmd/Ctrl + ,)
- Enable AI features
- Set up your preferences

## Understanding Workspaces

### What is a Workspace?

A **workspace** is your project folder. Cursor analyzes everything in it to provide context-aware AI assistance.

### Workspace Features:

**1. Code Indexing:**
- Cursor scans all files in your workspace
- Builds an understanding of your codebase
- Enables context-aware suggestions

**2. File Navigation:**
- Quick file search (Cmd/Ctrl + P)
- Symbol search (Cmd/Ctrl + Shift + O)
- Recent files (Cmd/Ctrl + R)

**3. Project Context:**
- AI understands your project structure
- Knows about your dependencies
- Recognizes your coding patterns

### Best Practices for Workspaces:

**✅ Do:**
- Keep related files in the same workspace
- Use clear folder structure
- Include configuration files
- Keep node_modules (Cursor needs it for context)

**❌ Don't:**
- Open the entire hard drive as workspace
- Include unnecessary large files
- Mix unrelated projects

### Workspace Configuration:

**Create .cursorrules file:**
\`\`\`
# Project-specific rules for AI
- Use TypeScript strict mode
- Follow our component naming convention
- Prefer functional components
- Use our custom hooks pattern
\`\`\`

This file tells Cursor (and AI) about your project's conventions.

## Opening and Managing Workspaces

### Opening a Workspace:

1. **From Menu:** File → Open Folder
2. **From Command:** Cmd/Ctrl + K, then "Open Folder"
3. **Recent:** File → Open Recent

### Multiple Workspaces:

You can have multiple workspace windows open:
- Each maintains its own context
- Useful for working on related projects
- AI context is separate per workspace

### Workspace Settings:

**Workspace-specific settings** (in .vscode/settings.json):
\`\`\`
{
  "cursor.ai.enabled": true,
  "cursor.ai.model": "claude-3.5-sonnet",
  "editor.formatOnSave": true
}
\`\`\`

## Understanding the Interface

### Key Areas:

**1. File Explorer (Left Sidebar):**
- Browse your project files
- Right-click for context menu
- Drag and drop to reorganize

**2. Editor (Center):**
- Where you write code
- Multiple tabs for different files
- Split view for side-by-side editing

**3. AI Panel (Right Sidebar):**
- Chat with AI
- Composer interface
- Command history

**4. Terminal (Bottom):**
- Run commands
- See build output
- Execute scripts

### Customizing Layout:

- Drag panels to rearrange
- Resize by dragging edges
- Hide/show panels with View menu
- Save layouts for different tasks

## Exercise:

1. Open Cursor
2. Create a new folder for practice
3. Open it as a workspace
4. Create a simple file (e.g., test.js)
5. Notice how Cursor indexes it
6. Try the file search (Cmd/Ctrl + P)

**Takeaway**: Workspaces are the foundation. Cursor needs to understand your project structure to help effectively.`,
            duration: 15,
          },
          {
            id: "lesson-2-2",
            title: "Mastering Cursor Composer",
            markdownContent: `# Mastering Cursor Composer

## What is Composer?

**Composer** is Cursor's powerful multi-file editing tool. It lets you describe changes across multiple files, and AI implements them intelligently.

### Opening Composer:

**Method 1: Keyboard Shortcut**
- Press \`Cmd/Ctrl + I\` (or \`Cmd/Ctrl + Shift + I\`)

**Method 2: Command Palette**
- Press \`Cmd/Ctrl + Shift + P\`
- Type "Composer"
- Select "Open Composer"

**Method 3: Button**
- Click the Composer icon in the sidebar

## How Composer Works

### The Interface:

**Top Section:** Your prompt/instructions
**Middle Section:** Files that will be modified (preview)
**Bottom Section:** Generated code changes

### Basic Workflow:

1. **Describe what you want:**
   \`\`\`
   "Add a user authentication system with login and signup pages"
   \`\`\`

2. **Composer analyzes:**
   - Which files need to be created
   - Which files need to be modified
   - What dependencies are needed

3. **Review the plan:**
   - See what files will change
   - Check if it matches your intent
   - Adjust if needed

4. **Accept or modify:**
   - Accept all changes
   - Accept individual files
   - Request modifications

## Composer Best Practices

### 1. Be Specific

**Bad:**
\`\`\`
"Fix the bug"
\`\`\`

**Good:**
\`\`\`
"The login form isn't validating email addresses. Add email format validation using our validateEmail utility from utils/validation.ts. Show error message below the email input field."
\`\`\`

### 2. Provide Context

**Include relevant files:**
\`\`\`
"Update the UserProfile component to include a bio field. 
The User type is defined in types/user.ts.
Use the same form pattern as ContactForm.tsx."
\`\`\`

### 3. Specify File Locations

**Be clear about where things go:**
\`\`\`
"Create a new API route at app/api/users/route.ts that handles GET requests to fetch all users. Use our existing database client from lib/db.ts."
\`\`\`

### 4. Reference Existing Patterns

**Point to similar code:**
\`\`\`
"Add a delete button to the TodoItem component, following the same pattern as the edit button. The delete should call the API endpoint at /api/todos/[id] using DELETE method."
\`\`\`

## Advanced Composer Features

### 1. Multi-file Edits

**Example:**
\`\`\`
"Refactor the authentication logic:
1. Extract auth functions to lib/auth.ts
2. Update login page to use the new functions
3. Update signup page to use the new functions
4. Create types in types/auth.ts"
\`\`\`

Composer will modify all files in one operation.

### 2. File Creation

**Example:**
\`\`\`
"Create a new component called SearchBar:
- File: components/SearchBar.tsx
- Props: onSearch callback, placeholder text
- Style: match our existing Button component
- Include debouncing for search input"
\`\`\`

### 3. Refactoring Across Files

**Example:**
\`\`\`
"Rename the 'user' variable to 'currentUser' throughout the codebase. Update all references in components, utils, and API routes."
\`\`\`

### 4. Adding Features

**Example:**
\`\`\`
"Add pagination to the user list:
- Update the API route to accept page and limit params
- Modify the UserList component to show page controls
- Add pagination state management
- Update types to include pagination metadata"
\`\`\`

## Composer vs Chat

### Use Composer When:
- ✅ Making changes across multiple files
- ✅ Creating new features
- ✅ Refactoring code
- ✅ Following a structured plan

### Use Chat When:
- ✅ Asking questions
- ✅ Debugging issues
- ✅ Learning concepts
- ✅ Getting explanations

## Reviewing Composer Changes

### Before Accepting:

**1. Check the File List:**
- Are the right files being modified?
- Are any important files missing?
- Are there unexpected files?

**2. Review the Changes:**
- Does the code look correct?
- Are there any obvious errors?
- Does it follow your patterns?

**3. Test the Changes:**
- Accept and test
- Or modify the prompt first

### Accepting Changes:

**Options:**
- **Accept All:** Apply all changes at once
- **Accept Individual:** Accept files one by one
- **Modify Prompt:** Ask for changes before accepting

## Common Composer Patterns

### Pattern 1: Feature Addition
\`\`\`
"Add [feature] to [component/page]:
- Create [new files]
- Update [existing files]
- Follow [pattern/example]"
\`\`\`

### Pattern 2: Bug Fix
\`\`\`
"Fix [issue] in [file]:
- Problem: [description]
- Expected: [what should happen]
- Current: [what's happening now]"
\`\`\`

### Pattern 3: Refactoring
\`\`\`
"Refactor [code] to:
- Extract [logic] to [new file]
- Update [files] to use [new structure]
- Maintain [existing functionality]"
\`\`\`

## Troubleshooting Composer

### Issue: Composer doesn't understand

**Solution:**
- Be more specific
- Include file paths
- Show examples
- Break into smaller steps

### Issue: Wrong files selected

**Solution:**
- Explicitly list files to modify
- Use file paths in your prompt
- Review before accepting

### Issue: Code doesn't match patterns

**Solution:**
- Reference existing code
- Point to example files
- Specify your conventions

## Exercise:

1. Open Composer in Cursor
2. Try a simple change: "Add a console.log to the main function"
3. Review what Composer plans to do
4. Accept and see the change
5. Try something more complex: "Create a utility function to format dates"

**Takeaway**: Composer is powerful for multi-file edits. The key is being specific and providing good context.`,
            duration: 25,
          },
          {
            id: "lesson-2-3",
            title: "Autocomplete vs Commands",
            markdownContent: `# Autocomplete vs Commands

## Two Ways to Get AI Help

Cursor offers two primary ways to interact with AI:
1. **Autocomplete** - AI suggests code as you type
2. **Commands** - You explicitly ask AI to do something

Understanding when to use each is crucial for effective AI-assisted coding.

## Autocomplete (Inline Suggestions)

### What is Autocomplete?

As you type, Cursor's AI suggests completions in real-time. It's like having a pair programmer suggesting the next line.

### How It Works:

**Trigger:**
- Start typing code
- AI analyzes context
- Suggests completions
- Press \`Tab\` to accept

**Example:**
\`\`\`
You type: "const user = await fetch"
AI suggests: "const user = await fetchUserById(id)"
You press Tab to accept
\`\`\`

### When to Use Autocomplete:

**✅ Good for:**
- Writing code line by line
- Following existing patterns
- Quick completions
- Staying in flow

**❌ Not ideal for:**
- Large refactors
- Multi-file changes
- Complex logic
- When you need explanations

### Autocomplete Settings:

**Enable/Disable:**
- Settings → Cursor → Autocomplete
- Toggle on/off
- Adjust suggestion frequency

**Keyboard Shortcuts:**
- \`Tab\` - Accept suggestion
- \`Esc\` - Dismiss suggestion
- \`Ctrl + →\` - Accept word by word

### Autocomplete Best Practices:

**1. Let it suggest, but review:**
- Don't blindly accept
- Understand what it's suggesting
- Modify if needed

**2. Provide context:**
- Write clear variable names
- Add comments for complex logic
- Keep related code nearby

**3. Guide with comments:**
\`\`\`
// Fetch user data and validate email
const user = await... // AI will suggest appropriate code
\`\`\`

## Commands (Explicit AI Requests)

### What are Commands?

**Commands** are explicit instructions you give to AI. You ask it to do something specific.

### How to Use Commands:

**Method 1: Chat Interface**
- Open chat (Cmd/Ctrl + L)
- Type your command
- AI responds with code or explanation

**Method 2: Inline Command**
- Select code
- Press \`Cmd/Ctrl + K\`
- Type command
- AI modifies code inline

**Method 3: Command Palette**
- \`Cmd/Ctrl + Shift + P\`
- Type "Cursor:"
- Select command

### Types of Commands:

**1. Explain Code:**
\`\`\`
Select code → Cmd+K → "Explain this"
\`\`\`

**2. Refactor:**
\`\`\`
Select code → Cmd+K → "Refactor to use async/await"
\`\`\`

**3. Fix Bug:**
\`\`\`
Select code → Cmd+K → "Fix the null pointer error"
\`\`\`

**4. Add Feature:**
\`\`\`
Cmd+K → "Add error handling to this function"
\`\`\`

**5. Generate Code:**
\`\`\`
Cmd+K → "Create a function that validates email addresses"
\`\`\`

### Command Best Practices:

**1. Be specific:**
\`\`\`
Bad: "Fix this"
Good: "Add null check before accessing user.name property"
\`\`\`

**2. Provide context:**
\`\`\`
"Refactor this to match the pattern in utils/helpers.ts"
\`\`\`

**3. Iterate:**
\`\`\`
First: "Add validation"
Then: "Make the error message more specific"
Then: "Add it to the form component"
\`\`\`

## When to Use What

### Use Autocomplete When:
- ✅ Writing new code
- ✅ Following existing patterns
- ✅ Quick completions needed
- ✅ Staying in coding flow

### Use Commands When:
- ✅ Need to understand code
- ✅ Refactoring existing code
- ✅ Fixing bugs
- ✅ Adding complex features
- ✅ Need explanations

## Combining Both

### The Workflow:

**1. Start with Command:**
\`\`\`
Cmd+K: "Create a function to fetch user data"
\`\`\`

**2. Use Autocomplete:**
\`\`\`
AI generates function, you use autocomplete to fill in details
\`\`\`

**3. Refine with Command:**
\`\`\`
Cmd+K: "Add error handling"
\`\`\`

**4. Continue with Autocomplete:**
\`\`\`
Use autocomplete for related code
\`\`\`

## Practical Examples

### Example 1: Building a Component

**Step 1 - Command:**
\`\`\`
Cmd+K: "Create a Button component with variant prop"
\`\`\`

**Step 2 - Autocomplete:**
\`\`\`
Use autocomplete to add styling, hover states, etc.
\`\`\`

**Step 3 - Command:**
\`\`\`
Cmd+K: "Add TypeScript types for the props"
\`\`\`

### Example 2: Debugging

**Step 1 - Command:**
\`\`\`
Select error code → Cmd+K: "Why is this failing?"
\`\`\`

**Step 2 - Command:**
\`\`\`
Cmd+K: "Fix the issue"
\`\`\`

**Step 3 - Autocomplete:**
\`\`\`
Use autocomplete to add related error handling
\`\`\`

### Example 3: Refactoring

**Step 1 - Command:**
\`\`\`
Select old code → Cmd+K: "Refactor to use modern React hooks"
\`\`\`

**Step 2 - Review:**
- Check the refactored code
- Test it works

**Step 3 - Autocomplete:**
\`\`\`
Use autocomplete for any additional changes needed
\`\`\`

## Keyboard Shortcuts Reference

### Autocomplete:
- \`Tab\` - Accept suggestion
- \`Esc\` - Dismiss
- \`Ctrl + →\` - Accept word
- \`Alt + ]\` - Next suggestion
- \`Alt + [\` - Previous suggestion

### Commands:
- \`Cmd/Ctrl + K\` - Inline command
- \`Cmd/Ctrl + L\` - Open chat
- \`Cmd/Ctrl + Shift + L\` - Composer
- \`Cmd/Ctrl + I\` - Alternative command mode

## Tips for Efficiency

### 1. Learn the Shortcuts
- Muscle memory saves time
- Practice common commands
- Customize if needed

### 2. Use the Right Tool
- Autocomplete for flow
- Commands for thinking
- Don't force one approach

### 3. Review Before Accepting
- Understand suggestions
- Verify correctness
- Modify if needed

### 4. Build Your Workflow
- Develop your own patterns
- Combine tools effectively
- Iterate and improve

## Exercise:

1. Open a file in Cursor
2. Try autocomplete: Type a function and see suggestions
3. Try a command: Select code, press Cmd+K, ask to explain it
4. Combine: Use command to create code, then autocomplete to extend it
5. Notice the difference in workflow

**Takeaway**: Autocomplete keeps you in flow. Commands help you think and plan. Use both effectively.`,
            duration: 20,
          },
          {
            id: "lesson-2-4",
            title: "Edit This File Workflows",
            markdownContent: `# "Edit This File" Workflows

## The Power of File-Level Editing

One of Cursor's most powerful features is the ability to ask AI to edit entire files. This is different from line-by-line editing - you're working at a higher level.

## Basic "Edit This File" Workflow

### Step 1: Open the File
- Navigate to the file you want to edit
- Have it open in the editor

### Step 2: Use Chat or Command
- Open chat (\`Cmd/Ctrl + L\`)
- Or use inline command (\`Cmd/Ctrl + K\`)

### Step 3: Give File-Level Instructions
\`\`\`
"Add error handling to all API calls in this file"
"Refactor all functions to use async/await"
"Add TypeScript types throughout this file"
\`\`\`

### Step 4: Review Changes
- AI shows you the modified file
- Review the changes
- Accept or request modifications

## Common File Editing Patterns

### Pattern 1: Adding Features

**Example:**
\`\`\`
File: components/UserProfile.tsx

Command: "Add a 'Change Password' section to this component. Include a form with current password, new password, and confirm password fields. Add validation and submit handler."
\`\`\`

**What AI does:**
- Analyzes the entire file
- Understands the structure
- Adds the new section appropriately
- Maintains existing code style

### Pattern 2: Refactoring

**Example:**
\`\`\`
File: utils/api.ts

Command: "Refactor all fetch calls to use async/await instead of .then() chains. Add proper error handling with try/catch blocks."
\`\`\`

**What AI does:**
- Finds all fetch calls
- Converts to async/await
- Adds error handling
- Maintains functionality

### Pattern 3: Adding Types

**Example:**
\`\`\`
File: components/ProductList.tsx

Command: "Add TypeScript types to all props, state, and function parameters. Create interfaces for complex objects."
\`\`\`

**What AI does:**
- Analyzes the code
- Identifies what needs types
- Creates appropriate interfaces
- Adds type annotations

### Pattern 4: Fixing Issues

**Example:**
\`\`\`
File: lib/auth.ts

Command: "Fix all the security issues in this file. Add input validation, sanitize user inputs, and add rate limiting checks."
\`\`\`

**What AI does:**
- Identifies security issues
- Adds validation
- Implements security measures
- Maintains functionality

## Advanced File Editing Techniques

### 1. Multi-Step Refactoring

**Step 1:**
\`\`\`
"Extract all utility functions to separate functions at the bottom of the file"
\`\`\`

**Step 2:**
\`\`\`
"Move those utility functions to a new file: utils/helpers.ts"
\`\`\`

**Step 3:**
\`\`\`
"Update imports to use the new utils file"
\`\`\`

### 2. Pattern-Based Changes

**Example:**
\`\`\`
"Replace all instances of 'var' with 'const' or 'let' as appropriate. Use 'const' for values that don't change, 'let' for values that do."
\`\`\`

### 3. Style Consistency

**Example:**
\`\`\`
"Update this file to match our project's style guide:
- Use arrow functions instead of function declarations
- Use template literals instead of string concatenation
- Add JSDoc comments to all exported functions"
\`\`\`

## File Editing Best Practices

### 1. Be Specific About Scope

**Bad:**
\`\`\`
"Fix everything"
\`\`\`

**Good:**
\`\`\`
"Add error handling to the fetchUser and fetchPosts functions. Include try/catch blocks and proper error messages."
\`\`\`

### 2. Reference Existing Patterns

**Example:**
\`\`\`
"Add logging to all functions, following the same pattern used in utils/logger.ts"
\`\`\`

### 3. Break Large Changes into Steps

**Instead of:**
\`\`\`
"Completely rewrite this file"
\`\`\`

**Do this:**
\`\`\`
Step 1: "Extract the data fetching logic"
Step 2: "Refactor the component structure"
Step 3: "Add error boundaries"
Step 4: "Update styling"
\`\`\`

### 4. Review Before Accepting

**Always:**
- Read through the changes
- Understand what was modified
- Check for unintended changes
- Test the code

## Working with Multiple Files

### Sequential File Editing

**Workflow:**
1. Edit File 1: "Add the API function"
2. Edit File 2: "Use the API function from File 1"
3. Edit File 3: "Update types to match"

### Using Composer for Multi-File

**For related changes:**
- Use Composer instead
- It handles dependencies better
- Shows all changes together

## Common File Editing Scenarios

### Scenario 1: Adding a New Feature

**Files involved:**
- Component file
- Types file
- API route file

**Workflow:**
1. Edit types file: "Add UserSettings type"
2. Edit API file: "Add endpoint for user settings"
3. Edit component: "Add settings form component"

### Scenario 2: Refactoring

**Single file refactor:**
\`\`\`
"Refactor this component to use custom hooks. Extract useState logic into useUserData hook and useEffect logic into useUserEffects hook."
\`\`\`

### Scenario 3: Bug Fixes

**Example:**
\`\`\`
"This file has a memory leak. The event listeners aren't being cleaned up. Fix all useEffect hooks to properly clean up."
\`\`\`

## Tips for Effective File Editing

### 1. Start with Clear Intent
- Know what you want to achieve
- Describe it clearly
- Break into steps if complex

### 2. Use Comments to Guide
\`\`\`
// TODO: Add error handling here
// FIXME: This needs refactoring
\`\`\`

AI will notice these and address them.

### 3. Test Incrementally
- Make changes
- Test immediately
- Fix issues before continuing

### 4. Keep Backups
- Commit before large changes
- Use git to track changes
- Easy to revert if needed

## Exercise:

1. Open a file in your project
2. Try a simple edit: "Add console.log statements to all functions"
3. Review the changes
4. Try something more complex: "Add JSDoc comments to all exported functions"
5. Notice how AI understands the file structure

**Takeaway**: File-level editing is powerful. Use it for refactoring, adding features, and maintaining code quality across entire files.`,
            duration: 20,
          },
          {
            id: "lesson-2-5",
            title: "Cursor Rules & Repo Guidelines",
            markdownContent: `# Cursor Rules & Repo Guidelines

## What are Cursor Rules?

**Cursor Rules** are instructions you give to Cursor (and AI) about how to work with your codebase. They're like a style guide and coding standards document that AI follows automatically.

## Why Use Cursor Rules?

### Benefits:

1. **Consistency**: AI generates code that matches your style
2. **Quality**: Enforces your best practices
3. **Efficiency**: Less time fixing style issues
4. **Team Alignment**: Everyone's AI follows the same rules

## Creating .cursorrules File

### Location:

Create a file named \`.cursorrules\` in your project root:

\`\`\`
project/
├── .cursorrules  ← Here
├── src/
├── package.json
\`\`\`

### Basic Structure:

\`\`\`
# Project Rules

## Code Style
- Use TypeScript strict mode
- Prefer const over let
- Use arrow functions for callbacks

## Naming Conventions
- Components: PascalCase (UserProfile.tsx)
- Utilities: camelCase (formatDate.ts)
- Constants: UPPER_SNAKE_CASE

## Patterns
- Use functional components
- Prefer hooks over class components
- Extract reusable logic to custom hooks
\`\`\`

## Common Rule Categories

### 1. Language-Specific Rules

**TypeScript:**
\`\`\`
## TypeScript
- Always use explicit types for function parameters
- Use interfaces for object shapes
- Avoid 'any' type
- Enable strict null checks
- Use type guards for runtime checks
\`\`\`

**JavaScript:**
\`\`\`
## JavaScript
- Use ES6+ features
- Prefer const/let over var
- Use template literals
- Use destructuring
- Use arrow functions
\`\`\`

### 2. Framework Rules

**React:**
\`\`\`
## React
- Use functional components only
- Use hooks for state and effects
- Extract components when > 100 lines
- Use PropTypes or TypeScript
- Keep components focused and small
\`\`\`

**Next.js:**
\`\`\`
## Next.js
- Use App Router (not Pages Router)
- Server Components by default
- Client Components only when needed
- Use Server Actions for mutations
- Follow file-based routing conventions
\`\`\`

### 3. Code Organization

\`\`\`
## File Structure
- One component per file
- Co-locate related files
- Use index.ts for exports
- Keep utils in lib/ or utils/
- Keep types in types/ or @types/

## Imports
- Group imports: external, internal, relative
- Use absolute imports with path aliases
- Remove unused imports
\`\`\`

### 4. Best Practices

\`\`\`
## Best Practices
- Always handle errors
- Add input validation
- Use environment variables for secrets
- Never commit API keys
- Add comments for complex logic
- Write self-documenting code
\`\`\`

### 5. Testing

\`\`\`
## Testing
- Write tests for utilities
- Test user interactions
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
\`\`\`

## Advanced Rules

### Referencing Other Files

\`\`\`
## Patterns to Follow
- Form validation: See utils/validation.ts
- API calls: Follow pattern in lib/api.ts
- Error handling: Use utils/errors.ts
- Styling: Match components/Button.tsx
\`\`\`

### Conditional Rules

\`\`\`
## Context-Aware Rules
- In components/: Use React patterns
- In lib/: Focus on pure functions
- In app/api/: Use Next.js API routes
- In tests/: Use testing library patterns
\`\`\`

### Project-Specific Rules

\`\`\`
## Our Project
- We use Supabase for backend
- Authentication via Supabase Auth
- Database queries use Supabase client
- Follow RLS (Row Level Security) patterns
- Use our custom hooks from hooks/
\`\`\`

## Example .cursorrules File

\`\`\`
# Web3 Coding Academy - Cursor Rules

## TypeScript
- Use strict mode
- Explicit types for all function parameters
- Use interfaces for object shapes
- Avoid 'any', use 'unknown' if needed
- Use type guards for runtime validation

## React/Next.js
- Functional components only
- Use App Router conventions
- Server Components by default
- Client Components with 'use client'
- Use Server Actions for mutations

## Code Style
- 2 spaces for indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in objects/arrays
- Max line length: 100 characters

## Naming
- Components: PascalCase (UserProfile)
- Files: Match component/export name
- Functions: camelCase (fetchUserData)
- Constants: UPPER_SNAKE_CASE (API_BASE_URL)
- Types/Interfaces: PascalCase (User, ApiResponse)

## File Organization
- One component per file
- Co-locate tests: Component.test.tsx
- Types in types/ directory
- Utils in lib/ or utils/
- Hooks in hooks/ directory

## Patterns to Follow
- API calls: lib/api.ts pattern
- Error handling: utils/errors.ts pattern
- Form validation: utils/validation.ts
- Styling: components/Button.tsx pattern

## Best Practices
- Always handle errors with try/catch
- Validate user inputs
- Use environment variables for config
- Never hardcode secrets
- Add JSDoc for complex functions
- Write self-documenting code

## Testing
- Test utilities and hooks
- Test user interactions
- Use React Testing Library
- Mock external dependencies
- Descriptive test names

## Supabase
- Use Supabase client from lib/supabase.ts
- Follow RLS patterns
- Use TypeScript types from database
- Handle auth state properly
\`\`\`

## Using Rules Effectively

### 1. Start Simple

Begin with basic rules, add more as needed:
\`\`\`
# Start here
- Use TypeScript
- Functional components
- Handle errors
\`\`\`

### 2. Reference Examples

Point to existing code:
\`\`\`
# Follow this pattern
- API calls: See lib/api.ts
- Components: Match Button.tsx style
\`\`\`

### 3. Update Regularly

As your project evolves:
- Add new patterns
- Remove outdated rules
- Update based on team feedback

### 4. Team Alignment

- Share .cursorrules with team
- Review together
- Update collaboratively

## Testing Your Rules

### After Creating Rules:

1. Ask AI to generate code
2. Check if it follows rules
3. Adjust rules if needed
4. Test again

### Example Test:

\`\`\`
"Create a new user profile component"
\`\`\`

Check:
- ✅ Uses TypeScript
- ✅ Functional component
- ✅ Follows naming conventions
- ✅ Matches your patterns

## Common Issues

### Issue: AI ignores rules

**Solutions:**
- Make rules more specific
- Reference example files
- Use stronger language ("Always", "Never")
- Break into smaller rules

### Issue: Rules conflict

**Solution:**
- Prioritize rules
- Be more specific
- Remove conflicting rules

### Issue: Too many rules

**Solution:**
- Focus on most important
- Group related rules
- Remove redundant rules

## Exercise:

1. Create a .cursorrules file in your project
2. Add 5-10 basic rules
3. Ask AI to generate some code
4. Check if it follows your rules
5. Adjust and refine

**Takeaway**: Cursor Rules make AI work the way you want. They're like having a style guide that AI actually follows.`,
            duration: 25,
          },
          {
            id: "lesson-2-6",
            title: "Debugging via Cursor's Output",
            markdownContent: `# Debugging via Cursor's Output

## Understanding Cursor's Output

When you work with AI in Cursor, it provides various types of output. Learning to read and use this output for debugging is a crucial skill.

## Types of Output in Cursor

### 1. Chat Responses

**What it is:** AI's text responses explaining code, answering questions, or providing guidance.

**How to use for debugging:**
\`\`\`
You: "This function is returning undefined"
AI: "The issue is that user might be null. Add a null check before accessing user.name"
\`\`\`

### 2. Code Suggestions

**What it is:** AI-generated code that appears in the editor.

**How to use for debugging:**
- Review the suggested code
- Check for logical errors
- Verify it handles edge cases
- Test if it solves the problem

### 3. Error Messages

**What it is:** When AI encounters issues, it shows error messages.

**How to interpret:**
\`\`\`
Error: Cannot find module './utils'
→ Check file path
→ Verify file exists
→ Check import statement
\`\`\`

### 4. Terminal Output

**What it is:** Results from running commands or code.

**How to use:**
- Copy error messages
- Share with AI for analysis
- Use to guide fixes

## Debugging Workflow with Cursor

### Step 1: Identify the Problem

**Describe the issue:**
\`\`\`
"My login form isn't submitting. When I click submit, nothing happens."
\`\`\`

**Or share the error:**
\`\`\`
"Error: Cannot read property 'email' of undefined"
\`\`\`

### Step 2: Gather Information

**Share relevant code:**
\`\`\`
Select the problematic code
Cmd+K: "Why isn't this working?"
\`\`\`

**Include error messages:**
\`\`\`
Copy error from terminal
Paste in chat: "I'm getting this error: [error message]"
\`\`\`

### Step 3: Analyze with AI

**AI will:**
- Read the code
- Identify potential issues
- Suggest fixes
- Explain the problem

### Step 4: Apply Fixes

**Review AI's suggestions:**
- Understand the fix
- Verify it makes sense
- Apply the change
- Test immediately

### Step 5: Verify

**Test the fix:**
- Run the code
- Check if error is resolved
- Verify functionality works
- Report back to AI if needed

## Reading Error Messages

### Common Error Patterns:

**1. Type Errors:**
\`\`\`
TypeError: Cannot read property 'x' of undefined
→ Something is undefined when you expect it to have a value
→ Add null/undefined checks
\`\`\`

**2. Import Errors:**
\`\`\`
Module not found: Can't resolve './components/Button'
→ File path is wrong
→ File doesn't exist
→ Check spelling and path
\`\`\`

**3. Syntax Errors:**
\`\`\`
Unexpected token
→ Missing bracket, parenthesis, or semicolon
→ Check the line mentioned
→ Look for unclosed brackets
\`\`\`

**4. Runtime Errors:**
\`\`\`
ReferenceError: x is not defined
→ Variable used before declaration
→ Typo in variable name
→ Scope issue
\`\`\`

## Using Terminal Output

### Copying Errors:

**From Terminal:**
1. Select the error text
2. Copy (Cmd/Ctrl + C)
3. Paste in Cursor chat
4. Ask AI to analyze

**Example:**
\`\`\`
Terminal shows:
Error: Failed to fetch
  at fetchUser (api.ts:15)
  at LoginForm (LoginForm.tsx:23)

You paste in chat:
"I'm getting this error. Can you help debug it?"
\`\`\`

### Stack Traces:

**Understanding stack traces:**
\`\`\`
Error: Something went wrong
  at functionA (file.ts:10)  ← Where error occurred
  at functionB (file.ts:25)   ← What called functionA
  at functionC (file.ts:40)   ← What called functionB
\`\`\`

**How to use:**
- Start from the top (where error occurred)
- Trace back through the call stack
- Share entire stack trace with AI
- AI can identify the root cause

## Debugging Strategies

### Strategy 1: Isolate the Problem

**Step 1:** Identify the failing code
**Step 2:** Isolate it (comment out other code)
**Step 3:** Test in isolation
**Step 4:** Share minimal example with AI

### Strategy 2: Add Logging

**Ask AI:**
\`\`\`
"Add console.log statements to help debug this function. Log the inputs, key variables, and the return value."
\`\`\`

**Then:**
- Run the code
- Check the logs
- Share logs with AI
- Identify the issue

### Strategy 3: Compare Working vs Broken

**Share both:**
\`\`\`
"This code works: [working code]
This code doesn't: [broken code]
What's the difference?"
\`\`\`

### Strategy 4: Step-by-Step Execution

**Ask AI to explain:**
\`\`\`
"Walk me through what happens when this function runs, step by step."
\`\`\`

**Then:**
- Follow along
- Identify where it goes wrong
- Fix that step

## Using Cursor's Debug Features

### 1. Inline Debugging

**Select code and ask:**
\`\`\`
Cmd+K: "Add debug logs to this function"
\`\`\`

### 2. Error Analysis

**Share error:**
\`\`\`
Chat: "I'm getting this error: [error]. What does it mean and how do I fix it?"
\`\`\`

### 3. Code Review

**Ask AI to review:**
\`\`\`
Cmd+K: "Review this code for potential bugs"
\`\`\`

### 4. Test Generation

**Ask for tests:**
\`\`\`
"Write tests for this function that would catch the bug I'm experiencing"
\`\`\`

## Common Debugging Scenarios

### Scenario 1: API Call Failing

**Symptoms:** Network error, 404, 500, etc.

**Debug steps:**
1. Share the API call code
2. Share the error message
3. Ask: "Why is this API call failing?"
4. Check URL, headers, method
5. Verify endpoint exists
6. Test with curl/Postman

### Scenario 2: State Not Updating

**Symptoms:** UI doesn't reflect changes

**Debug steps:**
1. Share component code
2. Share state management code
3. Ask: "Why isn't the state updating?"
4. Check setState calls
5. Verify state dependencies
6. Add logging

### Scenario 3: Component Not Rendering

**Symptoms:** Blank screen, nothing shows

**Debug steps:**
1. Share component code
2. Check browser console
3. Ask: "Why isn't this component rendering?"
4. Check for errors
5. Verify imports
6. Check conditional rendering

### Scenario 4: Type Errors

**Symptoms:** TypeScript compilation errors

**Debug steps:**
1. Share the error
2. Share the code
3. Ask: "How do I fix this TypeScript error?"
4. Check type definitions
5. Verify types match
6. Add type assertions if needed

## Best Practices

### ✅ Do:
- Share complete error messages
- Include relevant code
- Provide context about what you're trying to do
- Test fixes immediately
- Verify the solution works

### ❌ Don't:
- Share only partial errors
- Forget to include relevant code
- Skip testing
- Ignore AI's questions
- Apply fixes without understanding

## Exercise:

1. Intentionally create a bug in your code
2. Try to debug it using Cursor
3. Share the error with AI
4. Follow AI's debugging suggestions
5. Notice the process and learn from it

**Takeaway**: Debugging with Cursor is a conversation. Share errors, code, and context. Work together to find and fix issues.`,
            duration: 20,
          },
        ],
      },
      {
        id: "module-3",
        title: "Module 3 - The AI Developer Mindset",
        description:
          "Develop the mindset of an AI-powered developer. Learn to think like an architect while AI builds. Master task breakdown, code review, and enforcing project conventions. Become the strategic thinker in the AI-human partnership.",
        lessons: [
          {
            id: "lesson-3-1",
            title: "You are the Architect, AI is the Builder",
            markdownContent: `# You are the Architect, AI is the Builder

## The Fundamental Shift

When coding with AI, your role changes. You're no longer just writing code - you're **designing systems** and **directing implementation**.

### Traditional Developer:
\`\`\`
You → Write Code → Test → Deploy
\`\`\`

### AI-Powered Developer:
\`\`\`
You → Design System → AI Writes Code → You Review → Test → Deploy
\`\`\`

## What is an Architect?

An **architect** in software development:
- Designs the overall structure
- Makes strategic decisions
- Defines patterns and conventions
- Ensures quality and maintainability
- Oversees implementation

### Architect Responsibilities:

**1. System Design:**
- How should the feature work?
- What are the components?
- How do they interact?
- What are the data flows?

**2. Technology Choices:**
- Which libraries to use?
- What patterns to follow?
- How to structure code?
- What conventions to enforce?

**3. Quality Standards:**
- What makes code "good"?
- What tests are needed?
- What documentation is required?
- What performance is acceptable?

**4. Strategic Thinking:**
- How does this fit the bigger picture?
- What are the long-term implications?
- How will this scale?
- What are the trade-offs?

## What is a Builder?

The **builder** (AI in this case):
- Implements the design
- Writes the actual code
- Follows the patterns you define
- Handles the details
- Executes the plan

### AI as Builder:

**AI is good at:**
- ✅ Writing code from specifications
- ✅ Following patterns you show
- ✅ Implementing well-defined features
- ✅ Handling repetitive tasks
- ✅ Generating boilerplate

**AI is NOT good at:**
- ❌ Making architectural decisions
- ❌ Understanding business context
- ❌ Balancing trade-offs
- ❌ Long-term planning
- ❌ Understanding "why"

## The Partnership

### Your Role (Architect):

**1. Define the Vision:**
\`\`\`
"I want a user authentication system that:
- Supports email/password login
- Has password reset functionality
- Integrates with our existing user database
- Follows our security best practices"
\`\`\`

**2. Break Down the Work:**
\`\`\`
"Let's build this in steps:
1. Create the database schema
2. Build the API endpoints
3. Create the UI components
4. Add error handling
5. Write tests"
\`\`\`

**3. Provide Patterns:**
\`\`\`
"Follow the same pattern as our existing API routes.
Use the same error handling as in utils/errors.ts.
Match the styling of our Button component."
\`\`\`

**4. Review and Guide:**
\`\`\`
"This looks good, but:
- Add input validation
- Use our custom error types
- Follow the naming convention"
\`\`\`

### AI's Role (Builder):

**1. Implements Your Design:**
- Writes the code you specified
- Follows the patterns you provided
- Uses the structure you defined

**2. Asks for Clarification:**
- When requirements are unclear
- When patterns conflict
- When decisions are needed

**3. Executes the Plan:**
- Step by step
- Following your guidance
- Implementing your vision

## Practical Examples

### Example 1: Building a Feature

**Architect (You):**
\`\`\`
"I need a notification system. Here's my design:

**Components:**
1. Notification service (backend)
2. Notification store (frontend state)
3. Notification UI component
4. API endpoints for marking as read

**Patterns to follow:**
- Use our existing API structure
- Follow our state management pattern
- Match our component styling

**Requirements:**
- Real-time updates
- Persist read status
- Support multiple notification types"
\`\`\`

**Builder (AI):**
- Creates the notification service
- Implements the store
- Builds the UI component
- Creates the API endpoints
- Follows your patterns

**Architect (You):**
- Reviews the code
- Suggests improvements
- Ensures it matches the design
- Tests the implementation

### Example 2: Refactoring

**Architect (You):**
\`\`\`
"This code is getting messy. Let's refactor:

**Goal:**
- Extract reusable logic
- Improve testability
- Follow our patterns

**Plan:**
1. Identify reusable functions
2. Extract to utility files
3. Update imports
4. Add tests"
\`\`\`

**Builder (AI):**
- Analyzes the code
- Extracts functions
- Updates imports
- Maintains functionality

**Architect (You):**
- Reviews the refactor
- Ensures nothing broke
- Verifies tests pass
- Checks code quality

## Developing the Architect Mindset

### 1. Think Before Coding

**Ask yourself:**
- What am I trying to achieve?
- How should this work?
- What are the components?
- How do they fit together?

**Then:**
- Design the solution
- Break it into steps
- Define the patterns
- Guide AI to implement

### 2. Focus on "What" and "Why"

**You define:**
- **What** needs to be built
- **Why** it's needed
- **How** it should work (high-level)

**AI handles:**
- **How** to implement (code-level)
- **Details** of syntax
- **Specific** implementation

### 3. Make Strategic Decisions

**You decide:**
- Architecture choices
- Technology selection
- Pattern adoption
- Quality standards

**AI implements:**
- Your decisions
- Your patterns
- Your standards

### 4. Maintain Quality

**You ensure:**
- Code follows standards
- Tests are adequate
- Documentation exists
- Performance is acceptable

**AI helps:**
- Write the code
- Generate tests
- Create documentation
- Optimize performance

## Common Mistakes

### Mistake 1: Letting AI Make Decisions

**Wrong:**
\`\`\`
You: "Build a user system"
AI: [Chooses architecture, patterns, everything]
\`\`\`

**Right:**
\`\`\`
You: "Build a user system using [specific architecture] following [specific patterns]"
AI: [Implements your design]
\`\`\`

### Mistake 2: Not Reviewing

**Wrong:**
\`\`\`
AI generates code → You use it immediately
\`\`\`

**Right:**
\`\`\`
AI generates code → You review → You verify → You test → You use
\`\`\`

### Mistake 3: No Clear Vision

**Wrong:**
\`\`\`
You: "Add some features"
AI: [Doesn't know what to do]
\`\`\`

**Right:**
\`\`\`
You: "Add these specific features: [list]"
AI: [Knows exactly what to build]
\`\`\`

## The Mindset Shift

### From:
- "I need to write this code"
- "How do I implement this?"
- "What's the syntax?"

### To:
- "How should this work?"
- "What's the best design?"
- "How do I guide AI to build this?"

## Exercise:

1. Pick a feature you want to build
2. **Don't** ask AI to build it yet
3. First, design it yourself:
   - What are the components?
   - How do they interact?
   - What patterns will you use?
   - What are the requirements?
4. Then guide AI to implement your design
5. Notice how this feels different

**Takeaway**: You're the architect. AI is the builder. Design first, then guide implementation.`,
            duration: 25,
          },
          {
            id: "lesson-3-2",
            title: "How to Break Tasks into Steps AI Can Follow",
            markdownContent: `# How to Break Tasks into Steps AI Can Follow

## Why Break Tasks Down?

AI works best with **clear, specific, sequential steps**. Large, vague tasks lead to poor results. Breaking tasks down makes AI more effective and you more in control.

### The Problem with Large Tasks:

**Bad:**
\`\`\`
"Build a complete e-commerce website"
\`\`\`

**Why it fails:**
- Too vague
- Too many decisions needed
- AI doesn't know where to start
- Hard to verify progress
- Easy to miss requirements

### The Solution: Break It Down

**Good:**
\`\`\`
Step 1: "Create the product database schema"
Step 2: "Build the product listing API"
Step 3: "Create the product list UI component"
Step 4: "Add product detail page"
... (continue step by step)
\`\`\`

**Why it works:**
- Clear and specific
- One decision at a time
- Easy to verify each step
- Can adjust as you go
- Better results

## Principles of Task Breakdown

### 1. One Clear Goal Per Step

**Bad:**
\`\`\`
"Create the database and API and UI"
\`\`\`

**Good:**
\`\`\`
Step 1: "Create the database schema"
Step 2: "Create the API endpoint"
Step 3: "Create the UI component"
\`\`\`

### 2. Sequential Dependencies

**Order matters:**
\`\`\`
Step 1: Database schema (foundation)
Step 2: API endpoints (uses schema)
Step 3: UI components (uses API)
\`\`\`

Each step builds on the previous.

### 3. Testable Increments

**Each step should be verifiable:**
\`\`\`
Step 1: "Create schema" → Can verify schema exists
Step 2: "Create API" → Can test API works
Step 3: "Create UI" → Can see UI renders
\`\`\`

### 4. Specific and Actionable

**Bad:**
\`\`\`
"Improve the user experience"
\`\`\`

**Good:**
\`\`\`
"Add loading states to the form submission button"
"Show error messages below each input field"
"Add success confirmation after form submission"
\`\`\`

## Breaking Down Common Tasks

### Example 1: Building a Feature

**Large Task:**
\`\`\`
"Add user authentication"
\`\`\`

**Broken Down:**
\`\`\`
Step 1: "Create the user database table with email, password_hash, and created_at fields"
Step 2: "Create API endpoint POST /api/auth/register that accepts email and password, hashes the password, and saves to database"
Step 3: "Create API endpoint POST /api/auth/login that validates credentials and returns a session token"
Step 4: "Create RegisterForm component with email and password fields, validation, and submit handler"
Step 5: "Create LoginForm component matching the RegisterForm pattern"
Step 6: "Add session management to store and validate the auth token"
Step 7: "Create protected route wrapper that redirects unauthenticated users"
\`\`\`

### Example 2: Refactoring

**Large Task:**
\`\`\`
"Refactor the codebase"
\`\`\`

**Broken Down:**
\`\`\`
Step 1: "Identify all API calls in the codebase and list them"
Step 2: "Create a new lib/api.ts file with a base API client function"
Step 3: "Extract the first API call to use the new base client"
Step 4: "Test that the refactored call still works"
Step 5: "Refactor the remaining API calls one by one"
Step 6: "Remove old API call code"
Step 7: "Update all imports to use the new API client"
\`\`\`

### Example 3: Adding a Feature

**Large Task:**
\`\`\`
"Add search functionality"
\`\`\`

**Broken Down:**
\`\`\`
Step 1: "Add a search input field to the header component"
Step 2: "Create a search API endpoint that accepts a query and returns matching results"
Step 3: "Add debouncing to the search input (wait 300ms after user stops typing)"
Step 4: "Create a SearchResults component to display results"
Step 5: "Add loading state while searching"
Step 6: "Add empty state when no results found"
Step 7: "Add error handling for failed searches"
\`\`\`

## Step Structure Template

### For Each Step, Include:

**1. What to do:**
\`\`\`
"Create a user registration form"
\`\`\`

**2. Where to do it:**
\`\`\`
"In components/RegisterForm.tsx"
\`\`\`

**3. What it should include:**
\`\`\`
"Email field, password field, confirm password field, submit button"
\`\`\`

**4. What patterns to follow:**
\`\`\`
"Use the same styling as LoginForm.tsx, follow our form validation pattern from utils/validation.ts"
\`\`\`

**5. How to verify:**
\`\`\`
"Form should render, show validation errors, and call the register API on submit"
\`\`\`

## Advanced Breakdown Techniques

### Technique 1: Dependency Mapping

**Map what depends on what:**
\`\`\`
Database Schema
  ↓
API Endpoints (depend on schema)
  ↓
Type Definitions (depend on schema)
  ↓
UI Components (depend on API and types)
\`\`\`

Build in dependency order.

### Technique 2: Horizontal vs Vertical

**Horizontal (by layer):**
\`\`\`
All database work → All API work → All UI work
\`\`\`

**Vertical (by feature):**
\`\`\`
Feature 1 (DB + API + UI) → Feature 2 (DB + API + UI)
\`\`\`

Choose based on your needs.

### Technique 3: MVP First

**Start minimal:**
\`\`\`
Step 1: Basic version (works, but simple)
Step 2: Add validation
Step 3: Add error handling
Step 4: Add polish
\`\`\`

Get it working, then improve.

## Communicating Steps to AI

### Format 1: Sequential List

\`\`\`
"Let's build this in steps:

Step 1: [specific task]
Step 2: [specific task]
Step 3: [specific task]

Let's start with Step 1."
\`\`\`

### Format 2: One at a Time

\`\`\`
"First, let's create the database schema for users."
[Wait for completion]
"Now, let's create the registration API endpoint."
[Wait for completion]
"Next, let's build the registration form."
\`\`\`

### Format 3: With Context

\`\`\`
"Step 1: Create the user table in the database.
- Fields: id (UUID), email (string, unique), password_hash (string), created_at (timestamp)
- Use our existing database migration pattern
- See migrations/001_create_posts.sql for reference"
\`\`\`

## Common Mistakes

### Mistake 1: Steps Too Large

**Bad:**
\`\`\`
Step 1: "Build the entire authentication system"
\`\`\`

**Good:**
\`\`\`
Step 1: "Create the user table"
Step 2: "Create the register endpoint"
... (many small steps)
\`\`\`

### Mistake 2: Unclear Steps

**Bad:**
\`\`\`
Step 1: "Fix the thing"
\`\`\`

**Good:**
\`\`\`
Step 1: "Add null check before accessing user.name in the Profile component"
\`\`\`

### Mistake 3: Skipping Dependencies

**Bad:**
\`\`\`
Step 1: "Create the UI" (but API doesn't exist yet)
\`\`\`

**Good:**
\`\`\`
Step 1: "Create the API"
Step 2: "Create the UI that uses the API"
\`\`\`

## Exercise:

1. Pick a feature you want to build
2. Write it as one large task
3. Now break it down into 5-10 specific steps
4. For each step, make sure it's:
   - Clear and specific
   - Actionable
   - Testable
   - In the right order
5. Try implementing the first step with AI

**Takeaway**: Breaking tasks into small, clear steps makes AI more effective and you more in control. It's the difference between giving directions and hoping for the best.`,
            duration: 30,
          },
          {
            id: "lesson-3-3",
            title: "How to Review AI PRs",
            markdownContent: `# How to Review AI PRs

## What is an AI PR?

An **AI PR** (Pull Request) is code generated by AI that you need to review before accepting. Even though AI wrote it, **you're responsible** for its quality.

## Why Review AI Code?

### AI Can Make Mistakes:
- ❌ Security vulnerabilities
- ❌ Performance issues
- ❌ Logic errors
- ❌ Style inconsistencies
- ❌ Missing edge cases

### You're Responsible:
- ✅ Code quality
- ✅ Security
- ✅ Maintainability
- ✅ Team standards
- ✅ Production readiness

## The Review Process

### Step 1: Understand What Changed

**Before reviewing, understand:**
- What was the goal?
- What files were changed?
- What functionality was added/modified?

**Ask AI:**
\`\`\`
"What changes did you make? Summarize the modifications."
\`\`\`

### Step 2: Review the Code

**Systematic review:**
1. Read through all changes
2. Check for obvious errors
3. Verify it matches requirements
4. Check code style
5. Look for security issues

### Step 3: Test the Changes

**Always test:**
- Does it compile?
- Does it run?
- Does it work as expected?
- Are there errors?
- Do edge cases work?

### Step 4: Request Changes if Needed

**If issues found:**
- Point out specific problems
- Request fixes
- Verify fixes before accepting

## What to Look For

### 1. Security Issues

**Check for:**
- ❌ Hardcoded secrets or API keys
- ❌ SQL injection vulnerabilities
- ❌ XSS vulnerabilities
- ❌ Missing input validation
- ❌ Insecure authentication
- ❌ Exposed sensitive data

**Example:**
\`\`\`
// BAD: Hardcoded API key
const apiKey = "sk_live_1234567890";

// GOOD: From environment variable
const apiKey = process.env.API_KEY;
\`\`\`

### 2. Logic Errors

**Check for:**
- ❌ Incorrect calculations
- ❌ Wrong conditions
- ❌ Missing null checks
- ❌ Off-by-one errors
- ❌ Incorrect data transformations

**Example:**
\`\`\`
// BAD: Missing null check
const userName = user.name.toUpperCase();

// GOOD: Handles null
const userName = user?.name?.toUpperCase() ?? 'Unknown';
\`\`\`

### 3. Performance Issues

**Check for:**
- ❌ Unnecessary loops
- ❌ Missing database indexes
- ❌ Inefficient queries
- ❌ Memory leaks
- ❌ Unoptimized renders

**Example:**
\`\`\`
// BAD: N+1 query problem
users.forEach(user => {
  const posts = db.query('SELECT * FROM posts WHERE user_id = ?', user.id);
});

// GOOD: Single query with JOIN
const usersWithPosts = db.query(\`
  SELECT u.*, p.* 
  FROM users u 
  LEFT JOIN posts p ON u.id = p.user_id
\`);
\`\`\`

### 4. Code Style

**Check for:**
- ❌ Inconsistent formatting
- ❌ Wrong naming conventions
- ❌ Missing comments
- ❌ Unused code
- ❌ Doesn't follow project patterns

**Example:**
\`\`\`
// BAD: Inconsistent naming
function getUserData() { }
function fetch_user_info() { }

// GOOD: Consistent naming
function getUserData() { }
function getUserInfo() { }
\`\`\`

### 5. Missing Edge Cases

**Check for:**
- ❌ Empty arrays/lists
- ❌ Null/undefined values
- ❌ Empty strings
- ❌ Zero values
- ❌ Very large numbers
- ❌ Network failures

**Example:**
\`\`\`
// BAD: Doesn't handle empty array
const average = numbers.reduce((a, b) => a + b) / numbers.length;

// GOOD: Handles edge cases
const average = numbers.length > 0 
  ? numbers.reduce((a, b) => a + b) / numbers.length 
  : 0;
\`\`\`

### 6. Type Safety

**Check for:**
- ❌ Missing TypeScript types
- ❌ Using 'any' type
- ❌ Incorrect type definitions
- ❌ Missing type guards

**Example:**
\`\`\`
// BAD: No types
function processData(data) {
  return data.value * 2;
}

// GOOD: Proper types
function processData(data: { value: number }): number {
  return data.value * 2;
}
\`\`\`

## Review Checklist

### Functionality
- [ ] Does it work as expected?
- [ ] Are all requirements met?
- [ ] Are edge cases handled?
- [ ] Are error cases handled?

### Code Quality
- [ ] Is the code readable?
- [ ] Does it follow project patterns?
- [ ] Is it well-structured?
- [ ] Are there code smells?

### Security
- [ ] Are inputs validated?
- [ ] Are secrets protected?
- [ ] Are there injection risks?
- [ ] Is authentication proper?

### Performance
- [ ] Is it efficient?
- [ ] Are there bottlenecks?
- [ ] Is memory managed well?
- [ ] Are queries optimized?

### Testing
- [ ] Are there tests?
- [ ] Do tests cover edge cases?
- [ ] Do tests actually test the right thing?

### Documentation
- [ ] Is code self-documenting?
- [ ] Are complex parts explained?
- [ ] Is the API documented?

## Review Workflow

### 1. Initial Review

**Quick scan:**
- Look at file changes
- Check for obvious issues
- Verify structure

### 2. Detailed Review

**Line by line:**
- Read the code
- Understand the logic
- Check for issues
- Verify patterns

### 3. Testing

**Run the code:**
- Test happy path
- Test error cases
- Test edge cases
- Check for regressions

### 4. Feedback

**Provide feedback:**
- Point out issues
- Request changes
- Approve if good

## Communicating Feedback

### Be Specific

**Bad:**
\`\`\`
"This is wrong"
\`\`\`

**Good:**
\`\`\`
"Line 23: Missing null check. user might be null when accessing user.name. Add: if (!user) return null;"
\`\`\`

### Be Constructive

**Bad:**
\`\`\`
"This code is terrible"
\`\`\`

**Good:**
\`\`\`
"This function could be improved by extracting the validation logic into a separate function for reusability."
\`\`\`

### Provide Examples

**Show what you want:**
\`\`\`
"Instead of this approach, use the pattern from utils/validation.ts. Here's an example: [show example]"
\`\`\`

## Common Issues and Fixes

### Issue 1: Security Vulnerability

**Problem:**
\`\`\`
const query = \`SELECT * FROM users WHERE id = \${userId}\`;
\`\`\`

**Feedback:**
\`\`\`
"This is vulnerable to SQL injection. Use parameterized queries instead: db.query('SELECT * FROM users WHERE id = ?', [userId])"
\`\`\`

### Issue 2: Missing Error Handling

**Problem:**
\`\`\`
const data = await fetch(url);
const json = await data.json();
\`\`\`

**Feedback:**
\`\`\`
"Add error handling for network failures and invalid JSON. Wrap in try/catch and handle both fetch and json() errors."
\`\`\`

### Issue 3: Performance Issue

**Problem:**
\`\`\`
items.forEach(item => {
  const result = expensiveOperation(item);
});
\`\`\`

**Feedback:**
\`\`\`
"This could be optimized. Consider batching operations or using Promise.all if operations are independent."
\`\`\`

## Approving AI Code

### When to Approve:

✅ Code works correctly
✅ Follows project patterns
✅ Handles edge cases
✅ Has proper error handling
✅ Is secure
✅ Is performant
✅ Is maintainable

### When to Request Changes:

❌ Security issues
❌ Logic errors
❌ Performance problems
❌ Style inconsistencies
❌ Missing requirements
❌ Poor code quality

## Exercise:

1. Ask AI to generate some code
2. Review it using the checklist
3. Identify any issues
4. Request fixes
5. Review the fixes
6. Notice what you learned

**Takeaway**: Reviewing AI code is your responsibility. Be thorough, be specific, and don't accept code you don't understand or trust.`,
            duration: 30,
          },
          {
            id: "lesson-3-4",
            title: "How to Enforce Project Conventions",
            markdownContent: `# How to Enforce Project Conventions

## What are Project Conventions?

**Project conventions** are the rules, patterns, and standards your project follows. They ensure consistency, maintainability, and quality.

### Types of Conventions:

**1. Code Style:**
- Indentation (spaces vs tabs)
- Naming (camelCase vs snake_case)
- Line length
- Semicolons

**2. Architecture:**
- File organization
- Component structure
- API design
- Data flow

**3. Patterns:**
- How to handle errors
- How to manage state
- How to structure components
- How to write tests

**4. Tools:**
- Which libraries to use
- Which frameworks
- Build tools
- Testing frameworks

## Why Enforce Conventions?

### Benefits:

1. **Consistency**: Code looks and works the same way
2. **Maintainability**: Easier to understand and modify
3. **Quality**: Enforces best practices
4. **Team Alignment**: Everyone follows the same rules
5. **AI Alignment**: AI generates code that matches your style

## Methods of Enforcement

### 1. Cursor Rules (.cursorrules)

**Create a .cursorrules file:**
\`\`\`
# Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use single quotes
- Max line length: 100

# Naming
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

# Patterns
- Use functional components
- Extract reusable logic to hooks
- Follow error handling pattern in utils/errors.ts
\`\`\`

**AI will follow these rules automatically.**

### 2. Example Files

**Create reference implementations:**
\`\`\`
components/
  Button.tsx  ← Reference component
  Input.tsx   ← Follow Button.tsx pattern
  Form.tsx   ← Follow Button.tsx pattern
\`\`\`

**Point AI to examples:**
\`\`\`
"Create a new component following the same pattern as Button.tsx"
\`\`\`

### 3. Explicit Instructions

**In your prompts:**
\`\`\`
"Create a new API route following our existing pattern:
- Use the same error handling as app/api/users/route.ts
- Follow the same response format
- Use the same authentication middleware"
\`\`\`

### 4. Code Review

**Review AI-generated code:**
- Check if it follows conventions
- Request changes if not
- Provide specific feedback

### 5. Linters and Formatters

**Automated tools:**
- ESLint for JavaScript/TypeScript
- Prettier for formatting
- Stylelint for CSS

**Configure them:**
\`\`\`
// .eslintrc
{
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"]
  }
}
\`\`\`

## Common Conventions to Enforce

### 1. File Naming

**Convention:**
\`\`\`
Components: PascalCase (UserProfile.tsx)
Utilities: camelCase (formatDate.ts)
Constants: UPPER_SNAKE_CASE (API_BASE_URL.ts)
\`\`\`

**Enforce:**
\`\`\`
In .cursorrules:
"File names must match their export:
- Components: PascalCase
- Utilities: camelCase
- Constants: UPPER_SNAKE_CASE"
\`\`\`

### 2. Component Structure

**Convention:**
\`\`\`
1. Imports (external, internal, relative)
2. Types/Interfaces
3. Component definition
4. Export
\`\`\`

**Enforce:**
\`\`\`
"Components must follow this structure:
1. External imports
2. Internal imports  
3. Type definitions
4. Component
5. Export

See components/Button.tsx for reference"
\`\`\`

### 3. Error Handling

**Convention:**
\`\`\`
Always use try/catch
Return error objects, not throw
Log errors appropriately
\`\`\`

**Enforce:**
\`\`\`
"All API routes must use try/catch blocks.
Return { success: false, error: message } on errors.
Follow the pattern in app/api/users/route.ts"
\`\`\`

### 4. TypeScript Usage

**Convention:**
\`\`\`
Explicit types for function parameters
Interfaces for object shapes
No 'any' type
\`\`\`

**Enforce:**
\`\`\`
"All functions must have explicit parameter types.
Use interfaces for complex objects.
Never use 'any' - use 'unknown' if type is truly unknown.
See types/user.ts for examples"
\`\`\`

### 5. API Design

**Convention:**
\`\`\`
RESTful endpoints
Consistent response format
Proper status codes
\`\`\`

**Enforce:**
\`\`\`
"API endpoints must:
- Use RESTful naming (GET /api/users, POST /api/users)
- Return { data, error } format
- Use proper HTTP status codes
- Follow pattern in app/api/users/route.ts"
\`\`\`

## Creating Convention Documentation

### Document Your Conventions:

**Create CONVENTIONS.md:**
\`\`\`
# Project Conventions

## Code Style
- 2 spaces indentation
- Single quotes
- Semicolons required

## File Structure
- Components in components/
- Utilities in lib/
- Types in types/

## Naming
- Components: PascalCase
- Functions: camelCase
- Files match exports

## Patterns
- See components/Button.tsx for component pattern
- See app/api/users/route.ts for API pattern
- See lib/utils.ts for utility pattern
\`\`\`

### Reference in .cursorrules:

\`\`\`
# See CONVENTIONS.md for full details
# Key rules:
- Follow all patterns in CONVENTIONS.md
- Reference example files when creating new code
\`\`\`

## Enforcing in Practice

### Example 1: New Component

**Without enforcement:**
\`\`\`
"Create a Card component"
AI: [Creates component with random style]
\`\`\`

**With enforcement:**
\`\`\`
"Create a Card component following the same pattern as Button.tsx:
- Same file structure
- Same TypeScript style
- Same prop pattern
- Same export style"
AI: [Creates component matching your style]
\`\`\`

### Example 2: API Route

**Without enforcement:**
\`\`\`
"Create an API route for products"
AI: [Creates route with different pattern]
\`\`\`

**With enforcement:**
\`\`\`
"Create an API route for products following the pattern in app/api/users/route.ts:
- Same error handling
- Same response format
- Same authentication
- Same structure"
AI: [Creates route matching your pattern]
\`\`\`

### Example 3: Utility Function

**Without enforcement:**
\`\`\`
"Create a date formatting function"
AI: [Creates function with different style]
\`\`\`

**With enforcement:**
\`\`\`
"Create a date formatting function in lib/utils.ts following the same pattern as existing utility functions:
- Same TypeScript style
- Same error handling
- Same documentation
- Same export style"
AI: [Creates function matching your style]
\`\`\`

## Updating Conventions

### When Conventions Change:

**1. Update documentation:**
- Update CONVENTIONS.md
- Update .cursorrules
- Update example files if needed

**2. Communicate:**
- Tell your team
- Update AI instructions
- Review existing code

**3. Migrate gradually:**
- Don't break everything at once
- Update as you work on files
- Use AI to help migrate

## Common Enforcement Issues

### Issue 1: AI Ignores Rules

**Solution:**
- Make rules more specific
- Reference example files explicitly
- Use stronger language ("Must", "Always", "Never")

### Issue 2: Conflicting Rules

**Solution:**
- Prioritize rules
- Remove conflicts
- Be more specific

### Issue 3: Rules Too Vague

**Solution:**
- Be specific
- Show examples
- Reference existing code

## Best Practices

### ✅ Do:
- Document conventions clearly
- Provide example files
- Reference examples in prompts
- Review AI code for compliance
- Update conventions as needed

### ❌ Don't:
- Assume AI knows your conventions
- Use vague rules
- Skip code review
- Ignore convention violations

## Exercise:

1. List your project's conventions
2. Create or update .cursorrules
3. Create example reference files
4. Ask AI to generate code
5. Check if it follows conventions
6. Adjust rules if needed

**Takeaway**: Enforcing conventions ensures AI generates code that fits your project. Use .cursorrules, examples, and explicit instructions to guide AI.`,
            duration: 25,
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

