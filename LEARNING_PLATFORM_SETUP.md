# Interactive Learning Platform Setup Guide

This guide covers setting up the interactive learning platform with missions, sandboxes, AI assistance, and more.

## Overview

The platform provides:
- **Missions**: Atomic, goal-oriented lessons with hands-on coding
- **Live Playground**: Monaco editor with real-time code execution
- **AI Assistant**: Integrated help for explanations, refactoring, and debugging
- **Micro-checks**: Automated tests that validate mission completion
- **Snapshots**: Save/restore workspace states
- **Mission Board**: Non-linear navigation through missions

## Database Setup

### 1. Run the Learning Platform Schema

In your **Learning Supabase** project (not the Auth Supabase), run:

```sql
-- Run this in Supabase SQL Editor
\i supabase/learning-platform-schema.sql
```

Or copy and paste the contents of `supabase/learning-platform-schema.sql` into the Supabase SQL Editor.

This creates tables for:
- `missions` - Mission definitions
- `mission_content` - Markdown content and checklists
- `sandboxes` - User workspaces
- `snapshots` - Saved workspace states
- `micro_checks` - Automated tests
- `ai_prompt_templates` - Pre-defined AI prompts
- `mission_progress` - User progress tracking
- `badges` - Achievement system
- `user_quotas` - Resource usage limits

### 2. Environment Variables

Ensure your `.env.local` has:

```env
# Auth Supabase (for authentication)
NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL=your_auth_supabase_url
NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY=your_auth_anon_key

# Learning Supabase (for platform data)
NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL=your_learning_supabase_url
NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY=your_learning_anon_key
```

**Note**: Currently, the code uses the Auth Supabase for all operations. To use a separate Learning Supabase, update:
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`

## Features Implemented

### ✅ Core Components

1. **LiteIDE** (`components/lite-ide.tsx`)
   - Monaco editor with syntax highlighting
   - File tabs for multi-file projects
   - Console output panel
   - Test results panel
   - AI assistant panel
   - Save snapshot functionality

2. **Mission Board** (`app/missions/page.tsx`)
   - Grid view of all missions
   - Filter by difficulty and stack type
   - Progress indicators
   - Completion badges

3. **Mission Viewer** (`app/missions/[missionId]/page.tsx`)
   - Mission goal and description
   - Lesson content (markdown)
   - Interactive checklist
   - Advanced tips (progressive reveal)
   - Integrated LiteIDE playground

### ✅ API Routes

1. **`/api/sandbox/run`** - Execute code in sandbox
   - Currently returns mock output
   - Ready for Sandpack/WebContainers or Docker integration

2. **`/api/sandbox/test`** - Run micro-checks
   - Fetches tests for mission
   - Returns pass/fail results
   - Logs results to database

3. **`/api/sandbox/snapshot`** - Save/restore snapshots
   - Creates snapshots with shareable tokens
   - Retrieves snapshots by ID or token

4. **`/api/ai/ask`** - AI assistant endpoint
   - Currently returns mock responses
   - Ready for Claude/OpenAI integration
   - Logs interactions and token usage

## Next Steps: Implementation

### 1. Sandbox Execution

**Option A: Client-side (Recommended for MVP)**
- Use `@codesandbox/sandpack-client` or StackBlitz WebContainers
- Zero infrastructure cost
- Works for Next.js, React, Node.js previews

**Option B: Server-side**
- Docker containers with resource limits
- Kubernetes or serverless runners
- Required for Python, Solana, or full Node.js execution

**Implementation:**
1. Install sandbox library: `npm install @codesandbox/sandpack-client`
2. Update `app/api/sandbox/run/route.ts` to use Sandpack
3. Or implement Docker runner service

### 2. AI Integration (Ollama - ✅ Implemented)

Ollama is already integrated! Just set it up:

**Setup:**
1. Install Ollama: See `OLLAMA_SETUP.md` for detailed instructions
2. Pull a model: `ollama pull llama3.2` (or your preferred model)
3. Optional: Add to `.env.local`:
   ```env
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   ```

**The AI Assistant will:**
- Use your local Ollama model for responses
- Log interactions to the database
- Track token usage (estimated)
- Work offline and privately

**Alternative AI Providers:**
If you want to use cloud AI instead:
- Update `app/api/ai/ask/route.ts` to call Claude/OpenAI APIs
- Add API keys to `.env.local`
- See `OLLAMA_SETUP.md` for switching providers

**Prompt Templates:**
Create prompt templates in database:
```sql
INSERT INTO ai_prompt_templates (mission_id, name, prompt_text, category)
VALUES ('mission-id', 'Explain this code', 'Explain the following code line-by-line...', 'explain');
```

### 3. Create Sample Missions

```sql
-- Example mission
INSERT INTO missions (title, goal, description, initial_files, stack_type, difficulty, estimated_time)
VALUES (
  'Add Server-Side Validation',
  'Add server-side validation to the API route',
  'Learn how to validate user input on the server',
  '{"api/route.js": "export default function handler(req, res) {\n  // Add validation here\n  res.json({ success: true });\n}"}',
  'nextjs',
  'beginner',
  15
);

