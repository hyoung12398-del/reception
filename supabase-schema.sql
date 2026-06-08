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

create table if not exists public.devices (
  id text primary key,
  device_key text not null unique,
  school_name text not null,
  device_name text not null,
  logo_url text,
  trial_lesson_staff_ids text[] not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.devices add column if not exists trial_lesson_staff_ids text[] not null default '{}';
alter table public.devices add column if not exists logo_url text;

create table if not exists public.visits (
  id text primary key,
  visitor_name text not null,
  staff_id text,
  staff_name text not null,
  school_name text not null,
  device_name text not null,
  status text not null default 'pending',
  type text not null default 'staff_call',
  slack_ok boolean not null default false,
  slack_error text,
  trial_recipient_count integer,
  created_at timestamptz not null default now()
);

create index if not exists visits_created_at_idx on public.visits (created_at desc);
create index if not exists visits_type_idx on public.visits (type);
create index if not exists devices_device_key_idx on public.devices (device_key);

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

alter table public.staff enable row level security;
alter table public.devices enable row level security;
alter table public.visits enable row level security;
alter table public.app_settings enable row level security;
