-- V2__initial_data_template
-- Demo seed: three isolated full graphs (Stratos / Meridian / Aegis) for UI and API walkthroughs.
-- NOTE: If you already ran Flyway once, don't edit this file; create a new migration instead.
-- V1 defines tables only (no seed rows); this migration owns roles, rank_config, and demo data.
-- Demo logins: emails admin1@gmail.com, lead1@gmail.com, developer1@gmail.com, … (see INSERT below).
-- Password for every seeded account: role123

-- ---------------------------------------------------------------------------
-- 1) Roles (explicit IDs — demo user_role rows reference 1 / 2 / 3 / 4 / 5)
-- ---------------------------------------------------------------------------
INSERT INTO role (id, name, description) VALUES
    (1, 'ADMIN', 'Full access to workspace settings and programs'),
    (2, 'TEAM_LEAD', 'Plans milestones, assigns work, and keeps delivery on track'),
    (3, 'DEVELOPER', 'Implements features, fixes defects, and ships increments'),
    (4, 'VIEW_ONLY', 'Read-only; cannot change tasks, settings, or membership'),
    (5, 'DELETED_USER', 'Reserved for deactivated accounts; pair with inactive user status')
ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description;

SELECT setval(pg_get_serial_sequence('role', 'id'), (SELECT COALESCE(MAX(id), 1) FROM role));

-- ---------------------------------------------------------------------------
-- 1b) Rank catalog (was removed from V1; gamification UI may expect these rows)
-- ---------------------------------------------------------------------------
INSERT INTO rank_config (rank_level, rank_name, min_points, max_points, benefit_description, point_multiplier) VALUES
    (1, 'Rookie',       0,     499,   'Welcome aboard! Start completing tasks to level up.',   1.00),
    (2, 'Contributor',  500,   1499,  '10% point bonus on every completed task.',              1.10),
    (3, 'Performer',    1500,  3999,  '25% point bonus and early access to new features.',     1.25),
    (4, 'Expert',       4000,  9999,  '50% point bonus and priority support.',                 1.50),
    (5, 'Legend',       10000, 99999, 'Double points and exclusive Legend badge.',             2.00)
ON CONFLICT (rank_level) DO UPDATE SET
    rank_name           = EXCLUDED.rank_name,
    min_points          = EXCLUDED.min_points,
    max_points          = EXCLUDED.max_points,
    benefit_description = EXCLUDED.benefit_description,
    point_multiplier    = EXCLUDED.point_multiplier;

SELECT setval(pg_get_serial_sequence('rank_config', 'id'), (SELECT COALESCE(MAX(id), 1) FROM rank_config));

-- BCrypt (strength 10) for literal password: role123

