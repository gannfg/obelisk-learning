# Environment Variables Setup Guide

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get your Supabase credentials:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project (or create a new one)
   - Go to **Settings** → **API**
   - Copy the **Project URL** and **anon/public key**

3. **Update `.env.local` with your values:**
   ```env
   NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Restart your development server:**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

## Required Variables

### `NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL`
- Your Supabase project URL
- Format: `https://xxxxxxxxxxxxx.supabase.co`
- Found in: Supabase Dashboard → Settings → API → Project URL

### `NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY`
- Your Supabase anonymous/public key
- Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Found in: Supabase Dashboard → Settings → API → Project API keys → anon public

## Optional Variables

### `NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL` & `NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY`
- If you want to use a separate Supabase project for learning platform data
- Currently not used (app uses Auth Supabase for everything)
- To use: Update `lib/supabase/client.ts` and `lib/supabase/server.ts`

### `OLLAMA_URL` (Optional)
- Ollama server URL (default: `http://localhost:11434`)
- Only needed if Ollama is running on a different host/port
- Example: `http://localhost:11434` or `http://192.168.1.100:11434`

### `OLLAMA_MODEL` (Optional)
- Ollama model to use (default: `llama3`)
- Make sure the model is installed: `ollama pull llama3`
- Other popular models: `llama3.2`, `mistral`, `codellama`, `phi3`

## Troubleshooting

### Error: "Your project's URL and Key are required"
- **Solution**: Make sure `.env.local` exists and has both variables set
- **Check**: Restart the dev server after adding variables
- **Verify**: Variables start with `NEXT_PUBLIC_` (required for client-side access)

### Error: "Invalid API key"
- **Solution**: Double-check you copied the **anon/public** key, not the service_role key
- **Note**: The anon key is safe to expose in client-side code

### Variables not loading
- **Solution**: 
  1. Make sure the file is named `.env.local` (not `.env`)
  2. Restart the Next.js dev server
  3. Check for typos in variable names

## Security Notes

- ✅ **Safe to commit**: `.env.example` (no real values)
- ❌ **Never commit**: `.env.local` (contains secrets)
- ✅ **Safe to expose**: `NEXT_PUBLIC_*` variables (they're public by design)
- ❌ **Never expose**: Service role keys or API keys without `NEXT_PUBLIC_` prefix

## Next Steps

After setting up environment variables:

1. **Set up Supabase Auth:**
   - Run `supabase/auth-schema.sql` in your Supabase SQL Editor
   - Enable Email/Password auth in Supabase Dashboard → Authentication → Providers

2. **Set up Learning Platform:**
   - Run `supabase/learning-platform-schema.sql` in your Supabase SQL Editor
   - See `LEARNING_PLATFORM_SETUP.md` for details

3. **Test the setup:**
   - Navigate to `/auth/sign-up` to create an account
   - Navigate to `/missions` to see the mission board

