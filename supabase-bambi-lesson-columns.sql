alter table public.devices
add column if not exists show_bambi_lesson boolean not null default false;

alter table public.devices
add column if not exists bambi_lesson_button_label text;