-- ---------------------------------------------------------------------------
-- 2) Users (15) — five per division: administrator, lead, two engineers, one former colleague
-- ---------------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, status) VALUES
    ('Sarah Chen', 'admin1@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Marcus Webb', 'lead1@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Priya Nair', 'developer1@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Diego Ramos', 'developer2@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Jordan Ellis', 'alumni1@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'inactive'),
    ('Elena Vukovic', 'admin2@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Thomas Okafor', 'lead2@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Hannah Kim', 'developer3@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Alex Morrison', 'developer4@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Casey Nguyen', 'alumni2@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'inactive'),
    ('Robert Okonkwo', 'admin3@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Michelle Park', 'lead3@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Sanjay Patel', 'developer5@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Laura Fernández', 'developer6@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Jamie Wright', 'alumni3@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'inactive');

-- ---------------------------------------------------------------------------
-- 3) user_role — one global role per demo user (role_id 1 / 2 / 3 / 6)
-- ---------------------------------------------------------------------------
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 1 FROM users u WHERE u.email = 'admin1@gmail.com';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 2 FROM users u WHERE u.email = 'lead1@gmail.com';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 3 FROM users u WHERE u.email IN ('developer1@gmail.com', 'developer2@gmail.com');
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 4 FROM users u WHERE u.email = 'alumni1@gmail.com';

INSERT INTO user_role (user_id, role_id)
SELECT u.id, 1 FROM users u WHERE u.email = 'admin2@gmail.com';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 2 FROM users u WHERE u.email = 'lead2@gmail.com';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 3 FROM users u WHERE u.email IN ('developer3@gmail.com', 'developer4@gmail.com');
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 4 FROM users u WHERE u.email = 'alumni2@gmail.com';

INSERT INTO user_role (user_id, role_id)
SELECT u.id, 1 FROM users u WHERE u.email = 'admin3@gmail.com';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 2 FROM users u WHERE u.email = 'lead3@gmail.com';
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 3 FROM users u WHERE u.email IN ('developer5@gmail.com', 'developer6@gmail.com');
INSERT INTO user_role (user_id, role_id)
SELECT u.id, 4 FROM users u WHERE u.email = 'alumni3@gmail.com';

-- ---------------------------------------------------------------------------
-- 4) Workspaces
-- ---------------------------------------------------------------------------
INSERT INTO workspace (name) VALUES
    ('Stratos Mobility — Program Office'),
    ('Meridian Capital — Core Engineering'),
    ('Aegis Health — Connected Care');

-- ---------------------------------------------------------------------------
-- 5) Projects (one active program per workspace; created_by = division admin)
-- ---------------------------------------------------------------------------
INSERT INTO project (name, description, status, created_by, workspace_id)
SELECT 'Customer wayfinding & mobile ticketing', 'End-to-end release for station navigation, digital passes, and peak-load performance targets.', 'active', u.id, w.id
FROM workspace w
JOIN users u ON u.email = 'admin1@gmail.com'
WHERE w.name = 'Stratos Mobility — Program Office';

INSERT INTO project (name, description, status, created_by, workspace_id)
SELECT 'Payments API hardening — wave 2', 'Resilience workstream: idempotency keys, circuit breakers, and observability for the settlement rail.', 'active', u.id, w.id
FROM workspace w
JOIN users u ON u.email = 'admin2@gmail.com'
WHERE w.name = 'Meridian Capital — Core Engineering';

INSERT INTO project (name, description, status, created_by, workspace_id)
SELECT 'Care coordination pilot — Midwest', 'Pilot rollout for referral workflows, care-team messaging, and HIPAA-aligned audit trails.', 'active', u.id, w.id
FROM workspace w
JOIN users u ON u.email = 'admin3@gmail.com'
WHERE w.name = 'Aegis Health — Connected Care';

-- ---------------------------------------------------------------------------
-- 6) project_member
-- ---------------------------------------------------------------------------
INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'owner'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email = 'admin1@gmail.com'
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'collaborator'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email = 'lead1@gmail.com'
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'collaborator'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email IN ('developer1@gmail.com', 'developer2@gmail.com')
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'viewer'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email = 'alumni1@gmail.com'
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'owner'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email = 'admin2@gmail.com'
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'collaborator'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email = 'lead2@gmail.com'
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'collaborator'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email IN ('developer3@gmail.com', 'developer4@gmail.com')
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'viewer'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email = 'alumni2@gmail.com'
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'owner'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email = 'admin3@gmail.com'
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'collaborator'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email = 'lead3@gmail.com'
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'collaborator'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email IN ('developer5@gmail.com', 'developer6@gmail.com')
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest';

INSERT INTO project_member (project_id, user_id, role_in_project)
SELECT p.id, u.id, 'viewer'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email = 'alumni3@gmail.com'
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest';

-- ---------------------------------------------------------------------------
-- 7) AI sessions (one completed project_generation per project)
-- ---------------------------------------------------------------------------
INSERT INTO ai_session (user_id, project_id, session_type, status, created_at, completed_at)
SELECT u.id, p.id, 'project_generation', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email = 'admin1@gmail.com'
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing';

INSERT INTO ai_session (user_id, project_id, session_type, status, created_at, completed_at)
SELECT u.id, p.id, 'project_generation', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email = 'admin2@gmail.com'
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2';

