alter table public.devices
add column if not exists logo_url text;

alter table public.devices
add column if not exists support_phone_number text;

alter table public.devices
add column if not exists trial_lesson_staff_ids text[] not null default '{}';

alter table public.devices
add column if not exists staff_button_label text;

alter table public.devices
add column if not exists show_room_rental boolean not null default true;

alter table public.devices
add column if not exists show_group_lesson boolean not null default false;

alter table public.devices
add column if not exists group_lesson_button_label text;

alter table public.devices
add column if not exists device_theme_enabled boolean not null default false;

alter table public.devices
add column if not exists theme_overrides jsonb not null default '{}'::jsonb;
