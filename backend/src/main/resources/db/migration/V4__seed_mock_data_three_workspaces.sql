-- V4__seed_mock_data_three_workspaces
-- Three isolated "full graph" datasets (Alpha / Beta / Gamma) for frontend API testing.
-- Role convention: id 1 ADMIN, 2 TEAM_LEAD, 3 DEVELOPER, 6 DELETED_USER (sparse id 6 is intentional).
-- Default login password for all mock accounts: Password123!

-- ---------------------------------------------------------------------------
-- 1) Roles (align with product IDs; V1 seeds 1–3 as ADMIN/MEMBER/VIEWER)
-- ---------------------------------------------------------------------------
UPDATE role
SET name = 'TEAM_LEAD',
    description = 'Team lead; plans work and coordinates contributors'
WHERE id = 2
  AND name IN ('MEMBER', 'TEAM_LEAD');

UPDATE role
SET name = 'DEVELOPER',
    description = 'Developer; creates and completes assigned work'
WHERE id = 3
  AND name IN ('VIEWER', 'DEVELOPER');

INSERT INTO role (id, name, description)
VALUES (6, 'DELETED_USER', 'Soft-deleted user marker; pair with inactive user status')
ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description;

SELECT setval(pg_get_serial_sequence('role', 'id'), (SELECT COALESCE(MAX(id), 1) FROM role));

-- BCrypt (strength 10) for literal password: Password123!

