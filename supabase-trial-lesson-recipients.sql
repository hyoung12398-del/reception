alter table public.app_settings
add column if not exists trial_lesson_staff_ids text[] not null default '{}';
