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
CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_task_updates_task_created ON task_updates(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_files_task ON task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_task_created ON task_activity(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_views_board_position ON board_views(board_id, position);

