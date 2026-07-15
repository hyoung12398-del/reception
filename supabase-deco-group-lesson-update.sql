update public.devices
set
  staff_button_label = 'マンツーマンレッスンはこちら',
  show_room_rental = false,
  show_group_lesson = true,
  group_lesson_button_label = 'グループレッスン受付はこちら'
where device_key in ('deco-1st', 'deco-2nd');