-- Add mission content
INSERT INTO mission_content (mission_id, markdown_content, checklist)
VALUES (
  (SELECT id FROM missions WHERE title = 'Add Server-Side Validation'),
  '# Server-Side Validation\n\nIn this mission, you will...',
  '[{"text": "Add validation for email field", "completed": false}, {"text": "Add validation for required fields", "completed": false}]'
);

-- Add micro-checks
INSERT INTO micro_checks (mission_id, name, test_code, expected_result)
VALUES (
  (SELECT id FROM missions WHERE title = 'Add Server-Side Validation'),
  'Email validation exists',
  'expect(validateEmail("test@example.com")).toBe(true)',
  '{"passed": true}'
);
```

### 4. Quota Management

The platform includes quota tracking. To initialize quotas for existing users:

```sql
-- Initialize quotas for all users
INSERT INTO user_quotas (user_id, quota_type, daily_limit, monthly_limit, reset_at)
SELECT 
  id,
  'sandbox_runs',
  100,
  2000,
  NOW() + INTERVAL '1 day'
FROM auth.users
ON CONFLICT (user_id, quota_type) DO NOTHING;

-- Repeat for 'ai_calls' and 'storage_mb'
```

### 5. Badge System

Create badges:

```sql
INSERT INTO badges (name, description, icon_url, color)
VALUES 
  ('First Mission', 'Complete your first mission', '/badges/first.svg', 'blue'),
  ('Code Master', 'Complete 10 missions', '/badges/master.svg', 'gold');
```

## Testing

1. **Create a test mission** using the SQL above
2. **Sign up/Login** at `/auth/sign-up`
3. **Navigate to Missions** at `/missions`
4. **Start a mission** and test:
   - Editing code in LiteIDE
   - Running code (currently mock)
   - Running micro-checks
   - Using AI assistant (currently mock)
   - Saving snapshots
   - Completing checklist items

## Architecture Notes

### Client-Side vs Server-Side Execution

- **Client-side (Sandpack/WebContainers)**: Best for Next.js, React, Node.js previews. Zero cost, instant feedback.
- **Server-side (Docker)**: Required for Python, Solana, or full-stack apps. Higher cost, more secure.

### Cost Control

- Quotas are enforced per user
- Sandbox runs are logged to `sandbox_runs` table
- AI calls are logged to `ai_interactions` table
- Monitor usage and adjust limits as needed

### Security

- RLS policies ensure users can only access their own data
- Sandbox execution should be isolated (Docker containers)
- Network egress should be restricted in production
- Input sanitization required for user code

## Troubleshooting

### "Mission not found"
- Ensure missions exist in database
- Check Supabase connection

### "Unauthorized" errors
- Verify user is logged in
- Check RLS policies are correct

### Sandbox not saving
- Check `sandboxes` table exists
- Verify RLS policies allow INSERT/UPDATE

### AI responses not working
- Currently returns mock responses
- Implement actual AI integration (see "AI Integration" above)

## Future Enhancements

- [ ] Real sandbox execution (Sandpack/Docker)
- [ ] Real AI integration (Claude/OpenAI)
- [ ] Mentor review system
- [ ] Live pair programming
- [ ] GitHub integration
- [ ] Journey map visualization
- [ ] Advanced gamification

