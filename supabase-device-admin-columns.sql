alter table public.devices
add column if not exists logo_url text;

alter table public.devices
add column if not exists support_phone_number text;

alter table public.devices
add column if not exists trial_lesson_staff_ids text[] not null default '{}';

alter table public.devices
add column if not exists show_room_rental boolean not null default true;
