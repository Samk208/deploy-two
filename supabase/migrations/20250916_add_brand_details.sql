-- Migration: add brand_details table to store onboarding brand info
create extension if not exists pgcrypto;

create table if not exists public.brand_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  company_website text,
  industry text not null,
  company_size text not null check (company_size in ('1-10','11-50','51-200','201-1000','1000+')),
  description text not null,
  business_registration_number text,
  tax_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table public.brand_details enable row level security;

-- Policies: owners can insert/select/update their own brand details
create policy if not exists "insert_own_brand_details"
  on public.brand_details
  for insert
  with check (user_id = auth.uid());

create policy if not exists "select_own_brand_details"
  on public.brand_details
  for select
  using (user_id = auth.uid());

create policy if not exists "update_own_brand_details"
  on public.brand_details
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger brand_details_set_updated_at
before update on public.brand_details
for each row
execute function public.set_updated_at();

-- Helpful index
create index if not exists brand_details_user_id_idx on public.brand_details(user_id);
