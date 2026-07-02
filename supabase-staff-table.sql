create table if not exists public.staff (
  id text primary key,
  name text not null,
  search_kana text,
  slack_user_id text not null,
  image_url text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff add column if not exists search_kana text;
alter table public.staff add column if not exists slack_user_id text;
alter table public.staff add column if not exists image_url text;
alter table public.staff add column if not exists enabled boolean not null default true;
alter table public.staff add column if not exists created_at timestamptz not null default now();
alter table public.staff add column if not exists updated_at timestamptz not null default now();

alter table public.staff enable row level security;
