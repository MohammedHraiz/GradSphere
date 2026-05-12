INSERT INTO users (id, university_id, name, email, password_hash, role, status, enabled, graduated, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'DEMO-STU-LEADER', 'Demo Student Leader', 'student.leader@demo.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHiPpnnUs4KxYW8lgx.43m53CzHrc6eK', 'ROLE_STUDENT', 'ACTIVE', TRUE, FALSE, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000102', 'DEMO-STU-MEMBER', 'Demo Student Member', 'student.member@demo.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHiPpnnUs4KxYW8lgx.43m53CzHrc6eK', 'ROLE_STUDENT', 'ACTIVE', TRUE, FALSE, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000201', 'DEMO-SUP-001', 'Demo Supervisor', 'supervisor@demo.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHiPpnnUs4KxYW8lgx.43m53CzHrc6eK', 'ROLE_SUPERVISOR', 'ACTIVE', TRUE, FALSE, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000301', 'DEMO-DEAN-001', 'Demo Dean Office', 'dean@demo.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHiPpnnUs4KxYW8lgx.43m53CzHrc6eK', 'ROLE_DEAN_OFFICE', 'ACTIVE', TRUE, FALSE, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000401', 'DEMO-ADMIN-001', 'Demo Admin', 'admin@demo.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOHiPpnnUs4KxYW8lgx.43m53CzHrc6eK', 'ROLE_ADMIN', 'ACTIVE', TRUE, FALSE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  university_id = EXCLUDED.university_id,
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = 'ACTIVE',
  enabled = TRUE,
  graduated = FALSE,
  updated_at = NOW();
