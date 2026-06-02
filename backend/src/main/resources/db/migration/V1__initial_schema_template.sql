-- V1__initial_schema_template
-- Fresh schema for the workspace -> board -> task hierarchy.

CREATE TABLE role (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive', 'banned')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    preferences JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE user_role (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    UNIQUE (user_id, role_id)
);

CREATE TABLE workspaces (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    status           VARCHAR(20) NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'active', 'on_hold', 'completed', 'archived')),
    created_by       BIGINT NOT NULL REFERENCES users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ,
    deleted_by       BIGINT REFERENCES users(id),
    purge_after      TIMESTAMPTZ,
    banner_image_url VARCHAR(500),
    budget_label     VARCHAR(50),
    card_due_date    DATE
);

CREATE TABLE workspace_member (
    id                BIGSERIAL PRIMARY KEY,
    workspace_id      BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_in_workspace VARCHAR(20) NOT NULL DEFAULT 'collaborator'
                      CHECK (role_in_workspace IN ('owner', 'collaborator', 'viewer')),
    UNIQUE (workspace_id, user_id)
);

CREATE TABLE boards (
    id           BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    color        VARCHAR(20) NOT NULL DEFAULT '#5F0229',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_session (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id),
    workspace_id BIGINT REFERENCES workspaces(id) ON DELETE SET NULL,
    session_type VARCHAR(50) NOT NULL
                 CHECK (session_type IN ('workspace_generation', 'risk_analysis', 'recommendation')),
    status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE milestone (
    id           BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    session_id   BIGINT REFERENCES ai_session(id) ON DELETE SET NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    due_date     TIMESTAMPTZ,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task (
    id           BIGSERIAL PRIMARY KEY,
    board_id     BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    status       VARCHAR(100) NOT NULL DEFAULT 'todo',
    priority     VARCHAR(100) NOT NULL DEFAULT 'medium',
    points_value INT NOT NULL DEFAULT 10 CHECK (points_value IN (10, 25, 50, 100)),
    due_date     TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by   BIGINT NOT NULL REFERENCES users(id),
    assigned_to  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    milestone_id BIGINT REFERENCES milestone(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_history (
    id            BIGSERIAL PRIMARY KEY,
    task_id       BIGINT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    changed_by    BIGINT NOT NULL REFERENCES users(id),
    field_changed VARCHAR(100) NOT NULL,
    old_value     TEXT,
    new_value     TEXT,
    changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dashboard_config (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    layout_config JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rank_config (
    id                  BIGSERIAL PRIMARY KEY,
    rank_level          SMALLINT NOT NULL UNIQUE CHECK (rank_level BETWEEN 1 AND 5),
    rank_name           VARCHAR(50) NOT NULL,
    min_points          INT NOT NULL,
    max_points          INT NOT NULL,
    benefit_description TEXT,
    point_multiplier    NUMERIC(4,2) NOT NULL DEFAULT 1.0
);

CREATE TABLE user_rank (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    rank_level   SMALLINT NOT NULL DEFAULT 1 CHECK (rank_level BETWEEN 1 AND 5),
    rank_name    VARCHAR(50) NOT NULL,
    total_points INT NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_points (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id      BIGINT NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    base_points  INT NOT NULL,
    multiplier   NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    final_points INT NOT NULL,
    reason       VARCHAR(50) NOT NULL
                 CHECK (reason IN ('task_completed', 'early_bonus', 'penalty_overdue')),
    earned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE badge (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url    VARCHAR(500),
    condition   VARCHAR(100) NOT NULL,
    threshold   INT NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE user_badge (
    id        BIGSERIAL PRIMARY KEY,
    user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id  BIGINT NOT NULL REFERENCES badge(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, badge_id)
);

CREATE TABLE reward (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    points_required INT NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    category        VARCHAR(40) NOT NULL DEFAULT 'perks',
    icon_variant    VARCHAR(20) NOT NULL DEFAULT 'crimson',
    badge           VARCHAR(20),
    meta            VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_reward (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id    BIGINT NOT NULL REFERENCES reward(id) ON DELETE CASCADE,
    redeemed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
    points_spent INT NOT NULL DEFAULT 0,
    fulfilled_at TIMESTAMPTZ,
    notes        TEXT
);

CREATE TABLE reward_points_ledger (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id       BIGINT REFERENCES task(id) ON DELETE SET NULL,
    reward_id     BIGINT REFERENCES reward(id) ON DELETE SET NULL,
    redemption_id BIGINT REFERENCES user_reward(id) ON DELETE SET NULL,
    points_delta  INT NOT NULL,
    reason        VARCHAR(50) NOT NULL
                  CHECK (reason IN ('task_completed', 'reward_redeemed', 'manual_adjustment')),
    description   VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE requirement_document (
    id           BIGSERIAL PRIMARY KEY,
    session_id   BIGINT NOT NULL REFERENCES ai_session(id) ON DELETE CASCADE,
    workspace_id BIGINT REFERENCES workspaces(id) ON DELETE SET NULL,
    file_name    VARCHAR(255) NOT NULL,
    storage_url  VARCHAR(500) NOT NULL,
    raw_text     TEXT,
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_generated_task (
    id             BIGSERIAL PRIMARY KEY,
    session_id     BIGINT NOT NULL REFERENCES ai_session(id) ON DELETE CASCADE,
    task_id        BIGINT REFERENCES task(id) ON DELETE SET NULL,
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    priority       VARCHAR(10) NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    estimated_days INT,
    accepted       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_recommendation (
    id                  BIGSERIAL PRIMARY KEY,
    session_id          BIGINT NOT NULL REFERENCES ai_session(id) ON DELETE CASCADE,
    workspace_id        BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(20) NOT NULL
                        CHECK (recommendation_type IN ('scope', 'timeline', 'resource', 'risk')),
    content             TEXT NOT NULL,
    confidence          NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0.0 AND 1.0),
    acknowledged        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE risk_analysis (
    id            BIGSERIAL PRIMARY KEY,
    session_id    BIGINT NOT NULL REFERENCES ai_session(id) ON DELETE CASCADE,
    workspace_id  BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    risk_type     VARCHAR(20) NOT NULL
                  CHECK (risk_type IN ('delay', 'overload', 'scope_creep', 'attrition')),
    severity      VARCHAR(10) NOT NULL
                  CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    likelihood    NUMERIC(4,3) NOT NULL CHECK (likelihood BETWEEN 0.0 AND 1.0),
    description   TEXT,
    based_on_logs BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workspace_analytic_snapshot (
    id                  BIGSERIAL PRIMARY KEY,
    workspace_id        BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    snapshot_date       DATE NOT NULL,
    total_tasks         INT NOT NULL DEFAULT 0,
    completed_tasks     INT NOT NULL DEFAULT 0,
    overdue_tasks       INT NOT NULL DEFAULT 0,
    avg_completion_days NUMERIC(6,2),
    team_velocity       NUMERIC(6,2),
    risk_score          NUMERIC(5,3),
    UNIQUE (workspace_id, snapshot_date)
);

CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_status ON users(status);
CREATE INDEX idx_workspace_created_by ON workspaces(created_by);
CREATE INDEX idx_workspace_status ON workspaces(status);
CREATE INDEX idx_workspaces_deleted_created ON workspaces(deleted_at, created_at DESC);
CREATE INDEX idx_workspace_member_workspace ON workspace_member(workspace_id);
CREATE INDEX idx_workspace_member_user ON workspace_member(user_id);
CREATE INDEX idx_board_workspace ON boards(workspace_id);
CREATE INDEX idx_task_board ON task(board_id);
CREATE INDEX idx_task_assigned_to ON task(assigned_to);
CREATE INDEX idx_task_status ON task(status);
CREATE INDEX idx_task_due_date ON task(due_date);
CREATE INDEX idx_task_milestone ON task(milestone_id);
CREATE INDEX idx_task_history_task ON task_history(task_id);
CREATE INDEX idx_task_history_changed_at ON task_history(changed_at);
CREATE INDEX idx_user_points_user ON user_points(user_id);
CREATE INDEX idx_user_points_task ON user_points(task_id);
CREATE UNIQUE INDEX ux_user_points_task_completed
    ON user_points(user_id, task_id, reason)
    WHERE reason = 'task_completed';
CREATE INDEX idx_user_badge_user ON user_badge(user_id);
CREATE INDEX idx_user_reward_user ON user_reward(user_id);
CREATE INDEX idx_reward_points_user_created ON reward_points_ledger(user_id, created_at DESC);
CREATE INDEX idx_reward_points_task ON reward_points_ledger(task_id);
CREATE UNIQUE INDEX ux_reward_points_task_completed
    ON reward_points_ledger(user_id, task_id, reason)
    WHERE reason = 'task_completed';
CREATE INDEX idx_ai_session_user ON ai_session(user_id);
CREATE INDEX idx_ai_session_workspace ON ai_session(workspace_id);
CREATE INDEX idx_ai_rec_workspace ON ai_recommendation(workspace_id);
CREATE INDEX idx_risk_analysis_workspace ON risk_analysis(workspace_id);
CREATE INDEX idx_req_doc_session ON requirement_document(session_id);
CREATE INDEX idx_ai_gen_task_session ON ai_generated_task(session_id);
CREATE INDEX idx_snapshot_workspace_date ON workspace_analytic_snapshot(workspace_id, snapshot_date DESC);
CREATE INDEX idx_milestone_workspace ON milestone(workspace_id);
