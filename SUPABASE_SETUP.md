# Supabase setup

This app now uses Supabase Auth + cloud persistence (no localStorage data store).

## 1) Environment variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 2) Required normalized tables

Run this SQL in Supabase SQL editor:

```sql
create table if not exists public.app_teachers (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.app_students (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.app_classes (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.app_subjects (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.app_attendance (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.app_behaviour_skills (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.app_point_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.app_class_tasks (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.app_student_task_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.app_teachers enable row level security;
alter table public.app_students enable row level security;
alter table public.app_classes enable row level security;
alter table public.app_subjects enable row level security;
alter table public.app_attendance enable row level security;
alter table public.app_behaviour_skills enable row level security;
alter table public.app_point_events enable row level security;
alter table public.app_class_tasks enable row level security;
alter table public.app_student_task_records enable row level security;

create policy "Users read own app_teachers" on public.app_teachers for select to authenticated using (auth.uid() = user_id);
create policy "Users write own app_teachers" on public.app_teachers for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own app_students" on public.app_students for select to authenticated using (auth.uid() = user_id);
create policy "Users write own app_students" on public.app_students for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own app_classes" on public.app_classes for select to authenticated using (auth.uid() = user_id);
create policy "Users write own app_classes" on public.app_classes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own app_subjects" on public.app_subjects for select to authenticated using (auth.uid() = user_id);
create policy "Users write own app_subjects" on public.app_subjects for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own app_attendance" on public.app_attendance for select to authenticated using (auth.uid() = user_id);
create policy "Users write own app_attendance" on public.app_attendance for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own app_behaviour_skills" on public.app_behaviour_skills for select to authenticated using (auth.uid() = user_id);
create policy "Users write own app_behaviour_skills" on public.app_behaviour_skills for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own app_point_events" on public.app_point_events for select to authenticated using (auth.uid() = user_id);
create policy "Users write own app_point_events" on public.app_point_events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own app_class_tasks" on public.app_class_tasks for select to authenticated using (auth.uid() = user_id);
create policy "Users write own app_class_tasks" on public.app_class_tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own app_student_task_records" on public.app_student_task_records for select to authenticated using (auth.uid() = user_id);
create policy "Users write own app_student_task_records" on public.app_student_task_records for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## 3) Auth

Enable Email/Password provider in Supabase Auth settings.

The app includes:

- sign up
- sign in
- forgot password email flow
- sign out

All app data is stored per signed-in user across normalized `app_*` tables.

## 4) Troubleshooting sync errors

If the header shows **Sync error (`app_...`)**, it is almost always a Supabase setup issue:

1. **Missing table** — You must create **all 9** tables from section 2 (`app_teachers` through `app_student_task_records`, including `app_behaviour_skills` and `app_point_events`). If you only created `app_data` or a subset, sync will fail on the missing table name shown in the header (hover for full message).
2. **Missing RLS policies** — Re-run the `enable row level security` and `create policy` statements for every table.
3. **Not signed in** — Data only syncs for authenticated users. Confirm you are logged in.
4. **Wrong `.env`** — `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must match your project (Project Settings → API).
5. **Email not confirmed** — Unconfirmed accounts cannot use the API reliably; confirm email in Supabase Auth → Users.

**Check in browser:** Open DevTools (F12) → Console. Look for `Cloud sync failed (app_...)` with the exact Postgres/Supabase message.

**Verify in Supabase:** Table Editor should list all `app_*` tables. After saving a student in the app, refresh `app_students` — you should see rows with your `user_id`.

