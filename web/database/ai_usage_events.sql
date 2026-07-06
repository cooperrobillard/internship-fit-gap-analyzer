-- =============================================================================
-- Dev 27 Step 1: ai_usage_events — persistent Smart AI quota tracking
-- =============================================================================
--
-- Apply manually in Supabase SQL editor (staging first, then production).
-- Counts reserved, success, and error rows toward per-user quotas.
--
-- Related: web/src/lib/supabase/ai-usage.ts
-- =============================================================================

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  feature text not null check (feature in ('smart_analysis', 'profile_extraction')),
  status text not null check (status in ('reserved', 'success', 'error')),
  provider text not null default 'openai',
  model text,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  error_class text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_usage_events_user_created_idx
  on public.ai_usage_events (clerk_user_id, created_at desc);

create index if not exists ai_usage_events_user_feature_created_idx
  on public.ai_usage_events (clerk_user_id, feature, created_at desc);

alter table public.ai_usage_events enable row level security;

drop policy if exists ai_usage_events_select_own on public.ai_usage_events;
create policy ai_usage_events_select_own
on public.ai_usage_events
for select
to authenticated
using (clerk_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists ai_usage_events_insert_own on public.ai_usage_events;
create policy ai_usage_events_insert_own
on public.ai_usage_events
for insert
to authenticated
with check (clerk_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists ai_usage_events_update_own on public.ai_usage_events;
create policy ai_usage_events_update_own
on public.ai_usage_events
for update
to authenticated
using (clerk_user_id = (select auth.jwt() ->> 'sub'))
with check (clerk_user_id = (select auth.jwt() ->> 'sub'));

-- updated_at trigger (matches schema.sql pattern)
create or replace function public.set_ai_usage_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ai_usage_events_set_updated_at on public.ai_usage_events;
create trigger ai_usage_events_set_updated_at
  before update on public.ai_usage_events
  for each row
  execute function public.set_ai_usage_events_updated_at();
