alter table public.devices
add column if not exists device_theme_enabled boolean not null default false;

alter table public.devices
add column if not exists theme_overrides jsonb not null default '{}'::jsonb;