INSERT INTO ai_session (user_id, project_id, session_type, status, created_at, completed_at)
SELECT u.id, p.id, 'project_generation', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users u ON u.email = 'admin3@gmail.com'
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest';

-- ---------------------------------------------------------------------------
-- 8) Milestones (two per project; first linked to AI session)
-- ---------------------------------------------------------------------------
INSERT INTO milestone (project_id, session_id, title, description, due_date, status)
SELECT p.id, s.id, 'Sprint 12 — platform foundations', 'Identity, routing, and baseline load tests for the station edge stack.', NOW() + INTERVAL '14 days', 'in_progress'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN ai_session s ON s.project_id = p.id AND s.session_type = 'project_generation'
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing';

INSERT INTO milestone (project_id, session_id, title, description, due_date, status)
SELECT p.id, NULL, 'Release candidate & field pilot', 'Staged rollout, operations runbooks, and executive readiness review.', NOW() + INTERVAL '30 days', 'pending'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing';

INSERT INTO milestone (project_id, session_id, title, description, due_date, status)
SELECT p.id, s.id, 'Sprint 12 — platform foundations', 'Chaos tests, SLO dashboards, and partner certification dry runs.', NOW() + INTERVAL '14 days', 'in_progress'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN ai_session s ON s.project_id = p.id AND s.session_type = 'project_generation'
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2';

INSERT INTO milestone (project_id, session_id, title, description, due_date, status)
SELECT p.id, NULL, 'Release candidate & field pilot', 'Cutover checklist, finance sign-off, and 24/7 bridge staffing model.', NOW() + INTERVAL '30 days', 'pending'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2';

INSERT INTO milestone (project_id, session_id, title, description, due_date, status)
SELECT p.id, s.id, 'Sprint 12 — platform foundations', 'FHIR interfaces, consent capture, and clinician training content.', NOW() + INTERVAL '14 days', 'in_progress'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN ai_session s ON s.project_id = p.id AND s.session_type = 'project_generation'
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest';

INSERT INTO milestone (project_id, session_id, title, description, due_date, status)
SELECT p.id, NULL, 'Release candidate & field pilot', 'Site go-live sequencing, privacy review, and patient communications pack.', NOW() + INTERVAL '30 days', 'pending'
FROM project p
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest';