-- ---------------------------------------------------------------------------
-- 2) Users (15) — five per workspace set: admin, lead, two devs, one deleted
-- ---------------------------------------------------------------------------
INSERT INTO "user" (name, email, password_hash, status) VALUES
    ('Alpha Admin', 'mock.alpha.admin@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'active'),
    ('Alpha Team Lead', 'mock.alpha.lead@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'active'),
    ('Alpha Dev One', 'mock.alpha.dev1@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'active'),
    ('Alpha Dev Two', 'mock.alpha.dev2@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'active'),
    ('Alpha Former User', 'mock.alpha.deleted@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'inactive'),
    ('Beta Admin', 'mock.beta.admin@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'active'),
    ('Beta Team Lead', 'mock.beta.lead@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'active'),
    ('Beta Dev One', 'mock.beta.dev1@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'active'),
    ('Beta Dev Two', 'mock.beta.dev2@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'active'),
    ('Beta Former User', 'mock.beta.deleted@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'inactive'),
    ('Gamma Admin', 'mock.gamma.admin@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'active'),
    ('Gamma Team Lead', 'mock.gamma.lead@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'active'),
    ('Gamma Dev One', 'mock.gamma.dev1@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'active'),
    ('Gamma Dev Two', 'mock.gamma.dev2@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'active'),
    ('Gamma Former User', 'mock.gamma.deleted@local.test', '$2b$10$CR9FKSz8quxcDvjpxjUkCOD0cDS8vDMUyb9LJC3I3IHBwxYRiUHYK', 'inactive');

-- ---------------------------------------------------------------------------
-- 3) user_role — one global role per mock user (role_id 1 / 2 / 3 / 6)
-- ---------------------------------------------------------------------------
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 1 FROM "user" u WHERE u.email = 'mock.alpha.admin@local.test';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 2 FROM "user" u WHERE u.email = 'mock.alpha.lead@local.test';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 3 FROM "user" u WHERE u.email IN ('mock.alpha.dev1@local.test', 'mock.alpha.dev2@local.test');
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 6 FROM "user" u WHERE u.email = 'mock.alpha.deleted@local.test';

INSERT INTO user_role (user_id, role_id)
SELECT u.id, 1 FROM "user" u WHERE u.email = 'mock.beta.admin@local.test';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 2 FROM "user" u WHERE u.email = 'mock.beta.lead@local.test';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 3 FROM "user" u WHERE u.email IN ('mock.beta.dev1@local.test', 'mock.beta.dev2@local.test');
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 6 FROM "user" u WHERE u.email = 'mock.beta.deleted@local.test';

INSERT INTO user_role (user_id, role_id)
SELECT u.id, 1 FROM "user" u WHERE u.email = 'mock.gamma.admin@local.test';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 2 FROM "user" u WHERE u.email = 'mock.gamma.lead@local.test';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 3 FROM "user" u WHERE u.email IN ('mock.gamma.dev1@local.test', 'mock.gamma.dev2@local.test');
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 6 FROM "user" u WHERE u.email = 'mock.gamma.deleted@local.test';

-- ---------------------------------------------------------------------------
-- 4) Workspaces
-- ---------------------------------------------------------------------------
INSERT INTO workspace (name) VALUES
    ('Mock Workspace Alpha'),
    ('Mock Workspace Beta'),
    ('Mock Workspace Gamma');

-- ---------------------------------------------------------------------------
-- 5) Projects (one active project per workspace; created_by = that admin)
-- ---------------------------------------------------------------------------
INSERT INTO project (name, description, status, created_by, workspace_id)
SELECT 'Alpha Delivery', 'Seed project for UI testing (Alpha)', 'active', u.id, w.id
FROM workspace w
JOIN "user" u ON u.email = 'mock.alpha.admin@local.test'
WHERE w.name = 'Mock Workspace Alpha';

INSERT INTO project (name, description, status, created_by, workspace_id)
SELECT 'Beta Delivery', 'Seed project for UI testing (Beta)', 'active', u.id, w.id
FROM workspace w
JOIN "user" u ON u.email = 'mock.beta.admin@local.test'
WHERE w.name = 'Mock Workspace Beta';

INSERT INTO project (name, description, status, created_by, workspace_id)
SELECT 'Gamma Delivery', 'Seed project for UI testing (Gamma)', 'active', u.id, w.id
FROM workspace w
JOIN "user" u ON u.email = 'mock.gamma.admin@local.test'
WHERE w.name = 'Mock Workspace Gamma';

-- ---------------------------------------------------------------------------
-- 6) project_member
-- ---------------------------------------------------------------------------
INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'owner'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email = 'mock.alpha.admin@local.test'
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'collaborator'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email = 'mock.alpha.lead@local.test'
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'collaborator'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email IN ('mock.alpha.dev1@local.test', 'mock.alpha.dev2@local.test')
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'viewer'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email = 'mock.alpha.deleted@local.test'
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'owner'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email = 'mock.beta.admin@local.test'
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'collaborator'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email = 'mock.beta.lead@local.test'
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'collaborator'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email IN ('mock.beta.dev1@local.test', 'mock.beta.dev2@local.test')
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'viewer'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email = 'mock.beta.deleted@local.test'
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'owner'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email = 'mock.gamma.admin@local.test'
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'collaborator'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email = 'mock.gamma.lead@local.test'
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'collaborator'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email IN ('mock.gamma.dev1@local.test', 'mock.gamma.dev2@local.test')
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'viewer'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email = 'mock.gamma.deleted@local.test'
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery';

-- ---------------------------------------------------------------------------
-- 7) AI sessions (one completed project_generation per project)
-- ---------------------------------------------------------------------------
INSERT INTO ai_session (user_id, project_id, session_type, status, created_at, completed_at)
SELECT u.id, p.id, 'project_generation', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email = 'mock.alpha.admin@local.test'
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery';

INSERT INTO ai_session (user_id, project_id, session_type, status, created_at, completed_at)
SELECT u.id, p.id, 'project_generation', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email = 'mock.beta.admin@local.test'
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery';

INSERT INTO ai_session (user_id, project_id, session_type, status, created_at, completed_at)
SELECT u.id, p.id, 'project_generation', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" u ON u.email = 'mock.gamma.admin@local.test'
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery';

-- ---------------------------------------------------------------------------
-- 8) Milestones (two per project; first linked to AI session)
-- ---------------------------------------------------------------------------
INSERT INTO milestone (project_id, session_id, title, description, due_date, status)
SELECT p.id, s.id, 'M1 — Foundation', 'Environment and scaffolding', NOW() + INTERVAL '14 days', 'in_progress'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN ai_session s ON s.project_id = p.id AND s.session_type = 'project_generation'
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery';

INSERT INTO milestone (project_id, session_id, title, description, due_date, status)
SELECT p.id, NULL, 'M2 — Hardening', 'QA and release prep', NOW() + INTERVAL '30 days', 'pending'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery';

INSERT INTO milestone (project_id, session_id, title, description, due_date, status)
SELECT p.id, s.id, 'M1 — Foundation', 'Environment and scaffolding', NOW() + INTERVAL '14 days', 'in_progress'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN ai_session s ON s.project_id = p.id AND s.session_type = 'project_generation'
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery';

INSERT INTO milestone (project_id, session_id, title, description, due_date, status)
SELECT p.id, NULL, 'M2 — Hardening', 'QA and release prep', NOW() + INTERVAL '30 days', 'pending'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery';

INSERT INTO milestone (project_id, session_id, title, description, due_date, status)
SELECT p.id, s.id, 'M1 — Foundation', 'Environment and scaffolding', NOW() + INTERVAL '14 days', 'in_progress'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN ai_session s ON s.project_id = p.id AND s.session_type = 'project_generation'
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery';

INSERT INTO milestone (project_id, session_id, title, description, due_date, status)
SELECT p.id, NULL, 'M2 — Hardening', 'QA and release prep', NOW() + INTERVAL '30 days', 'pending'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery';

-- ---------------------------------------------------------------------------
-- 9) Tasks (four per project; mixed status / priority / points)
-- ---------------------------------------------------------------------------
INSERT INTO task (title, description, status, priority, points_value, due_date, completed_at, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Define API contracts', 'OpenAPI drafts for core resources', 'done', 'high', 25, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days',
       p.id, p.workspace_id, ua.id, d1.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ua ON ua.email = 'mock.alpha.admin@local.test'
JOIN "user" d1 ON d1.email = 'mock.alpha.dev1@local.test'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'M1%'
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Implement auth filter', 'JWT filter chain wiring', 'in_progress', 'critical', 50, NOW() + INTERVAL '3 days',
       p.id, p.workspace_id, ua.id, d2.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ua ON ua.email = 'mock.alpha.admin@local.test'
JOIN "user" d2 ON d2.email = 'mock.alpha.dev2@local.test'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'M1%'
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Write integration tests', 'Covers happy paths', 'review', 'medium', 25, NOW() + INTERVAL '7 days',
       p.id, p.workspace_id, ul.id, d1.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ul ON ul.email = 'mock.alpha.lead@local.test'
JOIN "user" d1 ON d1.email = 'mock.alpha.dev1@local.test'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'M1%'
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Backlog grooming', 'Refine next sprint', 'todo', 'low', 10, NOW() + INTERVAL '10 days',
       p.id, p.workspace_id, ul.id, NULL, m2.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ul ON ul.email = 'mock.alpha.lead@local.test'
JOIN milestone m2 ON m2.project_id = p.id AND m2.title LIKE 'M2%'
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery';

INSERT INTO task (title, description, status, priority, points_value, due_date, completed_at, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Define API contracts', 'OpenAPI drafts for core resources', 'done', 'high', 25, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days',
       p.id, p.workspace_id, ua.id, d1.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ua ON ua.email = 'mock.beta.admin@local.test'
JOIN "user" d1 ON d1.email = 'mock.beta.dev1@local.test'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'M1%'
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Implement auth filter', 'JWT filter chain wiring', 'in_progress', 'critical', 50, NOW() + INTERVAL '3 days',
       p.id, p.workspace_id, ua.id, d2.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ua ON ua.email = 'mock.beta.admin@local.test'
JOIN "user" d2 ON d2.email = 'mock.beta.dev2@local.test'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'M1%'
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Write integration tests', 'Covers happy paths', 'review', 'medium', 25, NOW() + INTERVAL '7 days',
       p.id, p.workspace_id, ul.id, d1.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ul ON ul.email = 'mock.beta.lead@local.test'
JOIN "user" d1 ON d1.email = 'mock.beta.dev1@local.test'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'M1%'
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Backlog grooming', 'Refine next sprint', 'todo', 'low', 10, NOW() + INTERVAL '10 days',
       p.id, p.workspace_id, ul.id, NULL, m2.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ul ON ul.email = 'mock.beta.lead@local.test'
JOIN milestone m2 ON m2.project_id = p.id AND m2.title LIKE 'M2%'
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery';

INSERT INTO task (title, description, status, priority, points_value, due_date, completed_at, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Define API contracts', 'OpenAPI drafts for core resources', 'done', 'high', 25, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days',
       p.id, p.workspace_id, ua.id, d1.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ua ON ua.email = 'mock.gamma.admin@local.test'
JOIN "user" d1 ON d1.email = 'mock.gamma.dev1@local.test'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'M1%'
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Implement auth filter', 'JWT filter chain wiring', 'in_progress', 'critical', 50, NOW() + INTERVAL '3 days',
       p.id, p.workspace_id, ua.id, d2.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ua ON ua.email = 'mock.gamma.admin@local.test'
JOIN "user" d2 ON d2.email = 'mock.gamma.dev2@local.test'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'M1%'
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Write integration tests', 'Covers happy paths', 'review', 'medium', 25, NOW() + INTERVAL '7 days',
       p.id, p.workspace_id, ul.id, d1.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ul ON ul.email = 'mock.gamma.lead@local.test'
JOIN "user" d1 ON d1.email = 'mock.gamma.dev1@local.test'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'M1%'
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Backlog grooming', 'Refine next sprint', 'todo', 'low', 10, NOW() + INTERVAL '10 days',
       p.id, p.workspace_id, ul.id, NULL, m2.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ul ON ul.email = 'mock.gamma.lead@local.test'
JOIN milestone m2 ON m2.project_id = p.id AND m.title LIKE 'M2%'
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery';

-- ---------------------------------------------------------------------------
-- 10) task_history (one row on the first "done" task per project)
-- ---------------------------------------------------------------------------
INSERT INTO task_history (task_id, changed_by, field_changed, old_value, new_value, changed_at)
SELECT t.id, ul.id, 'status', 'in_progress', 'done', NOW() - INTERVAL '3 days'
FROM task t
JOIN project p ON p.id = t.project_id
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ul ON ul.email = 'mock.alpha.lead@local.test'
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery' AND t.title = 'Define API contracts';

INSERT INTO task_history (task_id, changed_by, field_changed, old_value, new_value, changed_at)
SELECT t.id, ul.id, 'status', 'in_progress', 'done', NOW() - INTERVAL '3 days'
FROM task t
JOIN project p ON p.id = t.project_id
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ul ON ul.email = 'mock.beta.lead@local.test'
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery' AND t.title = 'Define API contracts';

INSERT INTO task_history (task_id, changed_by, field_changed, old_value, new_value, changed_at)
SELECT t.id, ul.id, 'status', 'in_progress', 'done', NOW() - INTERVAL '3 days'
FROM task t
JOIN project p ON p.id = t.project_id
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" ul ON ul.email = 'mock.gamma.lead@local.test'
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery' AND t.title = 'Define API contracts';

-- ---------------------------------------------------------------------------
-- 11) dashboard_config (one row per active mock user)
-- ---------------------------------------------------------------------------
INSERT INTO dashboard_config (user_id, layout_config)
SELECT u.id, '{"columns": 3, "widgets": ["tasks", "velocity"]}'::jsonb
FROM "user" u
WHERE u.email LIKE 'mock.%@local.test'
  AND u.status = 'active';

-- ---------------------------------------------------------------------------
-- 12) user_rank
-- ---------------------------------------------------------------------------
INSERT INTO user_rank (user_id, rank_level, rank_name, total_points, updated_at)
SELECT u.id, 2, 'Contributor', 820, NOW() - INTERVAL '1 day'
FROM "user" u
WHERE u.email LIKE 'mock.%@local.test';

-- ---------------------------------------------------------------------------
-- 13) Badges & rewards (catalog), then user links
-- ---------------------------------------------------------------------------
INSERT INTO badge (name, description, icon_url, condition, threshold, active) VALUES
    ('First Ship', 'Completed first task in a project', NULL, 'tasks_completed', 1, TRUE),
    ('Deep Focus', 'Closed a critical-priority task', NULL, 'critical_tasks', 1, TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO reward (name, description, points_required, active) VALUES
    ('Team Lunch', 'Catered lunch for the squad', 800, TRUE),
    ('Extra Day Off', 'Redeem for a bonus PTO day', 8000, TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO user_badge (user_id, badge_id, earned_at)
SELECT u.id, b.id, NOW() - INTERVAL '2 days'
FROM "user" u
CROSS JOIN badge b
WHERE u.email IN ('mock.alpha.dev1@local.test', 'mock.beta.dev1@local.test', 'mock.gamma.dev1@local.test')
  AND b.name = 'First Ship';

INSERT INTO user_reward (user_id, reward_id, redeemed_at)
SELECT u.id, r.id, NOW() - INTERVAL '30 days'
FROM "user" u
CROSS JOIN reward r
WHERE u.email IN ('mock.alpha.admin@local.test', 'mock.beta.admin@local.test', 'mock.gamma.admin@local.test')
  AND r.name = 'Team Lunch';

-- ---------------------------------------------------------------------------
-- 14) requirement_document (linked to each AI session)
-- ---------------------------------------------------------------------------
INSERT INTO requirement_document (session_id, project_id, file_name, storage_url, raw_text, uploaded_at)
SELECT s.id, p.id, 'requirements-alpha.pdf', 's3://mock/alpha/requirements.pdf', 'High-level scope for Alpha Delivery', NOW() - INTERVAL '7 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery' AND s.session_type = 'project_generation';

INSERT INTO requirement_document (session_id, project_id, file_name, storage_url, raw_text, uploaded_at)
SELECT s.id, p.id, 'requirements-beta.pdf', 's3://mock/beta/requirements.pdf', 'High-level scope for Beta Delivery', NOW() - INTERVAL '7 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery' AND s.session_type = 'project_generation';

INSERT INTO requirement_document (session_id, project_id, file_name, storage_url, raw_text, uploaded_at)
SELECT s.id, p.id, 'requirements-gamma.pdf', 's3://mock/gamma/requirements.pdf', 'High-level scope for Gamma Delivery', NOW() - INTERVAL '7 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery' AND s.session_type = 'project_generation';

-- ---------------------------------------------------------------------------
-- 15) ai_generated_task
-- ---------------------------------------------------------------------------
INSERT INTO ai_generated_task (session_id, task_id, title, description, priority, estimated_days, accepted, created_at)
SELECT s.id, NULL, 'AI: Add health check endpoint', 'Suggested by session', 'medium', 2, FALSE, NOW() - INTERVAL '6 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery' AND s.session_type = 'project_generation';

INSERT INTO ai_generated_task (session_id, task_id, title, description, priority, estimated_days, accepted, created_at)
SELECT s.id, NULL, 'AI: Add health check endpoint', 'Suggested by session', 'medium', 2, FALSE, NOW() - INTERVAL '6 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery' AND s.session_type = 'project_generation';

INSERT INTO ai_generated_task (session_id, task_id, title, description, priority, estimated_days, accepted, created_at)
SELECT s.id, NULL, 'AI: Add health check endpoint', 'Suggested by session', 'medium', 2, FALSE, NOW() - INTERVAL '6 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery' AND s.session_type = 'project_generation';

-- ---------------------------------------------------------------------------
-- 16) ai_recommendation & risk_analysis
-- ---------------------------------------------------------------------------
INSERT INTO ai_recommendation (session_id, project_id, recommendation_type, content, confidence, acknowledged, created_at)
SELECT s.id, p.id, 'timeline', 'Consider padding milestone M2 by one week.', 0.720, FALSE, NOW() - INTERVAL '5 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery' AND s.session_type = 'project_generation';

INSERT INTO ai_recommendation (session_id, project_id, recommendation_type, content, confidence, acknowledged, created_at)
SELECT s.id, p.id, 'timeline', 'Consider padding milestone M2 by one week.', 0.720, FALSE, NOW() - INTERVAL '5 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery' AND s.session_type = 'project_generation';

INSERT INTO ai_recommendation (session_id, project_id, recommendation_type, content, confidence, acknowledged, created_at)
SELECT s.id, p.id, 'timeline', 'Consider padding milestone M2 by one week.', 0.720, FALSE, NOW() - INTERVAL '5 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery' AND s.session_type = 'project_generation';

INSERT INTO risk_analysis (session_id, project_id, risk_type, severity, likelihood, description, based_on_logs, created_at)
SELECT s.id, p.id, 'scope_creep', 'medium', 0.450, 'Backlog growing faster than completion.', TRUE, NOW() - INTERVAL '4 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery' AND s.session_type = 'project_generation';

INSERT INTO risk_analysis (session_id, project_id, risk_type, severity, likelihood, description, based_on_logs, created_at)
SELECT s.id, p.id, 'scope_creep', 'medium', 0.450, 'Backlog growing faster than completion.', TRUE, NOW() - INTERVAL '4 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery' AND s.session_type = 'project_generation';

INSERT INTO risk_analysis (session_id, project_id, risk_type, severity, likelihood, description, based_on_logs, created_at)
SELECT s.id, p.id, 'scope_creep', 'medium', 0.450, 'Backlog growing faster than completion.', TRUE, NOW() - INTERVAL '4 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery' AND s.session_type = 'project_generation';

-- ---------------------------------------------------------------------------
-- 17) user_points (for each completed "Define API contracts" task)
-- ---------------------------------------------------------------------------
INSERT INTO user_points (user_id, task_id, base_points, multiplier, final_points, reason, earned_at)
SELECT d1.id, t.id, 25, 1.10, 27, 'task_completed', NOW() - INTERVAL '3 days'
FROM task t
JOIN project p ON p.id = t.project_id
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" d1 ON d1.email = 'mock.alpha.dev1@local.test'
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery' AND t.title = 'Define API contracts';

INSERT INTO user_points (user_id, task_id, base_points, multiplier, final_points, reason, earned_at)
SELECT d1.id, t.id, 25, 1.10, 27, 'task_completed', NOW() - INTERVAL '3 days'
FROM task t
JOIN project p ON p.id = t.project_id
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" d1 ON d1.email = 'mock.beta.dev1@local.test'
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery' AND t.title = 'Define API contracts';

INSERT INTO user_points (user_id, task_id, base_points, multiplier, final_points, reason, earned_at)
SELECT d1.id, t.id, 25, 1.10, 27, 'task_completed', NOW() - INTERVAL '3 days'
FROM task t
JOIN project p ON p.id = t.project_id
JOIN workspace w ON w.id = p.workspace_id
JOIN "user" d1 ON d1.email = 'mock.gamma.dev1@local.test'
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery' AND t.title = 'Define API contracts';

-- ---------------------------------------------------------------------------
-- 18) project_analytic_snapshot
-- ---------------------------------------------------------------------------
INSERT INTO project_analytic_snapshot (project_id, snapshot_date, total_tasks, completed_tasks, overdue_tasks, avg_completion_days, team_velocity, risk_score)
SELECT p.id, CURRENT_DATE - 1, 4, 1, 0, 3.50, 0.40, 0.250
FROM project p
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Alpha' AND p.name = 'Alpha Delivery';

INSERT INTO project_analytic_snapshot (project_id, snapshot_date, total_tasks, completed_tasks, overdue_tasks, avg_completion_days, team_velocity, risk_score)
SELECT p.id, CURRENT_DATE - 1, 4, 1, 0, 3.50, 0.40, 0.250
FROM project p
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Beta' AND p.name = 'Beta Delivery';

INSERT INTO project_analytic_snapshot (project_id, snapshot_date, total_tasks, completed_tasks, overdue_tasks, avg_completion_days, team_velocity, risk_score)
SELECT p.id, CURRENT_DATE - 1, 4, 1, 0, 3.50, 0.40, 0.250
FROM project p
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Mock Workspace Gamma' AND p.name = 'Gamma Delivery';
