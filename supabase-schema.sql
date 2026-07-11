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
  support_phone_number text,
  trial_lesson_staff_ids text[] not null default '{}',
  show_room_rental boolean not null default true,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.devices add column if not exists trial_lesson_staff_ids text[] not null default '{}';
alter table public.devices add column if not exists logo_url text;
alter table public.devices add column if not exists support_phone_number text;
alter table public.devices add column if not exists show_room_rental boolean not null default true;

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
  surface_border_color text not null default '#d9ded9',
  text_color text not null default '#1f2428',
  label_color text not null default '#667074',
  title_color text not null default '#1f2428',
  device_label_color text not null default '#667074',
  input_label_color text not null default '#667074',
  accent_color text not null default '#16635b',
  primary_button_text_color text not null default '#ffffff',
  outline_button_text_color text not null default '#0f4842',
  quiet_button_text_color text not null default '#1f2428',
  staff_button_background_color text not null default '#16635b',
  staff_button_text_color text not null default '#ffffff',
  staff_button_border_color text not null default '#16635b',
  trial_button_background_color text not null default '#ffffff',
  trial_button_text_color text not null default '#0f4842',
  trial_button_border_color text not null default '#16635b',
  rental_button_background_color text not null default '#eef0ee',
  rental_button_text_color text not null default '#1f2428',
  rental_button_border_color text not null default '#d9ded9',
  staff_card_text_color text not null default '#1f2428',
  message_color text not null default '#0f4842',
  updated_at timestamptz not null default now()
);

alter table public.app_settings add column if not exists label_color text not null default '#667074';
alter table public.app_settings add column if not exists surface_border_color text not null default '#d9ded9';
alter table public.app_settings add column if not exists title_color text not null default '#1f2428';
alter table public.app_settings add column if not exists device_label_color text not null default '#667074';
alter table public.app_settings add column if not exists input_label_color text not null default '#667074';
alter table public.app_settings add column if not exists primary_button_text_color text not null default '#ffffff';
alter table public.app_settings add column if not exists outline_button_text_color text not null default '#0f4842';
alter table public.app_settings add column if not exists quiet_button_text_color text not null default '#1f2428';
alter table public.app_settings add column if not exists staff_button_background_color text not null default '#16635b';
alter table public.app_settings add column if not exists staff_button_text_color text not null default '#ffffff';
alter table public.app_settings add column if not exists staff_button_border_color text not null default '#16635b';
alter table public.app_settings add column if not exists trial_button_background_color text not null default '#ffffff';
alter table public.app_settings add column if not exists trial_button_text_color text not null default '#0f4842';
alter table public.app_settings add column if not exists trial_button_border_color text not null default '#16635b';
alter table public.app_settings add column if not exists rental_button_background_color text not null default '#eef0ee';
alter table public.app_settings add column if not exists rental_button_text_color text not null default '#1f2428';
alter table public.app_settings add column if not exists rental_button_border_color text not null default '#d9ded9';
alter table public.app_settings add column if not exists staff_card_text_color text not null default '#1f2428';
alter table public.app_settings add column if not exists message_color text not null default '#0f4842';

insert into public.app_settings (
  id,
  brand_name,
  logo_url,
  background_color,
  surface_color,
  surface_border_color,
  text_color,
  label_color,
  title_color,
  device_label_color,
  input_label_color,
  accent_color,
  primary_button_text_color,
  outline_button_text_color,
  quiet_button_text_color,
  staff_button_background_color,
  staff_button_text_color,
  staff_button_border_color,
  trial_button_background_color,
  trial_button_text_color,
  trial_button_border_color,
  rental_button_background_color,
  rental_button_text_color,
  rental_button_border_color,
  staff_card_text_color,
  message_color
) values (
  'default',
  '受付',
  null,
  '#f6f4ef',
  '#ffffff',
  '#d9ded9',
  '#1f2428',
  '#667074',
  '#1f2428',
  '#667074',
  '#667074',
  '#16635b',
  '#ffffff',
  '#0f4842',
  '#1f2428',
  '#16635b',
  '#ffffff',
  '#16635b',
  '#ffffff',
  '#0f4842',
  '#16635b',
  '#eef0ee',
  '#1f2428',
  '#d9ded9',
  '#1f2428',
  '#0f4842'
) on conflict (id) do nothing;

alter table public.staff enable row level security;
alter table public.devices enable row level security;
alter table public.visits enable row level security;
alter table public.app_settings enable row level security;