-- ---------------------------------------------------------------------------
-- 9) Tasks (four per project; mixed status / priority / points)
-- ---------------------------------------------------------------------------
INSERT INTO task (title, description, status, priority, points_value, due_date, completed_at, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Publish OpenAPI specification v2', 'Partner-facing contract for stations, fares, and entitlement checks.', 'done', 'high', 25, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days',
       p.id, p.workspace_id, ua.id, d1.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users ua ON ua.email = 'admin1@gmail.com'
JOIN users d1 ON d1.email = 'developer1@gmail.com'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'Sprint 12%'
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Implement fare engine edge cache', 'TTL policies, stampede protection, and regional failover drills.', 'in_progress', 'critical', 50, NOW() + INTERVAL '3 days',
       p.id, p.workspace_id, ua.id, d2.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users ua ON ua.email = 'admin1@gmail.com'
JOIN users d2 ON d2.email = 'developer2@gmail.com'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'Sprint 12%'
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Load test peak-hour scenarios', 'Synthetic journeys for morning rush and event nights.', 'review', 'medium', 25, NOW() + INTERVAL '7 days',
       p.id, p.workspace_id, ul.id, d1.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users ul ON ul.email = 'lead1@gmail.com'
JOIN users d1 ON d1.email = 'developer1@gmail.com'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'Sprint 12%'
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Backlog refinement — pilot sites', 'Prioritize defects from Chicago field observations.', 'todo', 'low', 10, NOW() + INTERVAL '10 days',
       p.id, p.workspace_id, ul.id, NULL, m2.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users ul ON ul.email = 'lead1@gmail.com'
JOIN milestone m2 ON m2.project_id = p.id AND m2.title LIKE 'Release candidate%'
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing';

INSERT INTO task (title, description, status, priority, points_value, due_date, completed_at, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Wire OAuth2 resource server', 'Token introspection, audience checks, and mTLS to the policy service.', 'done', 'high', 25, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days',
       p.id, p.workspace_id, ua.id, d1.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users ua ON ua.email = 'admin2@gmail.com'
JOIN users d1 ON d1.email = 'developer3@gmail.com'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'Sprint 12%'
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Idempotency replay harness', 'Automated replays for POST /transfers under duplicate keys.', 'in_progress', 'critical', 50, NOW() + INTERVAL '3 days',
       p.id, p.workspace_id, ua.id, d2.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users ua ON ua.email = 'admin2@gmail.com'
JOIN users d2 ON d2.email = 'developer4@gmail.com'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'Sprint 12%'
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Golden signals dashboards', 'RED metrics, burn-rate alerts, and on-call playbooks.', 'review', 'medium', 25, NOW() + INTERVAL '7 days',
       p.id, p.workspace_id, ul.id, d1.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users ul ON ul.email = 'lead2@gmail.com'
JOIN users d1 ON d1.email = 'developer3@gmail.com'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'Sprint 12%'
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Partner certification dry run', 'Schedule and materials for clearinghouse validation window.', 'todo', 'low', 10, NOW() + INTERVAL '10 days',
       p.id, p.workspace_id, ul.id, NULL, m2.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users ul ON ul.email = 'lead2@gmail.com'
JOIN milestone m2 ON m2.project_id = p.id AND m2.title LIKE 'Release candidate%'
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2';

INSERT INTO task (title, description, status, priority, points_value, due_date, completed_at, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Instrument distributed tracing', 'W3C trace context across scheduling, messaging, and EHR bridges.', 'done', 'high', 25, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days',
       p.id, p.workspace_id, ua.id, d1.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users ua ON ua.email = 'admin3@gmail.com'
JOIN users d1 ON d1.email = 'developer5@gmail.com'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'Sprint 12%'
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Referral workflow state machine', 'SLA timers, escalation paths, and audit event schema.', 'in_progress', 'critical', 50, NOW() + INTERVAL '3 days',
       p.id, p.workspace_id, ua.id, d2.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users ua ON ua.email = 'admin3@gmail.com'
JOIN users d2 ON d2.email = 'developer6@gmail.com'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'Sprint 12%'
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Clinician training dry run', 'Walkthrough with two pilot hospitals; capture feedback in backlog.', 'review', 'medium', 25, NOW() + INTERVAL '7 days',
       p.id, p.workspace_id, ul.id, d1.id, m.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users ul ON ul.email = 'lead3@gmail.com'
JOIN users d1 ON d1.email = 'developer5@gmail.com'
JOIN milestone m ON m.project_id = p.id AND m.title LIKE 'Sprint 12%'
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest';

INSERT INTO task (title, description, status, priority, points_value, due_date, project_id, workspace_id, created_by, assigned_to, milestone_id)
SELECT 'Patient communications pack', 'Plain-language notices for enrollment and consent changes.', 'todo', 'low', 10, NOW() + INTERVAL '10 days',
       p.id, p.workspace_id, ul.id, NULL, m2.id
FROM project p
JOIN workspace w ON w.id = p.workspace_id
JOIN users ul ON ul.email = 'lead3@gmail.com'
JOIN milestone m2 ON m2.project_id = p.id AND m2.title LIKE 'Release candidate%'
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest';

-- ---------------------------------------------------------------------------
-- 10) task_history (one row on the first completed spec task per project)
-- ---------------------------------------------------------------------------
INSERT INTO task_history (task_id, changed_by, field_changed, old_value, new_value, changed_at)
SELECT t.id, ul.id, 'status', 'in_progress', 'done', NOW() - INTERVAL '3 days'
FROM task t
JOIN project p ON p.id = t.project_id
JOIN workspace w ON w.id = p.workspace_id
JOIN users ul ON ul.email = 'lead1@gmail.com'
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing' AND t.title = 'Publish OpenAPI specification v2';

INSERT INTO task_history (task_id, changed_by, field_changed, old_value, new_value, changed_at)
SELECT t.id, ul.id, 'status', 'in_progress', 'done', NOW() - INTERVAL '3 days'
FROM task t
JOIN project p ON p.id = t.project_id
JOIN workspace w ON w.id = p.workspace_id
JOIN users ul ON ul.email = 'lead2@gmail.com'
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2' AND t.title = 'Wire OAuth2 resource server';

INSERT INTO task_history (task_id, changed_by, field_changed, old_value, new_value, changed_at)
SELECT t.id, ul.id, 'status', 'in_progress', 'done', NOW() - INTERVAL '3 days'
FROM task t
JOIN project p ON p.id = t.project_id
JOIN workspace w ON w.id = p.workspace_id
JOIN users ul ON ul.email = 'lead3@gmail.com'
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest' AND t.title = 'Instrument distributed tracing';

-- ---------------------------------------------------------------------------
-- 11) dashboard_config (one row per active demo user)
-- ---------------------------------------------------------------------------
INSERT INTO dashboard_config (user_id, layout_config)
SELECT u.id, '{"version":2,"columns":3,"widgets":[{"id":"tasks-due","type":"tasks","title":"Work due this week"},{"id":"velocity","type":"velocity","title":"Team throughput"},{"id":"risks","type":"risks","title":"Open risks"}]}'::jsonb
FROM users u
WHERE u.email IN (
    'admin1@gmail.com', 'lead1@gmail.com', 'developer1@gmail.com', 'developer2@gmail.com',
    'admin2@gmail.com', 'lead2@gmail.com', 'developer3@gmail.com', 'developer4@gmail.com',
    'admin3@gmail.com', 'lead3@gmail.com', 'developer5@gmail.com', 'developer6@gmail.com'
)
  AND u.status = 'active';

-- ---------------------------------------------------------------------------
-- 12) user_rank
-- ---------------------------------------------------------------------------
INSERT INTO user_rank (user_id, rank_level, rank_name, total_points, updated_at)
SELECT u.id, 2, 'Contributor', 820, NOW() - INTERVAL '1 day'
FROM users u
WHERE u.email IN (
    'admin1@gmail.com', 'lead1@gmail.com', 'developer1@gmail.com', 'developer2@gmail.com', 'alumni1@gmail.com',
    'admin2@gmail.com', 'lead2@gmail.com', 'developer3@gmail.com', 'developer4@gmail.com', 'alumni2@gmail.com',
    'admin3@gmail.com', 'lead3@gmail.com', 'developer5@gmail.com', 'developer6@gmail.com', 'alumni3@gmail.com'
);

