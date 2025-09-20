-- Migration: add audit_logs table
-- Ensures pgcrypto is available for gen_random_uuid()
create extension if not exists pgcrypto;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id uuid references auth.users(id) on delete set null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.audit_logs enable row level security;

-- Policies: users can insert their own audit logs; read their own audit logs
create policy if not exists "insert_own_audit_logs"
  on public.audit_logs
  for insert
  with check (actor_id = auth.uid());

create policy if not exists "read_own_audit_logs"
  on public.audit_logs
  for select
  using (actor_id = auth.uid());

-- Optional index to speed up queries by actor and resource
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index if not exists audit_logs_resource_idx on public.audit_logs(resource_type, resource_id);
