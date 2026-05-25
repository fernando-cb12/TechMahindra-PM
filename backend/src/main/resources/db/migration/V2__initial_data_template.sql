-- V2__initial_data_template
-- Minimal demo seed for fresh local databases.
-- Demo logins use password: role123

INSERT INTO role (id, name, description) VALUES
    (1, 'ADMIN', 'Full access to workspace settings'),
    (2, 'TEAM_LEAD', 'Plans boards, assigns work, and keeps delivery on track'),
    (3, 'DEVELOPER', 'Implements features, fixes defects, and ships increments'),
    (4, 'VIEW_ONLY', 'Read-only access'),
    (5, 'DELETED_USER', 'Reserved for deactivated accounts')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

SELECT setval(pg_get_serial_sequence('role', 'id'), (SELECT COALESCE(MAX(id), 1) FROM role));

INSERT INTO rank_config (rank_level, rank_name, min_points, max_points, benefit_description, point_multiplier) VALUES
    (1, 'Rookie', 0, 499, 'Welcome aboard! Start completing tasks to level up.', 1.00),
    (2, 'Contributor', 500, 1499, '10% point bonus on every completed task.', 1.10),
    (3, 'Performer', 1500, 3999, '25% point bonus and early access to new features.', 1.25),
    (4, 'Expert', 4000, 9999, '50% point bonus and priority support.', 1.50),
    (5, 'Legend', 10000, 99999, 'Double points and exclusive Legend badge.', 2.00)
ON CONFLICT (rank_level) DO UPDATE SET
    rank_name = EXCLUDED.rank_name,
    min_points = EXCLUDED.min_points,
    max_points = EXCLUDED.max_points,
    benefit_description = EXCLUDED.benefit_description,
    point_multiplier = EXCLUDED.point_multiplier;

INSERT INTO users (name, email, password_hash, status) VALUES
    ('Sarah Chen', 'admin1@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Marcus Webb', 'lead1@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Priya Nair', 'developer1@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Diego Ramos', 'developer2@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'active'),
    ('Jordan Ellis', 'alumni1@gmail.com', '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe', 'inactive')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN role r ON r.name = 'ADMIN'
WHERE u.email = 'admin1@gmail.com'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN role r ON r.name = 'TEAM_LEAD'
WHERE u.email = 'lead1@gmail.com'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN role r ON r.name = 'DEVELOPER'
WHERE u.email IN ('developer1@gmail.com', 'developer2@gmail.com')
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN role r ON r.name = 'VIEW_ONLY'
WHERE u.email = 'alumni1@gmail.com'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO workspaces (name, description, status, created_by, banner_image_url, budget_label, card_due_date)
SELECT
    'Customer wayfinding and mobile ticketing',
    'End-to-end release for station navigation, digital passes, and peak-load performance targets.',
    'active',
    u.id,
    NULL,
    '120k',
    CURRENT_DATE + INTERVAL '45 days'
FROM users u
WHERE u.email = 'admin1@gmail.com';

INSERT INTO workspace_member (workspace_id, user_id, role_in_workspace)
SELECT w.id, u.id,
       CASE WHEN u.email = 'admin1@gmail.com' THEN 'owner' ELSE 'collaborator' END
FROM workspaces w
JOIN users u ON u.email IN ('admin1@gmail.com', 'lead1@gmail.com', 'developer1@gmail.com', 'developer2@gmail.com')
WHERE w.name = 'Customer wayfinding and mobile ticketing';

INSERT INTO boards (workspace_id, name, description, color)
SELECT w.id, b.name, b.description, b.color
FROM workspaces w
CROSS JOIN (
    VALUES
        ('Planning', 'Scope, milestones, and intake', '#5F0229'),
        ('Delivery', 'Active implementation tasks', '#1976D2'),
        ('Review', 'Validation, QA, and release checks', '#2E7D32')
) AS b(name, description, color)
WHERE w.name = 'Customer wayfinding and mobile ticketing';

INSERT INTO milestone (workspace_id, title, description, due_date, status)
SELECT w.id, 'Pilot release', 'First integrated release milestone.', NOW() + INTERVAL '30 days', 'in_progress'
FROM workspaces w
WHERE w.name = 'Customer wayfinding and mobile ticketing';

INSERT INTO task (board_id, title, description, status, priority, points_value, due_date, created_by, assigned_to, milestone_id)
SELECT b.id, 'Map station transfer paths', 'Document the primary transfer routes for the pilot stations.', 'done', 'high', 25,
       NOW() - INTERVAL '2 days', creator.id, assignee.id, m.id
FROM boards b
JOIN workspaces w ON w.id = b.workspace_id
JOIN users creator ON creator.email = 'admin1@gmail.com'
JOIN users assignee ON assignee.email = 'developer1@gmail.com'
JOIN milestone m ON m.workspace_id = w.id
WHERE w.name = 'Customer wayfinding and mobile ticketing' AND b.name = 'Delivery';

INSERT INTO task (board_id, title, description, status, priority, points_value, due_date, created_by, assigned_to, milestone_id)
SELECT b.id, 'Ticket wallet QA pass', 'Validate add-to-wallet and offline ticket states.', 'in_progress', 'medium', 25,
       NOW() + INTERVAL '7 days', creator.id, assignee.id, m.id
FROM boards b
JOIN workspaces w ON w.id = b.workspace_id
JOIN users creator ON creator.email = 'admin1@gmail.com'
JOIN users assignee ON assignee.email = 'developer2@gmail.com'
JOIN milestone m ON m.workspace_id = w.id
WHERE w.name = 'Customer wayfinding and mobile ticketing' AND b.name = 'Review';
