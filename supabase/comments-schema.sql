-- Comments schema for projects

-- Ensure updated_at helper exists
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Table
create table if not exists project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_project_comments_project_id on project_comments(project_id);
create index if not exists idx_project_comments_created_at on project_comments(created_at desc);

-- Trigger
drop trigger if exists update_project_comments_updated_at on project_comments;
create trigger update_project_comments_updated_at
  before update on project_comments
  for each row
  execute function update_updated_at_column();

-- RLS
alter table project_comments enable row level security;

-- Policies
drop policy if exists "Comments select" on project_comments;
create policy "Comments select"
  on project_comments
  for select
  using (auth.uid() is not null);

drop policy if exists "Comments insert own" on project_comments;
create policy "Comments insert own"
  on project_comments
  for insert
  with check (user_id = auth.uid());

drop policy if exists "Comments update own" on project_comments;
create policy "Comments update own"
  on project_comments
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Comments delete own" on project_comments;
create policy "Comments delete own"
  on project_comments
  for delete
  using (user_id = auth.uid());
