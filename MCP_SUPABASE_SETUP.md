# MCP Supabase Setup Guide

This guide will help you connect the MCP (Model Context Protocol) server with your Supabase obelisk-learning project in Cursor.

## Prerequisites

1. Cursor IDE installed
2. Your Supabase obelisk-learning project URL and credentials
3. Access to your Supabase project's service role key

## Step 1: Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your **obelisk-learning** project
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **service_role key**: (under "Project API keys" → "service_role" - keep this secret!)

> **Important**: Use the **service_role** key for MCP, not the anon key. The service_role key has full database access and should be kept secure.

## Step 2: Configure MCP in Cursor

1. Open **Cursor Settings**:
   - Press `Cmd/Ctrl + ,` (or go to `File` → `Preferences` → `Settings`)
   - Or click the gear icon in the bottom left

2. Navigate to **Features** → **Model Context Protocol** (or search for "MCP" in settings)

3. Click **"Add MCP Server"** or **"New MCP Server"**

4. Configure the Supabase MCP server:

### Configuration Options:

**Option A: Using the Supabase MCP Server (Recommended)**

If you're using the official Supabase MCP server, configure it as follows:

```json
{
  "mcpServers": {
    "supabase-obelisk-learning": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "https://your-project-ref.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key-here"
      }
    }
  }
}
```

**Option B: Manual Configuration**

If you need to configure it manually:

1. **Server Name**: `supabase obelisk-learning` (or any name you prefer)
2. **Command**: `npx`
3. **Arguments**: 
   ```
   -y
   @supabase/mcp-server-supabase
   ```
4. **Environment Variables**:
   - `SUPABASE_URL`: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### Environment Variables Setup:

In Cursor's MCP settings, add these environment variables:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 3: Verify the Connection

1. After adding the MCP server, it should appear in your **"Installed MCP Servers"** list
2. Make sure the toggle switch is **enabled** (green)
3. You should see "20 tools enabled" or similar, indicating the MCP server is connected

## Step 4: Test the Connection

You can test the MCP connection by:

1. Opening a chat with Cursor AI
2. Asking it to list tables in your Supabase database
3. Or asking it to query data from your database

Example prompts:
- "List all tables in the obelisk-learning Supabase database"
- "Show me the schema of the courses table"
- "What columns are in the missions table?"

## Troubleshooting

### MCP Server Not Appearing

1. **Check Cursor Version**: Make sure you're using a recent version of Cursor that supports MCP
2. **Restart Cursor**: Close and reopen Cursor after adding the MCP server
3. **Check Logs**: Look for error messages in Cursor's developer console or logs

### "Connection Failed" Error

1. **Verify Credentials**: Double-check your Supabase URL and service role key
2. **Check Network**: Ensure you can access your Supabase project from your network
3. **Service Role Key**: Make sure you're using the service_role key, not the anon key
4. **Project Status**: Verify your Supabase project is active (not paused)

### "Invalid API Key" Error

1. **Regenerate Key**: If needed, regenerate your service role key in Supabase
2. **No Quotes**: Don't wrap the key in quotes in the environment variables
3. **No Spaces**: Ensure there are no leading/trailing spaces in the key

### MCP Server Shows "0 tools enabled"

1. **Reinstall**: Try removing and re-adding the MCP server
2. **Update Package**: The MCP server package might need updating
3. **Check Compatibility**: Ensure the MCP server version is compatible with your Cursor version

## Security Best Practices

1. **Never Share Service Role Key**: The service role key has full database access
2. **Use Environment Variables**: Store credentials in environment variables, not in code
3. **Rotate Keys Regularly**: Periodically regenerate your service role key
4. **Limit Access**: Only enable MCP when you need it, disable it when not in use
5. **Review Permissions**: Regularly review what the MCP server can access

## Available MCP Tools

Once connected, the Supabase MCP server provides access to:

- Database queries and migrations
- Table management
- Schema inspection
- Data operations
- And more (typically 20+ tools)

## Next Steps

After setting up MCP:

1. **Test Queries**: Try querying your database through Cursor AI
2. **Explore Schema**: Ask Cursor to explain your database structure
3. **Generate Migrations**: Use MCP to help create database migrations
4. **Data Analysis**: Query and analyze your data through natural language

## Additional Resources

- [Supabase MCP Server Documentation](https://github.com/supabase/mcp-server-supabase)
- [Cursor MCP Documentation](https://docs.cursor.com)
- [Supabase API Documentation](https://supabase.com/docs/reference)

## Environment Variables Reference

For reference, your `.env.local` file should have:

```env
# Learning Supabase (for MCP and application)
NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_OBELISK_LEARNING_SUPABASE_ANON_KEY=your-anon-key
OBELISK_LEARNING_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth Supabase (separate project)
NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL=https://yyyyy.supabase.co
NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY=your-auth-anon-key
```

> **Note**: The MCP server uses the **service_role** key, while your Next.js app uses the **anon** key for client-side operations.