-- ---------------------------------------------------------------------------
-- 13) Badges & rewards (catalog), then user links
-- ---------------------------------------------------------------------------
INSERT INTO badge (name, description, icon_url, condition, threshold, active) VALUES
    ('First delivery', 'Shipped the first production-ready increment in a program', 'https://cdn.demo.internal/badges/first-delivery.svg', 'tasks_completed', 1, TRUE),
    ('Critical path closer', 'Resolved a critical-priority item before the escalation window', 'https://cdn.demo.internal/badges/critical-close.svg', 'critical_tasks', 1, TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO reward (name, description, points_required, active) VALUES
    ('Team dinner credit', 'Catered dinner for the squad after milestone sign-off', 800, TRUE),
    ('Bonus PTO day', 'Redeem for one additional paid day off', 8000, TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO user_badge (user_id, badge_id, earned_at)
SELECT u.id, b.id, NOW() - INTERVAL '2 days'
FROM users u
CROSS JOIN badge b
WHERE u.email IN ('developer1@gmail.com', 'developer3@gmail.com', 'developer5@gmail.com')
  AND b.name = 'First delivery';

INSERT INTO user_reward (user_id, reward_id, redeemed_at)
SELECT u.id, r.id, NOW() - INTERVAL '30 days'
FROM users u
CROSS JOIN reward r
WHERE u.email IN ('admin1@gmail.com', 'admin2@gmail.com', 'admin3@gmail.com')
  AND r.name = 'Team dinner credit';

-- ---------------------------------------------------------------------------
-- 14) requirement_document (linked to each AI session)
-- ---------------------------------------------------------------------------
INSERT INTO requirement_document (session_id, project_id, file_name, storage_url, raw_text, uploaded_at)
SELECT s.id, p.id, 'Stratos-RFP-Wayfinding-v3.pdf', 'https://files.demo.internal/collabx/stratos/rfp-wayfinding-v3.pdf', 'Executive summary: phased rollout for twelve stations, fare capping, and accessibility commitments.', NOW() - INTERVAL '7 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing' AND s.session_type = 'project_generation';

INSERT INTO requirement_document (session_id, project_id, file_name, storage_url, raw_text, uploaded_at)
SELECT s.id, p.id, 'Meridian-Settlement-Controls.pdf', 'https://files.demo.internal/collabx/meridian/settlement-controls.pdf', 'Control objectives for settlement windows, reconciliation SLAs, and third-party audit evidence.', NOW() - INTERVAL '7 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2' AND s.session_type = 'project_generation';

INSERT INTO requirement_document (session_id, project_id, file_name, storage_url, raw_text, uploaded_at)
SELECT s.id, p.id, 'Aegis-Pilot-Clinical-Scope.docx', 'https://files.demo.internal/collabx/aegis/pilot-clinical-scope.docx', 'In-scope care pathways, HIPAA minimum necessary guidance, and Midwest site readiness criteria.', NOW() - INTERVAL '7 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest' AND s.session_type = 'project_generation';

-- ---------------------------------------------------------------------------
-- 15) ai_generated_task
-- ---------------------------------------------------------------------------
INSERT INTO ai_generated_task (session_id, task_id, title, description, priority, estimated_days, accepted, created_at)
SELECT s.id, NULL, 'Add synthetic journey monitors', 'Nightly canaries for top ten origin–destination pairs.', 'medium', 2, FALSE, NOW() - INTERVAL '6 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing' AND s.session_type = 'project_generation';

