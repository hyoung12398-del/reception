alter table public.app_settings
add column if not exists base_font_size integer not null default 18;

alter table public.app_settings
add column if not exists title_font_size integer not null default 34;

alter table public.app_settings
add column if not exists choice_button_font_size integer not null default 21;

alter table public.app_settings
add column if not exists input_font_size integer not null default 22;
