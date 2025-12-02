# Teams and Projects Database Setup

This guide explains how to set up the database tables for teams and projects functionality.

## Prerequisites

- A Supabase project (using the same database as your auth setup)
- Access to the Supabase SQL editor

## Setup Steps

### 1. Run the Schema SQL

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/schema-teams-projects.sql`
4. Run the SQL script

This will create:
- `projects` table - Stores project information
- `project_members` table - Many-to-many relationship between projects and users
- `teams` table - Stores team information
- `team_members` table - Many-to-many relationship between teams and users
- Indexes for performance
- Row Level Security (RLS) policies

### 2. Verify Tables

After running the SQL, verify the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'project_members', 'teams', 'team_members');
```

### 3. Test RLS Policies

The RLS policies allow:
- **All users** can view projects and teams
- **Project/Team creators** can create, update, and delete their own items
- **Project/Team owners/admins** can add/remove members
- **Any user** can leave a project or team they're a member of

## Database Schema

### Projects Table

```sql
projects
├── id (UUID, Primary Key)
├── title (TEXT)
├── description (TEXT)
├── thumbnail (TEXT, Optional)
├── status (TEXT: 'planning', 'in-progress', 'completed', 'archived')
├── difficulty (TEXT: 'beginner', 'intermediate', 'advanced')
├── tags (TEXT[])
├── team_id (UUID, Foreign Key → teams.id)
├── created_by (UUID, Foreign Key → users.id)
├── repository_url (TEXT, Optional)
├── live_url (TEXT, Optional)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### Project Members Table

```sql
project_members
├── id (UUID, Primary Key)
├── project_id (UUID, Foreign Key → projects.id)
├── user_id (UUID, Foreign Key → users.id)
├── role (TEXT: 'owner', 'admin', 'member', 'viewer')
└── joined_at (TIMESTAMPTZ)
```

### Teams Table

```sql
teams
├── id (UUID, Primary Key)
├── name (TEXT)
├── description (TEXT, Optional)
├── avatar (TEXT, Optional)
├── created_by (UUID, Foreign Key → users.id)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### Team Members Table

```sql
team_members
├── id (UUID, Primary Key)
├── team_id (UUID, Foreign Key → teams.id)
├── user_id (UUID, Foreign Key → users.id)
├── role (TEXT: 'owner', 'admin', 'member')
└── joined_at (TIMESTAMPTZ)
```

## Usage

Once the database is set up, the application will automatically:

1. **Create projects** when users submit the project creation form
2. **Create teams** when users submit the team creation form
3. **Fetch and display** all projects and teams from the database
4. **Show member information** by fetching user profiles
5. **Link projects to teams** when a project is assigned to a team

## Troubleshooting

### "relation does not exist" error
- Make sure you've run the schema SQL script
- Verify you're using the correct Supabase project

### "permission denied" error
- Check that RLS policies are enabled
- Verify the authenticated user has the correct permissions
- Check that the `users` table exists and is accessible

### Projects/Teams not showing
- Check browser console for errors
- Verify Supabase environment variables are set correctly
- Ensure the authenticated user can access the data (RLS policies)

## Next Steps

After setting up the database:

1. Test creating a project
2. Test creating a team
3. Test adding members to projects/teams
4. Verify data persists after page refresh

