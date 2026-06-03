create table if not exists public.staff (
  id text primary key,
  name text not null,
  slack_user_id text not null,
  image_url text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.devices (
  id text primary key,
  device_key text not null unique,
  school_name text not null,
  device_name text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table public.staff enable row level security;
alter table public.devices enable row level security;
alter table public.visits enable row level security;
