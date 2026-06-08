create table if not exists public.app_settings (
  id text primary key,
  brand_name text not null default '受付',
  logo_url text,
  background_color text not null default '#f6f4ef',
  surface_color text not null default '#ffffff',
  text_color text not null default '#1f2428',
  label_color text not null default '#667074',
  accent_color text not null default '#16635b',
  updated_at timestamptz not null default now()
);

alter table public.app_settings add column if not exists label_color text not null default '#667074';

insert into public.app_settings (
  id,
  brand_name,
  logo_url,
  background_color,
  surface_color,
  text_color,
  label_color,
  accent_color
) values (
  'default',
  '受付',
  null,
  '#f6f4ef',
  '#ffffff',
  '#1f2428',
  '#667074',
  '#16635b'
) on conflict (id) do nothing;

alter table public.app_settings enable row level security;
