-- Translation cache table (additive, safe)
-- Purpose: persistent cache to minimize Google Translation API calls

create table if not exists public.translations (
    key_hash text primary key,
    source_lang text not null,
    target_lang text not null,
    namespace text,
    source_text text not null,
    translated_text text not null,
    hits bigint not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists translations_target_lang_idx on public.translations (target_lang);

create index if not exists translations_namespace_idx on public.translations (namespace);

-- Optional RLS (keep disabled unless you enable globally for public schema)
-- alter table public.translations enable row level security;
-- create policy "translations_read_all" on public.translations for select using (true);
-- create policy "translations_write_all" on public.translations for insert with check (true);

comment on
table public.translations is 'Cache of translated strings to reduce API costs';

comment on column public.translations.key_hash is 'sha256(version|source|target|namespace|normalizedText)';