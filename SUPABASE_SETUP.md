# Supabase setup

This app uses Supabase Auth + cloud persistence (no localStorage data store).

## 1) Environment variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 2) Required tables (V2)

The app syncs **17** normalized `app_*` tables. Each row is `(user_id, id, data jsonb, updated_at)`.

| Table | Stores |
| --- | --- |
| `app_teachers` | Teachers |
| `app_students` | Students |
| `app_classes` | Classes |
| `app_subjects` | Subjects |
| `app_attendance` | Attendance |
| `app_behaviour_skills` | Point / behaviour skills |
| `app_point_events` | Point awards |
| `app_class_tasks` | Class tasks |
| `app_class_units` | Unit planner |
| `app_student_task_records` | Task scores / status |
| `app_class_session_notes` | Lesson notes |
| `app_class_schedule_events` | Class schedule rules |
| `app_class_session_exceptions` | Schedule exceptions |
| `app_academic_terms` | Academic terms |
| `app_task_assessment_categories` | Assessment categories |
| `app_term_grades` | Posted term grades |
| `app_school_grading_settings` | School grading settings |

### Paste-ready SQL (fresh install or upgrade)

Safe to re-run: creates missing tables, enables RLS, and recreates policies.

```sql
do $$
declare
  t text;
  tables text[] := array[
    'app_teachers',
    'app_students',
    'app_classes',
    'app_subjects',
    'app_attendance',
    'app_behaviour_skills',
    'app_point_events',
    'app_class_tasks',
    'app_class_units',
    'app_student_task_records',
    'app_class_session_notes',
    'app_class_schedule_events',
    'app_class_session_exceptions',
    'app_academic_terms',
    'app_task_assessment_categories',
    'app_term_grades',
    'app_school_grading_settings'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create table if not exists public.%I (user_id uuid not null references auth.users(id) on delete cascade, id text not null, data jsonb not null, updated_at timestamptz not null default now(), primary key (user_id, id))',
      t
    );
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', 'Users read own ' || t, t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)',
      'Users read own ' || t,
      t
    );
    execute format('drop policy if exists %I on public.%I', 'Users write own ' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      'Users write own ' || t,
      t
    );
  end loop;
end $$;
```

### Already set up from an older version?

You do **not** need to wipe data. Re-run the SQL above — existing tables stay; only missing V2 tables are created (units, schedule, terms, term grades, grading settings, etc.).

Optional cleanup if you still have a legacy `app_behaviour` table from before points skills:

```sql
-- Only after confirming the app no longer uses it:
-- drop table if exists public.app_behaviour;
```

## 3) Auth

Enable Email/Password provider in Supabase Auth settings.

The app includes:

- sign up
- sign in
- forgot password email flow
- sign out

All app data is stored per signed-in user across the `app_*` tables above.

## 4) Troubleshooting sync errors

If the header shows **Sync error (`app_...`)**, it is almost always a Supabase setup issue:

1. **Missing table** — Create **all 17** tables from section 2. Re-run the paste-ready SQL. The error name in the header is the missing table.
2. **Missing RLS policies** — Re-run the same SQL (it recreates policies).
3. **Not signed in** — Data only syncs for authenticated users.
4. **Wrong `.env`** — `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must match your project (Project Settings → API).
5. **Email not confirmed** — Confirm the user in Supabase Auth → Users if confirmation is required.

**Check in browser:** Open DevTools (F12) → Console. Look for `Cloud sync failed (app_...)` with the exact Postgres/Supabase message.

**Verify in Supabase:** Table Editor should list all 17 `app_*` tables. After saving a student in the app, refresh `app_students` — you should see rows with your `user_id`.
