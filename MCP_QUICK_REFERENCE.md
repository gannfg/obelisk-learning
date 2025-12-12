# MCP Supabase Quick Reference

## Quick Setup Steps

1. **Get Credentials from Supabase Dashboard**:
   - Go to: Settings → API
   - Copy: Project URL and service_role key

2. **Add MCP Server in Cursor**:
   - Open: Cursor Settings → Features → Model Context Protocol
   - Click: "New MCP Server"
   - Configure:
     - **Name**: `supabase obelisk-learning`
     - **Command**: `npx`
     - **Args**: `-y`, `@supabase/mcp-server-supabase`
     - **Env Variables**:
       ```
       SUPABASE_URL=https://your-project-ref.supabase.co
       SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
       ```

3. **Enable the Server**:
   - Toggle the switch to ON (green)
   - Should show "20 tools enabled"

## Required Credentials

You need these from your Supabase obelisk-learning project:

- ✅ **Project URL**: `https://xxxxx.supabase.co`
- ✅ **Service Role Key**: (from Settings → API → service_role)

> ⚠️ **Important**: Use the **service_role** key, NOT the anon key!

## Verification

After setup, test with:
- "List tables in my Supabase database"
- "Show me the courses table schema"

## Troubleshooting

- **Not showing up?** → Restart Cursor
- **Connection failed?** → Check credentials, ensure project is active
- **0 tools?** → Remove and re-add the server

See `MCP_SUPABASE_SETUP.md` for detailed instructions.