INSERT INTO ai_generated_task (session_id, task_id, title, description, priority, estimated_days, accepted, created_at)
SELECT s.id, NULL, 'Add synthetic journey monitors', 'Replay production traffic shapes against the staging rail.', 'medium', 2, FALSE, NOW() - INTERVAL '6 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2' AND s.session_type = 'project_generation';

INSERT INTO ai_generated_task (session_id, task_id, title, description, priority, estimated_days, accepted, created_at)
SELECT s.id, NULL, 'Add synthetic journey monitors', 'Shadow-mode FHIR reads against legacy ADT feeds.', 'medium', 2, FALSE, NOW() - INTERVAL '6 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest' AND s.session_type = 'project_generation';

-- ---------------------------------------------------------------------------
-- 16) ai_recommendation & risk_analysis
-- ---------------------------------------------------------------------------
INSERT INTO ai_recommendation (session_id, project_id, recommendation_type, content, confidence, acknowledged, created_at)
SELECT s.id, p.id, 'timeline', 'Buffer the field pilot milestone by five working days to absorb certification feedback.', 0.720, FALSE, NOW() - INTERVAL '5 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing' AND s.session_type = 'project_generation';

INSERT INTO ai_recommendation (session_id, project_id, recommendation_type, content, confidence, acknowledged, created_at)
SELECT s.id, p.id, 'timeline', 'Parallelize chaos testing with partner certification to avoid a late sequencing gap.', 0.720, FALSE, NOW() - INTERVAL '5 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2' AND s.session_type = 'project_generation';

INSERT INTO ai_recommendation (session_id, project_id, recommendation_type, content, confidence, acknowledged, created_at)
SELECT s.id, p.id, 'timeline', 'Staff a clinical safety huddle weekly until pilot volume stabilizes.', 0.720, FALSE, NOW() - INTERVAL '5 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest' AND s.session_type = 'project_generation';

