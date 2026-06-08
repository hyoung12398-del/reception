alter table public.app_settings
add column if not exists label_color text not null default '#667074';
