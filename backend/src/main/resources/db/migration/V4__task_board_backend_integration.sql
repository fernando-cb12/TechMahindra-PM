-- Task board backend integration schema.

ALTER TABLE boards ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE boards ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id);
ALTER TABLE boards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS deleted_by BIGINT REFERENCES users(id);
ALTER TABLE boards ADD COLUMN IF NOT EXISTS purge_after TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS board_member (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_in_board VARCHAR(20) NOT NULL DEFAULT 'editor'
        CHECK (role_in_board IN ('owner', 'editor', 'viewer')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by BIGINT REFERENCES users(id),
    purge_after TIMESTAMPTZ,
    UNIQUE (board_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_groups (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(20) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by BIGINT REFERENCES users(id),
    purge_after TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS board_columns (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(40) NOT NULL,
    width INT,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    position INT NOT NULL DEFAULT 0,
    system_column BOOLEAN NOT NULL DEFAULT FALSE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by BIGINT REFERENCES users(id),
    purge_after TIMESTAMPTZ,
    UNIQUE (board_id, key)
);

CREATE TABLE IF NOT EXISTS board_column_options (
    id BIGSERIAL PRIMARY KEY,
    column_id BIGINT NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    color VARCHAR(20) NOT NULL,
    workflow_meaning VARCHAR(20) NOT NULL DEFAULT 'none',
    position INT NOT NULL DEFAULT 0,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by BIGINT REFERENCES users(id),
    purge_after TIMESTAMPTZ,
    UNIQUE (column_id, key)
);

ALTER TABLE task ADD COLUMN IF NOT EXISTS group_id BIGINT REFERENCES task_groups(id) ON DELETE SET NULL;
ALTER TABLE task ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0;
ALTER TABLE task ADD COLUMN IF NOT EXISTS status_option_id BIGINT REFERENCES board_column_options(id) ON DELETE SET NULL;
ALTER TABLE task ADD COLUMN IF NOT EXISTS priority_option_id BIGINT REFERENCES board_column_options(id) ON DELETE SET NULL;
ALTER TABLE task ADD COLUMN IF NOT EXISTS progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100);
ALTER TABLE task ADD COLUMN IF NOT EXISTS budget NUMERIC(14,2);
ALTER TABLE task ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE task ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE task ADD COLUMN IF NOT EXISTS deleted_by BIGINT REFERENCES users(id);
ALTER TABLE task ADD COLUMN IF NOT EXISTS purge_after TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS task_assignees (
    task_id BIGINT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by BIGINT REFERENCES users(id),
    PRIMARY KEY (task_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_custom_values (
    task_id BIGINT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    column_id BIGINT NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
    value JSONB NOT NULL DEFAULT 'null',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (task_id, column_id)
);

CREATE TABLE IF NOT EXISTS task_updates (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    deleted_by BIGINT REFERENCES users(id),
    purge_after TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS task_update_mentions (
    update_id BIGINT NOT NULL REFERENCES task_updates(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (update_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_files (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    update_id BIGINT REFERENCES task_updates(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(255),
    size_bytes BIGINT NOT NULL DEFAULT 0,
    uploaded_by BIGINT NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by BIGINT REFERENCES users(id),
    purge_after TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS task_activity (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES task(id) ON DELETE CASCADE,
    board_id BIGINT REFERENCES boards(id) ON DELETE CASCADE,
    actor_id BIGINT NOT NULL REFERENCES users(id),
    event_type VARCHAR(80) NOT NULL,
    field_key VARCHAR(120),
    old_value JSONB,
    new_value JSONB,
    visibility VARCHAR(20) NOT NULL DEFAULT 'internal'
        CHECK (visibility IN ('user', 'internal')),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_views (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(40) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    config JSONB NOT NULL DEFAULT '{}',
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by BIGINT REFERENCES users(id),
    purge_after TIMESTAMPTZ
);

INSERT INTO board_member (board_id, user_id, role_in_board, assigned_by)
SELECT b.id, wm.user_id,
       CASE WHEN wm.role_in_workspace = 'owner' THEN 'owner'
            WHEN wm.role_in_workspace = 'viewer' THEN 'viewer'
            ELSE 'editor' END,
       w.created_by
FROM boards b
JOIN workspaces w ON w.id = b.workspace_id
JOIN workspace_member wm ON wm.workspace_id = w.id
ON CONFLICT (board_id, user_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_boards_workspace_position ON boards(workspace_id, position);
CREATE INDEX IF NOT EXISTS idx_board_member_board ON board_member(board_id);
CREATE INDEX IF NOT EXISTS idx_board_member_user ON board_member(user_id);
CREATE INDEX IF NOT EXISTS idx_task_groups_board_position ON task_groups(board_id, position);
CREATE INDEX IF NOT EXISTS idx_board_columns_board_position ON board_columns(board_id, position);
CREATE INDEX IF NOT EXISTS idx_board_column_options_column_position ON board_column_options(column_id, position);
CREATE INDEX IF NOT EXISTS idx_task_group_position ON task(group_id, position);
CREATE INDEX IF NOT EXISTS idx_task_completed_at ON task(completed_at);
CREATE INDEX IF NOT EXISTS idx_task_first_started_at ON task(first_started_at);
CREATE INDEX IF NOT EXISTS idx_task_last_reopened_at ON task(last_reopened_at);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_task_updates_task_created ON task_updates(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_files_task ON task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_task_created ON task_activity(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_activity_board_created ON task_activity(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_activity_board_event_created ON task_activity(board_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_activity_field_created ON task_activity(field_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_views_board_position ON board_views(board_id, position);

-- Ensure the demo admin has explicit board access.

INSERT INTO workspace_member (workspace_id, user_id, role_in_workspace)
SELECT w.id, u.id, 'owner'
FROM workspaces w
JOIN users u ON u.email = 'admin1@gmail.com'
WHERE NOT EXISTS (
    SELECT 1
    FROM workspace_member wm
    WHERE wm.workspace_id = w.id
      AND wm.user_id = u.id
);

INSERT INTO board_member (board_id, user_id, role_in_board, assigned_by)
SELECT b.id, admin_user.id, 'owner', COALESCE(w.created_by, admin_user.id)
FROM boards b
JOIN workspaces w ON w.id = b.workspace_id
JOIN users admin_user ON admin_user.email = 'admin1@gmail.com'
ON CONFLICT (board_id, user_id) DO UPDATE SET
    role_in_board = 'owner',
    deleted_at = NULL,
    deleted_by = NULL,
    purge_after = NULL;


-- Backfill default task groups for boards created before task_groups existed.

INSERT INTO task_groups (board_id, name, color, position)
SELECT b.id, 'Tasks', b.color, 0
FROM boards b
WHERE NOT EXISTS (
    SELECT 1
    FROM task_groups tg
    WHERE tg.board_id = b.id
      AND tg.deleted_at IS NULL
);

UPDATE task t
SET group_id = first_group.id,
    position = ranked.position,
    updated_at = NOW()
FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY board_id ORDER BY created_at ASC, id ASC) - 1 AS position
    FROM task
    WHERE group_id IS NULL
) ranked
JOIN LATERAL (
    SELECT tg.id
    FROM task_groups tg
    JOIN task task_for_board ON task_for_board.id = ranked.id
    WHERE tg.board_id = task_for_board.board_id
      AND tg.deleted_at IS NULL
    ORDER BY tg.position ASC, tg.id ASC
    LIMIT 1
) first_group ON TRUE
WHERE t.id = ranked.id;


-- Rich demo data for validating Metrics observability end-to-end.
-- Demo data is intentionally always applied in fresh local/dev databases.

WITH creator AS (
    SELECT id FROM users WHERE email = 'admin1@gmail.com'
)
INSERT INTO workspaces (name, description, status, created_by, banner_image_url, budget_label, card_due_date, created_at, updated_at)
SELECT seed.name, seed.description, 'active', creator.id, NULL, seed.budget_label, CURRENT_DATE + seed.due_offset, NOW() - seed.created_offset, NOW() - seed.updated_offset
FROM creator
CROSS JOIN (
    VALUES
        ('Payments modernization rollout', 'Gateway migration, settlement reliability, and partner cutover readiness.', '180k', INTERVAL '60 days', INTERVAL '68 days', INTERVAL '2 days'),
        ('Agent productivity platform', 'Internal tools for faster case handling, workload balancing, and AI-assisted follow-up.', '95k', INTERVAL '38 days', INTERVAL '54 days', INTERVAL '1 day')
) AS seed(name, description, budget_label, due_offset, created_offset, updated_offset);

UPDATE workspaces
SET updated_at = NOW() - INTERVAL '1 day',
    card_due_date = CURRENT_DATE + INTERVAL '45 days',
    budget_label = '120k'
WHERE name = 'Customer wayfinding and mobile ticketing';

INSERT INTO workspace_member (workspace_id, user_id, role_in_workspace)
SELECT w.id, u.id,
       CASE
           WHEN u.email = 'admin1@gmail.com' THEN 'owner'
           WHEN u.email = 'lead1@gmail.com' THEN 'collaborator'
           WHEN u.email = 'alumni1@gmail.com' THEN 'viewer'
           ELSE 'collaborator'
       END
FROM workspaces w
JOIN users u ON u.email IN ('admin1@gmail.com', 'lead1@gmail.com', 'developer1@gmail.com', 'developer2@gmail.com', 'alumni1@gmail.com')
WHERE w.name IN ('Payments modernization rollout', 'Agent productivity platform')
ON CONFLICT (workspace_id, user_id) DO NOTHING;

INSERT INTO boards (workspace_id, name, description, color, created_at, updated_at)
SELECT w.id, seed.name, seed.description, seed.color, NOW() - seed.created_offset, NOW() - seed.updated_offset
FROM workspaces w
CROSS JOIN (
    VALUES
        ('Release', 'Launch readiness and production cutover', '#6A1B9A', INTERVAL '39 days', INTERVAL '1 day')
) AS seed(name, description, color, created_offset, updated_offset)
WHERE w.name = 'Customer wayfinding and mobile ticketing'
  AND NOT EXISTS (
      SELECT 1 FROM boards b WHERE b.workspace_id = w.id AND b.name = seed.name
  );

INSERT INTO boards (workspace_id, name, description, color, created_at, updated_at)
SELECT w.id, seed.name, seed.description, seed.color, NOW() - seed.created_offset, NOW() - seed.updated_offset
FROM workspaces w
JOIN (
    VALUES
        ('Payments modernization rollout', 'Planning', 'Scope, dependencies, and cutover sequencing', '#5F0229', INTERVAL '66 days', INTERVAL '2 days'),
        ('Payments modernization rollout', 'Delivery', 'Gateway migration and reconciliation build-out', '#1976D2', INTERVAL '62 days', INTERVAL '1 day'),
        ('Payments modernization rollout', 'Review', 'Certification, QA, and release acceptance', '#F59E0B', INTERVAL '55 days', INTERVAL '1 day'),
        ('Agent productivity platform', 'Planning', 'Product discovery and operating model', '#5F0229', INTERVAL '52 days', INTERVAL '3 days'),
        ('Agent productivity platform', 'Delivery', 'Workflow automation and AI assistant implementation', '#1976D2', INTERVAL '49 days', INTERVAL '1 day'),
        ('Agent productivity platform', 'Review', 'Adoption validation, security review, and enablement', '#2E7D32', INTERVAL '44 days', INTERVAL '2 days')
) AS seed(workspace_name, name, description, color, created_offset, updated_offset)
    ON seed.workspace_name = w.name;

INSERT INTO board_member (board_id, user_id, role_in_board, assigned_by)
SELECT b.id, wm.user_id,
       CASE WHEN wm.role_in_workspace = 'owner' THEN 'owner'
            WHEN wm.role_in_workspace = 'viewer' THEN 'viewer'
            ELSE 'editor' END,
       w.created_by
FROM boards b
JOIN workspaces w ON w.id = b.workspace_id
JOIN workspace_member wm ON wm.workspace_id = w.id
WHERE w.name IN ('Customer wayfinding and mobile ticketing', 'Payments modernization rollout', 'Agent productivity platform')
ON CONFLICT (board_id, user_id) DO NOTHING;

INSERT INTO task_groups (board_id, name, color, position)
SELECT b.id, seed.name, seed.color, seed.position
FROM boards b
JOIN workspaces w ON w.id = b.workspace_id
CROSS JOIN (
    VALUES
        ('Backlog', '#B3B3B3', 0),
        ('Current sprint', '#5F0229', 1),
        ('Validation', '#1976D2', 2),
        ('Released', '#2E7D32', 3)
) AS seed(name, color, position)
WHERE w.name IN ('Customer wayfinding and mobile ticketing', 'Payments modernization rollout', 'Agent productivity platform')
  AND NOT EXISTS (
      SELECT 1 FROM task_groups g WHERE g.board_id = b.id AND g.name = seed.name AND g.deleted_at IS NULL
  );

INSERT INTO board_columns (board_id, key, label, type, width, visible, position, system_column, settings)
SELECT b.id, seed.key, seed.label, seed.type, seed.width, TRUE, seed.position, seed.system_column, seed.settings::jsonb
FROM boards b
JOIN workspaces w ON w.id = b.workspace_id
CROSS JOIN (
    VALUES
        ('col_status', 'Status', 'status', 160, 0, TRUE, '{}'),
        ('col_priority', 'Priority', 'priority', 140, 1, TRUE, '{}'),
        ('col_due_date', 'Due Date', 'date', 150, 2, TRUE, '{}'),
        ('col_progress', 'Progress', 'progress', 140, 3, TRUE, '{}'),
        ('col_budget', 'Budget', 'budget', 140, 4, TRUE, '{}'),
        ('col_story_points', 'Story points', 'number', 130, 5, FALSE, '{}'),
        ('col_budget_spent', 'Budget spent', 'currency', 140, 6, FALSE, '{}'),
        ('col_workstream', 'Workstream', 'singleSelect', 160, 7, FALSE, '{}'),
        ('col_risk_level', 'Risk level', 'singleSelect', 140, 8, FALSE, '{}'),
        ('col_tags', 'Tags', 'multiSelect', 180, 9, FALSE, '{}'),
        ('col_needs_vendor', 'Needs vendor', 'checkbox', 130, 10, FALSE, '{}'),
        ('col_confidence', 'Confidence', 'percentage', 130, 11, FALSE, '{}')
) AS seed(key, label, type, width, position, system_column, settings)
WHERE w.name IN ('Customer wayfinding and mobile ticketing', 'Payments modernization rollout', 'Agent productivity platform')
ON CONFLICT (board_id, key) DO UPDATE SET
    label = EXCLUDED.label,
    type = EXCLUDED.type,
    width = EXCLUDED.width,
    visible = EXCLUDED.visible,
    position = EXCLUDED.position,
    system_column = EXCLUDED.system_column,
    settings = EXCLUDED.settings,
    updated_at = NOW();

INSERT INTO board_column_options (column_id, key, label, color, workflow_meaning, position)
SELECT c.id, seed.key, seed.label, seed.color, seed.workflow_meaning, seed.position
FROM board_columns c
JOIN boards b ON b.id = c.board_id
JOIN workspaces w ON w.id = b.workspace_id
CROSS JOIN (
    VALUES
        ('backlog', 'Backlog', '#B3B3B3', 'new', 0),
        ('ready', 'Ready', '#8E44AD', 'new', 1),
        ('in_dev', 'In development', '#1976D2', 'in_progress', 2),
        ('qa', 'QA', '#F59E0B', 'in_progress', 3),
        ('blocked', 'Blocked', '#D32F2F', 'none', 4),
        ('deferred', 'Deferred', '#64748B', 'none', 5),
        ('done', 'Done', '#2E7D32', 'done', 6),
        ('released', 'Released', '#4CAF50', 'done', 7)
) AS seed(key, label, color, workflow_meaning, position)
WHERE c.key = 'col_status'
  AND w.name IN ('Customer wayfinding and mobile ticketing', 'Payments modernization rollout', 'Agent productivity platform')
  AND NOT (w.name = 'Payments modernization rollout' AND b.name = 'Review' AND seed.workflow_meaning = 'done')
ON CONFLICT (column_id, key) DO UPDATE SET
    label = EXCLUDED.label,
    color = EXCLUDED.color,
    workflow_meaning = EXCLUDED.workflow_meaning,
    position = EXCLUDED.position;

INSERT INTO board_column_options (column_id, key, label, color, position)
SELECT c.id, seed.key, seed.label, seed.color, seed.position
FROM board_columns c
CROSS JOIN (
    VALUES
        ('critical', 'Critical', '#D32F2F', 0),
        ('high', 'High', '#F59E0B', 1),
        ('medium', 'Medium', '#1976D2', 2),
        ('low', 'Low', '#2E7D32', 3)
) AS seed(key, label, color, position)
WHERE c.key = 'col_priority'
ON CONFLICT (column_id, key) DO UPDATE SET
    label = EXCLUDED.label,
    color = EXCLUDED.color,
    position = EXCLUDED.position;

INSERT INTO board_column_options (column_id, key, label, color, position)
SELECT c.id, seed.key, seed.label, seed.color, seed.position
FROM board_columns c
CROSS JOIN (
    VALUES
        ('mobile', 'Mobile', '#1976D2', 0),
        ('api', 'API', '#5F0229', 1),
        ('data', 'Data', '#6A1B9A', 2),
        ('ops', 'Operations', '#2E7D32', 3),
        ('ux', 'UX', '#F59E0B', 4)
) AS seed(key, label, color, position)
WHERE c.key = 'col_workstream'
ON CONFLICT (column_id, key) DO UPDATE SET
    label = EXCLUDED.label,
    color = EXCLUDED.color,
    position = EXCLUDED.position;

INSERT INTO board_column_options (column_id, key, label, color, position)
SELECT c.id, seed.key, seed.label, seed.color, seed.position
FROM board_columns c
CROSS JOIN (
    VALUES
        ('low', 'Low', '#2E7D32', 0),
        ('medium', 'Medium', '#1976D2', 1),
        ('high', 'High', '#F59E0B', 2),
        ('critical', 'Critical', '#D32F2F', 3)
) AS seed(key, label, color, position)
WHERE c.key = 'col_risk_level'
ON CONFLICT (column_id, key) DO UPDATE SET
    label = EXCLUDED.label,
    color = EXCLUDED.color,
    position = EXCLUDED.position;

INSERT INTO board_column_options (column_id, key, label, color, position)
SELECT c.id, seed.key, seed.label, seed.color, seed.position
FROM board_columns c
CROSS JOIN (
    VALUES
        ('ux', 'UX', '#F59E0B', 0),
        ('api', 'API', '#5F0229', 1),
        ('compliance', 'Compliance', '#D32F2F', 2),
        ('performance', 'Performance', '#1976D2', 3),
        ('vendor', 'Vendor', '#6A1B9A', 4),
        ('release', 'Release', '#2E7D32', 5),
        ('automation', 'Automation', '#00897B', 6)
) AS seed(key, label, color, position)
WHERE c.key = 'col_tags'
ON CONFLICT (column_id, key) DO UPDATE SET
    label = EXCLUDED.label,
    color = EXCLUDED.color,
    position = EXCLUDED.position;

WITH task_seed AS (
    SELECT
        b.id AS board_id,
        b.name AS board_name,
        w.name AS workspace_name,
        n AS seq,
        CASE
            WHEN w.name = 'Customer wayfinding and mobile ticketing' THEN (ARRAY[
                'Validate station transfer overlay',
                'Tune ticket wallet offline fallback',
                'Instrument platform gate analytics',
                'Localize route assistance copy',
                'Harden peak load ticket scans',
                'Review release pilot checklist',
                'Map station accessibility markers',
                'Finalize queue recovery playbook'
            ])[n]
            WHEN w.name = 'Payments modernization rollout' THEN (ARRAY[
                'Reconcile partner settlement batch',
                'Certify gateway retry policy',
                'Audit payment exception queue',
                'Migrate token vault mappings',
                'Review acquirer cutover notes',
                'Backfill dispute reporting feed',
                'Load test payment callback path',
                'Document rollback controls'
            ])[n]
            ELSE (ARRAY[
                'Draft agent triage assistant prompt',
                'Build workload balancing signal',
                'Review knowledge article matcher',
                'Automate follow-up summary',
                'Pilot supervisor coaching view',
                'Tune escalation recommendation model',
                'Validate queue health dashboard',
                'Prepare adoption enablement pack'
            ])[n]
        END AS base_title
    FROM boards b
    JOIN workspaces w ON w.id = b.workspace_id
    CROSS JOIN generate_series(1, 8) AS n
    WHERE w.name IN ('Customer wayfinding and mobile ticketing', 'Payments modernization rollout', 'Agent productivity platform')
      AND b.name IN ('Planning', 'Delivery', 'Review', 'Release')
), resolved_seed AS (
    SELECT
        seed.*,
        CASE
            WHEN seed.workspace_name = 'Payments modernization rollout' AND seed.board_name = 'Review' THEN
                CASE WHEN seed.seq IN (1, 2, 3) THEN 'qa'
                     WHEN seed.seq IN (4, 5, 6) THEN 'in_dev'
                     WHEN seed.seq = 7 THEN 'blocked'
                     ELSE 'ready' END
            WHEN seed.seq IN (1, 2) THEN 'done'
            WHEN seed.seq = 3 THEN 'released'
            WHEN seed.seq IN (4, 5) THEN 'qa'
            WHEN seed.seq = 6 THEN 'in_dev'
            WHEN seed.seq = 7 THEN 'ready'
            ELSE 'blocked'
        END AS status_key,
        CASE
            WHEN seed.seq IN (1, 6) THEN 'critical'
            WHEN seed.seq IN (2, 5, 8) THEN 'high'
            WHEN seed.seq IN (3, 4) THEN 'medium'
            ELSE 'low'
        END AS priority_key,
        CASE
            WHEN seed.seq IN (1, 2, 3) THEN NOW() - ((68 - seed.seq * 7) || ' days')::interval
            WHEN seed.seq IN (4, 5, 6) THEN NOW() - ((32 - seed.seq) || ' days')::interval
            ELSE NOW() - ((12 - seed.seq) || ' days')::interval
        END AS created_at,
        CASE
            WHEN seed.seq IN (1, 2, 3) THEN NOW() - ((58 - seed.seq * 7) || ' days')::interval
            WHEN seed.seq IN (4, 5, 6) THEN NOW() - ((22 - seed.seq) || ' days')::interval
            ELSE NULL
        END AS first_started_at,
        CASE
            WHEN seed.seq IN (1, 2, 3)
              AND NOT (seed.workspace_name = 'Payments modernization rollout' AND seed.board_name = 'Review')
                THEN NOW() - ((50 - seed.seq * 6) || ' days')::interval
            ELSE NULL
        END AS completed_at,
        CASE
            WHEN seed.seq = 8 THEN NOW() - INTERVAL '16 days'
            WHEN seed.seq IN (4, 5) THEN NOW() - ((9 - seed.seq) || ' days')::interval
            ELSE NOW() - ((3 + seed.seq) || ' days')::interval
        END AS updated_at,
        CASE
            WHEN seed.seq = 1 THEN NOW() - INTERVAL '5 days'
            WHEN seed.seq = 2 THEN NOW() - INTERVAL '1 day'
            WHEN seed.seq = 4 THEN NOW() + INTERVAL '3 days'
            WHEN seed.seq = 5 THEN NOW() + INTERVAL '7 days'
            WHEN seed.seq = 8 THEN NOW() - INTERVAL '10 days'
            ELSE NOW() + ((10 + seed.seq) || ' days')::interval
        END AS due_date,
        CASE seed.seq WHEN 1 THEN 92 WHEN 2 THEN 100 WHEN 3 THEN 100 WHEN 4 THEN 62 WHEN 5 THEN 48 WHEN 6 THEN 35 WHEN 7 THEN 12 ELSE 8 END AS progress,
        CASE seed.seq WHEN 1 THEN 18200 WHEN 2 THEN 8400 WHEN 3 THEN 12100 WHEN 4 THEN 15600 WHEN 5 THEN 9600 WHEN 6 THEN 22100 WHEN 7 THEN 5200 ELSE 3100 END AS budget,
        CASE seed.seq WHEN 1 THEN 50 WHEN 2 THEN 25 WHEN 3 THEN 25 WHEN 4 THEN 50 WHEN 5 THEN 25 WHEN 6 THEN 100 WHEN 7 THEN 10 ELSE 10 END AS points_value
    FROM task_seed seed
), inserted_tasks AS (
    INSERT INTO task (
        board_id,
        title,
        description,
        status,
        priority,
        points_value,
        due_date,
        created_by,
        assigned_to,
        created_at,
        updated_at,
        group_id,
        position,
        status_option_id,
        priority_option_id,
        progress,
        budget,
        first_started_at,
        completed_at,
        last_reopened_at
    )
    SELECT
        seed.board_id,
        seed.base_title || ' - ' || seed.board_name,
        'Metrics demo task for ' || seed.workspace_name || ' / ' || seed.board_name || '.',
        seed.status_key,
        seed.priority_key,
        seed.points_value,
        seed.due_date,
        creator.id,
        CASE
            WHEN seed.seq = 8 THEN NULL
            WHEN seed.seq % 2 = 0 THEN developer2.id
            ELSE developer1.id
        END,
        seed.created_at,
        seed.updated_at,
        groups.id,
        seed.seq - 1,
        status_option.id,
        priority_option.id,
        seed.progress,
        seed.budget,
        seed.first_started_at,
        seed.completed_at,
        CASE WHEN seed.seq = 6 THEN NOW() - INTERVAL '6 days' ELSE NULL END
    FROM resolved_seed seed
    JOIN users creator ON creator.email = 'admin1@gmail.com'
    JOIN users developer1 ON developer1.email = 'developer1@gmail.com'
    JOIN users developer2 ON developer2.email = 'developer2@gmail.com'
    JOIN task_groups groups ON groups.board_id = seed.board_id
        AND groups.name = CASE
            WHEN seed.status_key IN ('done', 'released') THEN 'Released'
            WHEN seed.status_key = 'qa' THEN 'Validation'
            WHEN seed.status_key IN ('in_dev', 'blocked') THEN 'Current sprint'
            ELSE 'Backlog'
        END
    JOIN board_columns status_column ON status_column.board_id = seed.board_id AND status_column.key = 'col_status'
    JOIN board_column_options status_option ON status_option.column_id = status_column.id AND status_option.key = seed.status_key
    JOIN board_columns priority_column ON priority_column.board_id = seed.board_id AND priority_column.key = 'col_priority'
    JOIN board_column_options priority_option ON priority_option.column_id = priority_column.id AND priority_option.key = seed.priority_key
    RETURNING id, board_id, title, created_at, first_started_at, completed_at, updated_at, assigned_to, created_by, status, priority, progress, budget
)
INSERT INTO task_assignees (task_id, user_id, assigned_at, assigned_by)
SELECT id, assigned_to, created_at + INTERVAL '1 day', created_by
FROM inserted_tasks
WHERE assigned_to IS NOT NULL
ON CONFLICT (task_id, user_id) DO NOTHING;

INSERT INTO task_custom_values (task_id, column_id, value, updated_at)
SELECT t.id, c.id,
       CASE c.key
           WHEN 'col_story_points' THEN to_jsonb(CASE WHEN t.progress >= 90 THEN 8 WHEN t.priority = 'critical' THEN 13 WHEN t.priority = 'high' THEN 8 WHEN t.priority = 'medium' THEN 5 ELSE 3 END)
           WHEN 'col_budget_spent' THEN to_jsonb((COALESCE(t.budget, 0) * (0.35 + (t.progress / 140.0)))::numeric(14,2))
           WHEN 'col_workstream' THEN to_jsonb(CASE
               WHEN t.title ILIKE '%ticket%' OR t.title ILIKE '%assistant%' THEN 'mobile'
               WHEN t.title ILIKE '%gateway%' OR t.title ILIKE '%callback%' THEN 'api'
               WHEN t.title ILIKE '%analytics%' OR t.title ILIKE '%reporting%' THEN 'data'
               WHEN t.title ILIKE '%release%' OR t.title ILIKE '%cutover%' THEN 'ops'
               ELSE 'ux'
           END)
           WHEN 'col_risk_level' THEN to_jsonb(CASE WHEN t.priority = 'critical' THEN 'critical' WHEN t.priority = 'high' THEN 'high' WHEN t.priority = 'medium' THEN 'medium' ELSE 'low' END)
           WHEN 'col_tags' THEN to_jsonb(CASE
               WHEN t.priority = 'critical' THEN ARRAY['compliance', 'performance']
               WHEN t.title ILIKE '%vendor%' OR t.title ILIKE '%partner%' THEN ARRAY['vendor', 'api']
               WHEN t.title ILIKE '%release%' OR t.title ILIKE '%cutover%' THEN ARRAY['release', 'ops']
               WHEN t.title ILIKE '%assistant%' OR t.title ILIKE '%automation%' THEN ARRAY['automation', 'ux']
               ELSE ARRAY['ux', 'api']
           END)
           WHEN 'col_needs_vendor' THEN to_jsonb(t.title ILIKE '%partner%' OR t.title ILIKE '%gateway%' OR t.priority = 'critical')
           WHEN 'col_confidence' THEN to_jsonb(CASE WHEN t.progress >= 90 THEN 92 WHEN t.priority = 'critical' THEN 58 WHEN t.priority = 'high' THEN 71 WHEN t.priority = 'medium' THEN 79 ELSE 86 END)
           ELSE 'null'::jsonb
       END,
       NOW()
FROM task t
JOIN boards b ON b.id = t.board_id
JOIN workspaces w ON w.id = b.workspace_id
JOIN board_columns c ON c.board_id = b.id
WHERE w.name IN ('Customer wayfinding and mobile ticketing', 'Payments modernization rollout', 'Agent productivity platform')
  AND t.description LIKE 'Metrics demo task%'
  AND c.key IN ('col_story_points', 'col_budget_spent', 'col_workstream', 'col_risk_level', 'col_tags', 'col_needs_vendor', 'col_confidence')
ON CONFLICT (task_id, column_id) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;

INSERT INTO task_activity (task_id, board_id, actor_id, event_type, field_key, old_value, new_value, visibility, metadata, created_at)
SELECT t.id, t.board_id, t.created_by, 'task.created', NULL, NULL, to_jsonb(t.title), 'internal', jsonb_build_object('source', 'metrics_demo'), t.created_at
FROM task t
WHERE t.description LIKE 'Metrics demo task%';

INSERT INTO task_activity (task_id, board_id, actor_id, event_type, field_key, old_value, new_value, visibility, metadata, created_at)
SELECT t.id, t.board_id, t.created_by, 'task.status_changed', 'status', to_jsonb('backlog'::text), to_jsonb(t.status), 'internal', jsonb_build_object('source', 'metrics_demo'), COALESCE(t.first_started_at, t.updated_at)
FROM task t
WHERE t.description LIKE 'Metrics demo task%'
  AND t.status IN ('in_dev', 'qa', 'done', 'released', 'blocked');

INSERT INTO task_activity (task_id, board_id, actor_id, event_type, field_key, old_value, new_value, visibility, metadata, created_at)
SELECT t.id, t.board_id, t.created_by, 'task.completed', 'status', to_jsonb('qa'::text), to_jsonb(t.status), 'internal', jsonb_build_object('source', 'metrics_demo'), t.completed_at
FROM task t
WHERE t.description LIKE 'Metrics demo task%'
  AND t.completed_at IS NOT NULL;

INSERT INTO task_activity (task_id, board_id, actor_id, event_type, field_key, old_value, new_value, visibility, metadata, created_at)
SELECT t.id, t.board_id, t.created_by, 'task.priority_changed', 'priority', to_jsonb('medium'::text), to_jsonb(t.priority), 'internal', jsonb_build_object('source', 'metrics_demo'), t.updated_at - INTERVAL '1 day'
FROM task t
WHERE t.description LIKE 'Metrics demo task%'
  AND t.priority IN ('critical', 'high');

INSERT INTO task_activity (task_id, board_id, actor_id, event_type, field_key, old_value, new_value, visibility, metadata, created_at)
SELECT t.id, t.board_id, t.created_by, 'task.reopened', 'status', to_jsonb('done'::text), to_jsonb(t.status), 'internal', jsonb_build_object('source', 'metrics_demo'), t.last_reopened_at
FROM task t
WHERE t.description LIKE 'Metrics demo task%'
  AND t.last_reopened_at IS NOT NULL;

INSERT INTO metric_dashboards (user_id, name, scope_type, scope_id, is_default, visibility, config, created_at, updated_at)
SELECT lead.id,
       'Lead Weekly Delivery Review',
       'global',
       NULL,
       TRUE,
       'private',
       jsonb_build_object(
           'filters', jsonb_build_object('workspaceIds', jsonb_build_array((SELECT id::text FROM workspaces WHERE name = 'Customer wayfinding and mobile ticketing'), (SELECT id::text FROM workspaces WHERE name = 'Agent productivity platform'))),
           'widgets', jsonb_build_array(
               jsonb_build_object('id','demo-completion','title','Completion Rate','metric','completion_rate','dimension','none','visualization','kpi','includeComparison',true,'layout',jsonb_build_object('x',0,'y',0,'w',3,'h',3)),
               jsonb_build_object('id','demo-open-board','title','Open Tasks by Board','metric','open_tasks','dimension','board','visualization','bar','layout',jsonb_build_object('x',3,'y',0,'w',5,'h',3)),
               jsonb_build_object('id','demo-created-completed','title','Created vs Completed','metric','created_vs_completed','dimension','none','visualization','line','layout',jsonb_build_object('x',8,'y',0,'w',4,'h',3)),
               jsonb_build_object('id','demo-progress','title','Average Progress by Workspace','metric','average_progress','dimension','workspace','visualization','bar','layout',jsonb_build_object('x',0,'y',3,'w',6,'h',3))
           )
       ),
       NOW() - INTERVAL '3 days',
       NOW() - INTERVAL '1 day'
FROM users lead
WHERE lead.email = 'lead1@gmail.com';

INSERT INTO metric_dashboards (user_id, name, scope_type, scope_id, is_default, visibility, config, created_at, updated_at)
SELECT lead.id,
       'Risk Control Room',
       'workspace',
       payments.id,
       FALSE,
       'private',
       jsonb_build_object(
           'filters', jsonb_build_object('workspaceIds', jsonb_build_array(payments.id::text)),
           'widgets', jsonb_build_array(
               jsonb_build_object('id','risk-overdue','title','Overdue Tasks','metric','overdue_tasks','dimension','none','visualization','kpi','includeComparison',true,'layout',jsonb_build_object('x',0,'y',0,'w',3,'h',3)),
               jsonb_build_object('id','risk-stale','title','Stale by Board','metric','stale_tasks','dimension','board','visualization','bar','layout',jsonb_build_object('x',3,'y',0,'w',5,'h',3)),
               jsonb_build_object('id','risk-cycle','title','P90 Cycle Time by Board','metric','p90_cycle_time','dimension','board','visualization','bar','layout',jsonb_build_object('x',8,'y',0,'w',4,'h',3))
           )
       ),
       NOW() - INTERVAL '2 days',
       NOW() - INTERVAL '12 hours'
FROM users lead
JOIN workspaces payments ON payments.name = 'Payments modernization rollout'
WHERE lead.email = 'lead1@gmail.com';

INSERT INTO metric_dashboards (user_id, name, scope_type, scope_id, is_default, visibility, config, created_at, updated_at)
SELECT developer.id,
       'Developer Personal Flow',
       'global',
       NULL,
       FALSE,
       'private',
       jsonb_build_object(
           'filters', jsonb_build_object('assigneeId', developer.id::text),
           'widgets', jsonb_build_array(
               jsonb_build_object('id','dev-open','title','My Open Tasks','metric','open_tasks','dimension','priority','visualization','bar','layout',jsonb_build_object('x',0,'y',0,'w',4,'h',3))
           )
       ),
       NOW() - INTERVAL '1 day',
       NOW() - INTERVAL '1 day'
FROM users developer
WHERE developer.email = 'developer1@gmail.com';

INSERT INTO metric_preset_overrides (user_id, preset_id, config, created_at, updated_at)
SELECT lead.id,
       'delivery',
       jsonb_build_object(
           'widgets', jsonb_build_array(
               jsonb_build_object('id','completion_rate-none-0-0','title','Completion Rate','metric','completion_rate','dimension','none','visualization','kpi','includeComparison',true,'layout',jsonb_build_object('x',0,'y',0,'w',3,'h',3)),
               jsonb_build_object('id','open_tasks-board-3-0','title','Open Tasks by Board','metric','open_tasks','dimension','board','visualization','bar','includeComparison',false,'layout',jsonb_build_object('x',3,'y',0,'w',6,'h',3)),
               jsonb_build_object('id','average_progress-workspace-0-3','title','Average Progress by Workspace','metric','average_progress','dimension','workspace','visualization','bar','includeComparison',false,'layout',jsonb_build_object('x',0,'y',3,'w',7,'h',3)),
               jsonb_build_object('id','created_vs_completed-none-7-3','title','Created vs Completed','metric','created_vs_completed','dimension','none','visualization','line','includeComparison',false,'layout',jsonb_build_object('x',7,'y',3,'w',5,'h',3))
           )
       ),
       NOW() - INTERVAL '1 day',
       NOW() - INTERVAL '1 day'
FROM users lead
WHERE lead.email = 'lead1@gmail.com'
ON CONFLICT (user_id, preset_id) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = EXCLUDED.updated_at;

SELECT setval(pg_get_serial_sequence('workspaces', 'id'), (SELECT COALESCE(MAX(id), 1) FROM workspaces));
SELECT setval(pg_get_serial_sequence('boards', 'id'), (SELECT COALESCE(MAX(id), 1) FROM boards));
SELECT setval(pg_get_serial_sequence('task_groups', 'id'), (SELECT COALESCE(MAX(id), 1) FROM task_groups));
SELECT setval(pg_get_serial_sequence('board_columns', 'id'), (SELECT COALESCE(MAX(id), 1) FROM board_columns));
SELECT setval(pg_get_serial_sequence('board_column_options', 'id'), (SELECT COALESCE(MAX(id), 1) FROM board_column_options));
SELECT setval(pg_get_serial_sequence('task', 'id'), (SELECT COALESCE(MAX(id), 1) FROM task));
SELECT setval(pg_get_serial_sequence('task_activity', 'id'), (SELECT COALESCE(MAX(id), 1) FROM task_activity));
SELECT setval(pg_get_serial_sequence('metric_dashboards', 'id'), (SELECT COALESCE(MAX(id), 1) FROM metric_dashboards));
SELECT setval(pg_get_serial_sequence('metric_preset_overrides', 'id'), (SELECT COALESCE(MAX(id), 1) FROM metric_preset_overrides));

-- Refine Metrics demo tasks so board, drilldown, assignee filters, and My Tasks
-- have realistic task names and ownership data to display.

WITH demo_tasks AS (
    SELECT
        t.id,
        t.board_id,
        b.name AS board_name,
        w.name AS workspace_name,
        row_number() OVER (PARTITION BY t.board_id ORDER BY t.position, t.id) AS seq
    FROM task t
    JOIN boards b ON b.id = t.board_id
    JOIN workspaces w ON w.id = b.workspace_id
    WHERE t.description LIKE 'Metrics demo task%'
      AND w.name IN (
          'Customer wayfinding and mobile ticketing',
          'Payments modernization rollout',
          'Agent productivity platform'
      )
),
named_tasks AS (
    SELECT
        demo_tasks.id,
        CASE
            WHEN workspace_name = 'Customer wayfinding and mobile ticketing' THEN
                CASE seq
                    WHEN 1 THEN 'Transit UX-101 Validate station transfer overlay'
                    WHEN 2 THEN 'Transit UX-118 Tune ticket wallet offline fallback'
                    WHEN 3 THEN 'Transit DATA-204 Instrument platform gate analytics'
                    WHEN 4 THEN 'Transit WEB-143 Localize route assistance copy'
                    WHEN 5 THEN 'Transit OPS-177 Harden peak load ticket scans'
                    WHEN 6 THEN 'Transit REL-220 Review release pilot checklist'
                    WHEN 7 THEN 'Transit MAP-156 Map station accessibility markers'
                    ELSE 'Transit OPS-190 Finalize queue recovery playbook'
                END
            WHEN workspace_name = 'Payments modernization rollout' THEN
                CASE seq
                    WHEN 1 THEN 'Payments FIN-301 Reconcile partner settlement batch'
                    WHEN 2 THEN 'Payments API-327 Certify gateway retry policy'
                    WHEN 3 THEN 'Payments RISK-288 Audit payment exception queue'
                    WHEN 4 THEN 'Payments SEC-340 Migrate token vault mappings'
                    WHEN 5 THEN 'Payments REL-314 Review acquirer cutover notes'
                    WHEN 6 THEN 'Payments DATA-352 Backfill dispute reporting feed'
                    WHEN 7 THEN 'Payments PERF-366 Load test payment callback path'
                    ELSE 'Payments GOV-390 Document rollback controls'
                END
            ELSE
                CASE seq
                    WHEN 1 THEN 'Agent AI-411 Draft triage assistant prompt'
                    WHEN 2 THEN 'Agent OPS-426 Build workload balancing signal'
                    WHEN 3 THEN 'Agent KB-438 Review knowledge article matcher'
                    WHEN 4 THEN 'Agent AUTO-452 Automate follow-up summary'
                    WHEN 5 THEN 'Agent LEAD-470 Pilot supervisor coaching view'
                    WHEN 6 THEN 'Agent ML-486 Tune escalation recommendation model'
                    WHEN 7 THEN 'Agent OBS-501 Validate queue health dashboard'
                    ELSE 'Agent EDU-520 Prepare adoption enablement pack'
                END
        END || ' [' || board_name || ']' AS title,
        CASE
            WHEN seq IN (1, 4, 7) THEN dev1.id
            WHEN seq IN (2, 5) THEN dev2.id
            WHEN seq = 3 THEN lead.id
            WHEN seq = 6 THEN admin_user.id
            ELSE NULL
        END AS primary_assignee_id,
        admin_user.id AS assigned_by
    FROM demo_tasks
    JOIN users admin_user ON admin_user.email = 'admin1@gmail.com'
    JOIN users lead ON lead.email = 'lead1@gmail.com'
    JOIN users dev1 ON dev1.email = 'developer1@gmail.com'
    JOIN users dev2 ON dev2.email = 'developer2@gmail.com'
)
UPDATE task t
SET title = named.title,
    assigned_to = named.primary_assignee_id,
    updated_at = NOW()
FROM named_tasks named
WHERE t.id = named.id;

WITH demo_tasks AS (
    SELECT
        t.id,
        t.created_at,
        t.created_by,
        t.assigned_to,
        b.name AS board_name,
        w.name AS workspace_name,
        row_number() OVER (PARTITION BY t.board_id ORDER BY t.position, t.id) AS seq
    FROM task t
    JOIN boards b ON b.id = t.board_id
    JOIN workspaces w ON w.id = b.workspace_id
    WHERE t.description LIKE 'Metrics demo task%'
      AND w.name IN (
          'Customer wayfinding and mobile ticketing',
          'Payments modernization rollout',
          'Agent productivity platform'
      )
),
assignment_seed AS (
    SELECT t.id AS task_id, t.assigned_to AS user_id, t.created_at + INTERVAL '1 day' AS assigned_at, t.created_by AS assigned_by
    FROM demo_tasks t
    WHERE t.assigned_to IS NOT NULL

    UNION ALL

    SELECT t.id, dev2.id, t.created_at + INTERVAL '2 days', t.created_by
    FROM demo_tasks t
    JOIN users dev2 ON dev2.email = 'developer2@gmail.com'
    WHERE t.seq IN (1, 4)

    UNION ALL

    SELECT t.id, dev1.id, t.created_at + INTERVAL '2 days', t.created_by
    FROM demo_tasks t
    JOIN users dev1 ON dev1.email = 'developer1@gmail.com'
    WHERE t.seq IN (2, 5, 6)

    UNION ALL

    SELECT t.id, lead.id, t.created_at + INTERVAL '3 days', t.created_by
    FROM demo_tasks t
    JOIN users lead ON lead.email = 'lead1@gmail.com'
    WHERE t.seq IN (6, 7)
)
INSERT INTO task_assignees (task_id, user_id, assigned_at, assigned_by)
SELECT DISTINCT task_id, user_id, assigned_at, assigned_by
FROM assignment_seed
WHERE user_id IS NOT NULL
ON CONFLICT (task_id, user_id) DO UPDATE SET
    assigned_at = EXCLUDED.assigned_at,
    assigned_by = EXCLUDED.assigned_by;

INSERT INTO task_activity (task_id, board_id, actor_id, event_type, field_key, old_value, new_value, visibility, metadata, created_at)
SELECT t.id,
       t.board_id,
       t.created_by,
       'task.assignee_changed',
       'assignees',
       NULL,
       to_jsonb(assignee_names.names),
       'internal',
       jsonb_build_object('source', 'metrics_demo_refinement'),
       t.created_at + INTERVAL '1 day'
FROM task t
JOIN LATERAL (
    SELECT string_agg(u.name, ', ' ORDER BY u.name) AS names
    FROM task_assignees ta
    JOIN users u ON u.id = ta.user_id
    WHERE ta.task_id = t.id
) assignee_names ON assignee_names.names IS NOT NULL
WHERE t.description LIKE 'Metrics demo task%'
  AND NOT EXISTS (
      SELECT 1
      FROM task_activity a
      WHERE a.task_id = t.id
        AND a.event_type = 'task.assignee_changed'
        AND a.metadata ->> 'source' = 'metrics_demo_refinement'
  );

SELECT setval(pg_get_serial_sequence('task_activity', 'id'), (SELECT COALESCE(MAX(id), 1) FROM task_activity));

-- Metrics demo boards include rich custom columns and task-board
-- system columns that render task titles, assignees, and due dates in the table UI.

WITH demo_boards AS (
    SELECT b.id AS board_id
    FROM boards b
    JOIN workspaces w ON w.id = b.workspace_id
    WHERE w.name IN (
        'Customer wayfinding and mobile ticketing',
        'Payments modernization rollout',
        'Agent productivity platform'
    )
),
due_date_columns AS (
    SELECT c.id, c.board_id
    FROM board_columns c
    JOIN demo_boards db ON db.board_id = c.board_id
    WHERE c.key = 'col_due_date'
      AND NOT EXISTS (
          SELECT 1
          FROM board_columns existing
          WHERE existing.board_id = c.board_id
            AND existing.key = 'col_date'
      )
)
UPDATE board_columns c
SET key = 'col_date',
    label = 'Due Date',
    type = 'date',
    system_column = TRUE,
    visible = TRUE,
    position = 4,
    updated_at = NOW()
FROM due_date_columns d
WHERE c.id = d.id;

WITH duplicate_due_date_columns AS (
    SELECT c.id
    FROM board_columns c
    JOIN boards b ON b.id = c.board_id
    JOIN workspaces w ON w.id = b.workspace_id
    WHERE w.name IN (
        'Customer wayfinding and mobile ticketing',
        'Payments modernization rollout',
        'Agent productivity platform'
    )
      AND c.key = 'col_due_date'
      AND EXISTS (
          SELECT 1
          FROM board_columns existing
          WHERE existing.board_id = c.board_id
            AND existing.key = 'col_date'
            AND existing.deleted_at IS NULL
      )
)
UPDATE board_columns c
SET visible = FALSE,
    deleted_at = NOW(),
    purge_after = NOW() + INTERVAL '30 days',
    updated_at = NOW()
FROM duplicate_due_date_columns duplicate
WHERE c.id = duplicate.id;

WITH demo_boards AS (
    SELECT b.id AS board_id
    FROM boards b
    JOIN workspaces w ON w.id = b.workspace_id
    WHERE w.name IN (
        'Customer wayfinding and mobile ticketing',
        'Payments modernization rollout',
        'Agent productivity platform'
    )
)
UPDATE board_columns c
SET position = CASE c.key
        WHEN 'col_status' THEN 2
        WHEN 'col_priority' THEN 3
        WHEN 'col_date' THEN 4
        WHEN 'col_progress' THEN 5
        WHEN 'col_budget' THEN 6
        ELSE c.position + 2
    END,
    visible = CASE
        WHEN c.key IN ('col_status', 'col_priority', 'col_date', 'col_progress', 'col_budget') THEN TRUE
        ELSE c.visible
    END,
    system_column = CASE
        WHEN c.key IN ('col_status', 'col_priority', 'col_date', 'col_progress', 'col_budget') THEN TRUE
        ELSE c.system_column
    END,
    updated_at = NOW()
FROM demo_boards db
WHERE c.board_id = db.board_id
  AND c.key NOT IN ('col_name', 'col_assignee');

WITH demo_boards AS (
    SELECT b.id AS board_id
    FROM boards b
    JOIN workspaces w ON w.id = b.workspace_id
    WHERE w.name IN (
        'Customer wayfinding and mobile ticketing',
        'Payments modernization rollout',
        'Agent productivity platform'
    )
),
system_columns AS (
    SELECT board_id, 'col_name' AS key, 'Task' AS label, 'text' AS type, 320 AS width, 0 AS position
    FROM demo_boards
    UNION ALL
    SELECT board_id, 'col_assignee', 'Assignee', 'assignee', 180, 1
    FROM demo_boards
)
INSERT INTO board_columns (board_id, key, label, type, width, visible, position, system_column, settings, created_at, updated_at)
SELECT board_id, key, label, type, width, TRUE, position, TRUE, '{}'::jsonb, NOW(), NOW()
FROM system_columns
ON CONFLICT (board_id, key) DO UPDATE SET
    label = EXCLUDED.label,
    type = EXCLUDED.type,
    width = EXCLUDED.width,
    visible = TRUE,
    position = EXCLUDED.position,
    system_column = TRUE,
    updated_at = NOW();

SELECT setval(pg_get_serial_sequence('board_columns', 'id'), (SELECT COALESCE(MAX(id), 1) FROM board_columns));

-- Keep the Risk & Aging preset useful in demo databases by ensuring a few open
-- tasks are genuinely stale while still remaining plausible active work.

WITH stale_candidates AS (
    SELECT t.id,
           t.board_id,
           t.created_by,
           row_number() OVER (PARTITION BY b.id ORDER BY t.position DESC, t.id DESC) AS board_rank
    FROM task t
    JOIN boards b ON b.id = t.board_id
    JOIN workspaces w ON w.id = b.workspace_id
    LEFT JOIN board_column_options so ON so.id = t.status_option_id
    WHERE t.description LIKE 'Metrics demo task%'
      AND w.name IN (
          'Customer wayfinding and mobile ticketing',
          'Payments modernization rollout',
          'Agent productivity platform'
      )
      AND t.deleted_at IS NULL
      AND COALESCE(NULLIF(so.workflow_meaning, 'none'),
          CASE t.status
              WHEN 'todo' THEN 'new'
              WHEN 'new' THEN 'new'
              WHEN 'in_progress' THEN 'in_progress'
              WHEN 'done' THEN 'done'
              ELSE 'unclassified'
          END) <> 'done'
      AND t.status IN ('blocked', 'in_dev', 'qa', 'ready')
)
UPDATE task t
SET updated_at = NOW() - (INTERVAL '9 days' + (stale.board_rank || ' days')::interval)
FROM stale_candidates stale
WHERE t.id = stale.id
  AND stale.board_rank <= 2;

INSERT INTO task_activity (task_id, board_id, actor_id, event_type, field_key, old_value, new_value, visibility, metadata, created_at)
SELECT t.id,
       t.board_id,
       t.created_by,
       'task.updated',
       'stale_demo_marker',
       NULL,
       to_jsonb('No activity for risk-aging demo window'::text),
       'internal',
       jsonb_build_object('source', 'metrics_demo_stale_examples'),
       t.updated_at
FROM task t
WHERE t.description LIKE 'Metrics demo task%'
  AND t.updated_at < NOW() - INTERVAL '7 days'
  AND NOT EXISTS (
      SELECT 1
      FROM task_activity a
      WHERE a.task_id = t.id
        AND a.metadata ->> 'source' = 'metrics_demo_stale_examples'
  );

SELECT setval(pg_get_serial_sequence('task_activity', 'id'), (SELECT COALESCE(MAX(id), 1) FROM task_activity));

-- Semantic metric field demo mappings.

INSERT INTO board_columns (board_id, key, label, type, width, visible, position, system_column, settings)
SELECT b.id, 'col_expected_cost', 'Expected Cost', 'currency', 150, TRUE, 12, FALSE, '{}'::jsonb
FROM boards b
JOIN workspaces w ON w.id = b.workspace_id
WHERE w.name = 'Payments modernization rollout'
  AND b.name = 'Planning'
ON CONFLICT (board_id, key) DO UPDATE SET
    label = EXCLUDED.label,
    type = EXCLUDED.type,
    width = EXCLUDED.width,
    visible = EXCLUDED.visible,
    position = EXCLUDED.position,
    system_column = EXCLUDED.system_column,
    settings = EXCLUDED.settings,
    updated_at = NOW();

INSERT INTO task_custom_values (task_id, column_id, value, updated_at)
SELECT t.id, c.id, to_jsonb((COALESCE(t.budget, 0) * 1.08)::numeric(14,2)), NOW()
FROM task t
JOIN boards b ON b.id = t.board_id
JOIN workspaces w ON w.id = b.workspace_id
JOIN board_columns c ON c.board_id = b.id AND c.key = 'col_expected_cost'
WHERE w.name = 'Payments modernization rollout'
  AND b.name = 'Planning'
  AND t.description LIKE 'Metrics demo task%'
ON CONFLICT (task_id, column_id) DO UPDATE SET
    value = task_custom_values.value,
    updated_at = task_custom_values.updated_at;

UPDATE task t
SET budget = NULL
FROM boards b
JOIN workspaces w ON w.id = b.workspace_id
WHERE t.board_id = b.id
  AND w.name = 'Payments modernization rollout'
  AND b.name = 'Planning'
  AND t.description LIKE 'Metrics demo task%';

INSERT INTO board_metric_field_mappings (board_id, semantic_key, source_type, source_key)
SELECT b.id, 'budget', 'custom_field', 'col_expected_cost'
FROM boards b
JOIN workspaces w ON w.id = b.workspace_id
WHERE w.name = 'Payments modernization rollout'
  AND b.name = 'Planning'
ON CONFLICT (board_id, semantic_key) DO UPDATE SET
    source_type = EXCLUDED.source_type,
    source_key = EXCLUDED.source_key,
    updated_at = NOW();

INSERT INTO board_metric_field_mappings (board_id, semantic_key, source_type, source_key)
SELECT b.id, 'effort', 'custom_field', 'col_story_points'
FROM boards b
JOIN workspaces w ON w.id = b.workspace_id
JOIN board_columns c ON c.board_id = b.id AND c.key = 'col_story_points' AND c.deleted_at IS NULL
WHERE w.name IN (
    'Customer wayfinding and mobile ticketing',
    'Payments modernization rollout',
    'Agent productivity platform'
)
ON CONFLICT (board_id, semantic_key) DO UPDATE SET
    source_type = EXCLUDED.source_type,
    source_key = EXCLUDED.source_key,
    updated_at = NOW();

SELECT setval(pg_get_serial_sequence('board_columns', 'id'), (SELECT COALESCE(MAX(id), 1) FROM board_columns));
SELECT setval(pg_get_serial_sequence('board_metric_field_mappings', 'id'), (SELECT COALESCE(MAX(id), 1) FROM board_metric_field_mappings));
