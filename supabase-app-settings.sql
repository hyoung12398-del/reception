create table if not exists public.app_settings (
  id text primary key,
  brand_name text not null default '受付',
  logo_url text,
  background_color text not null default '#f6f4ef',
  surface_color text not null default '#ffffff',
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

alter table public.app_settings enable row level security;