INSERT INTO risk_analysis (session_id, project_id, risk_type, severity, likelihood, description, based_on_logs, created_at)
SELECT s.id, p.id, 'scope_creep', 'medium', 0.450, 'Backlog intake is outpacing completed increments; tighten change-advisory criteria.', TRUE, NOW() - INTERVAL '4 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing' AND s.session_type = 'project_generation';

INSERT INTO risk_analysis (session_id, project_id, risk_type, severity, likelihood, description, based_on_logs, created_at)
SELECT s.id, p.id, 'scope_creep', 'medium', 0.450, 'Partner defects are landing without sizing; risk to the hardening window.', TRUE, NOW() - INTERVAL '4 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2' AND s.session_type = 'project_generation';

INSERT INTO risk_analysis (session_id, project_id, risk_type, severity, likelihood, description, based_on_logs, created_at)
SELECT s.id, p.id, 'scope_creep', 'medium', 0.450, 'Clinical change requests may exceed the pilot change budget.', TRUE, NOW() - INTERVAL '4 days'
FROM ai_session s
JOIN project p ON p.id = s.project_id
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest' AND s.session_type = 'project_generation';

-- ---------------------------------------------------------------------------
-- 17) user_points (for each completed primary task per project)
-- ---------------------------------------------------------------------------
INSERT INTO user_points (user_id, task_id, base_points, multiplier, final_points, reason, earned_at)
SELECT d1.id, t.id, 25, 1.10, 27, 'task_completed', NOW() - INTERVAL '3 days'
FROM task t
JOIN project p ON p.id = t.project_id
JOIN workspace w ON w.id = p.workspace_id
JOIN users d1 ON d1.email = 'developer1@gmail.com'
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing' AND t.title = 'Publish OpenAPI specification v2';

INSERT INTO user_points (user_id, task_id, base_points, multiplier, final_points, reason, earned_at)
SELECT d1.id, t.id, 25, 1.10, 27, 'task_completed', NOW() - INTERVAL '3 days'
FROM task t
JOIN project p ON p.id = t.project_id
JOIN workspace w ON w.id = p.workspace_id
JOIN users d1 ON d1.email = 'developer3@gmail.com'
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2' AND t.title = 'Wire OAuth2 resource server';

INSERT INTO user_points (user_id, task_id, base_points, multiplier, final_points, reason, earned_at)
SELECT d1.id, t.id, 25, 1.10, 27, 'task_completed', NOW() - INTERVAL '3 days'
FROM task t
JOIN project p ON p.id = t.project_id
JOIN workspace w ON w.id = p.workspace_id
JOIN users d1 ON d1.email = 'developer5@gmail.com'
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest' AND t.title = 'Instrument distributed tracing';

-- ---------------------------------------------------------------------------
-- 18) project_analytic_snapshot
-- ---------------------------------------------------------------------------
INSERT INTO project_analytic_snapshot (project_id, snapshot_date, total_tasks, completed_tasks, overdue_tasks, avg_completion_days, team_velocity, risk_score)
SELECT p.id, CURRENT_DATE - 1, 4, 1, 0, 3.50, 0.40, 0.250
FROM project p
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Stratos Mobility — Program Office' AND p.name = 'Customer wayfinding & mobile ticketing';

INSERT INTO project_analytic_snapshot (project_id, snapshot_date, total_tasks, completed_tasks, overdue_tasks, avg_completion_days, team_velocity, risk_score)
SELECT p.id, CURRENT_DATE - 1, 4, 1, 0, 3.50, 0.40, 0.250
FROM project p
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Meridian Capital — Core Engineering' AND p.name = 'Payments API hardening — wave 2';

INSERT INTO project_analytic_snapshot (project_id, snapshot_date, total_tasks, completed_tasks, overdue_tasks, avg_completion_days, team_velocity, risk_score)
SELECT p.id, CURRENT_DATE - 1, 4, 1, 0, 3.50, 0.40, 0.250
FROM project p
JOIN workspace w ON w.id = p.workspace_id
WHERE w.name = 'Aegis Health — Connected Care' AND p.name = 'Care coordination pilot — Midwest';
