UPDATE users
SET password_hash = '$2a$10$ZuxyxWdd32SmSXLzS2HUgOWWwZQ9moQJBKZTJ7yfJmWQsazzRgzv6',
    updated_at = NOW()
WHERE email IN (
  'student.leader@demo.local',
  'student.member@demo.local',
  'supervisor@demo.local',
  'dean@demo.local',
  'admin@demo.local'
);
