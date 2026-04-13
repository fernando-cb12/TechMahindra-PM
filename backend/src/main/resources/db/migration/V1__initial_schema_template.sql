-- V1__initial_schema_template
-- NOTE: If you already ran Flyway once, don't edit this file; create a new migration instead.

-- =============================================================
-- CollabX – Initial Schema Migration
-- Version  : V1
-- Generated: 2026-04-13
-- Engine   : PostgreSQL 15+
-- Strategy : Tables are created in dependency order so every FK
--            references an already-existing table.  Nullable FKs
--            (AISession.projectId, Milestone.sessionId, etc.) are
--            used wherever the ER diagram marks them as nullable to
--            break circular references cleanly.
--            IDs use BIGSERIAL (auto-increment BIGINT) for
--            simplicity and index performance.

-- 1. WORKSPACE
CREATE TABLE workspace (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- 2. ROLE  (lookup / seed table)
CREATE TABLE role (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,   -- ADMIN | MEMBER | VIEWER
    description TEXT
);

-- 3. USER
CREATE TABLE "user" (
    id              BIGSERIAL    PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive', 'banned')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 4. USER_ROLE  (M:N junction – User ↔ Role)
CREATE TABLE user_role (
    id       BIGSERIAL PRIMARY KEY,
    user_id  BIGINT    NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role_id  BIGINT    NOT NULL REFERENCES role(id)   ON DELETE CASCADE,
    UNIQUE (user_id, role_id)
);

-- 5. PROJECT
CREATE TABLE project (
    id            BIGSERIAL    PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    status        VARCHAR(20)  NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'active', 'on_hold', 'completed', 'archived')),
    created_by    BIGINT       NOT NULL REFERENCES "user"(id),
    workspace_id  BIGINT       NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 6. PROJECT_MEMBER  (M:N junction – Project ↔ User)
CREATE TABLE project_member (
    id               BIGSERIAL   PRIMARY KEY,
    project_id       BIGINT      NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    user_id          BIGINT      NOT NULL REFERENCES "user"(id)  ON DELETE CASCADE,
    role_in_project  VARCHAR(20) NOT NULL DEFAULT 'collaborator'
                         CHECK (role_in_project IN ('owner', 'collaborator', 'viewer')),
    UNIQUE (project_id, user_id)
);

-- 7. AI_SESSION
--    project_id is NULLABLE – a session may exist before a project
--    is formally created (e.g. during project_generation flow).
CREATE TABLE ai_session (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES "user"(id),
    project_id    BIGINT       REFERENCES project(id) ON DELETE SET NULL,   -- nullable
    session_type  VARCHAR(50)  NOT NULL
                      CHECK (session_type IN ('project_generation', 'risk_analysis', 'recommendation')),
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at  TIMESTAMPTZ
);

-- 8. MILESTONE
--    session_id is NULLABLE – milestones can be created manually.
CREATE TABLE milestone (
    id          BIGSERIAL    PRIMARY KEY,
    project_id  BIGINT       NOT NULL REFERENCES project(id)   ON DELETE CASCADE,
    session_id  BIGINT       REFERENCES ai_session(id)          ON DELETE SET NULL,  -- nullable
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    due_date    TIMESTAMPTZ,
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 9. TASK
--    milestone_id is NULLABLE per the ER diagram.
CREATE TABLE task (
    id            BIGSERIAL    PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    status        VARCHAR(20)  NOT NULL DEFAULT 'todo'
                      CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'overdue')),
    priority      VARCHAR(10)  NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    points_value  INT          NOT NULL DEFAULT 10
                      CHECK (points_value IN (10, 25, 50, 100)),
    due_date      TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ,
    project_id    BIGINT       NOT NULL REFERENCES project(id)  ON DELETE CASCADE,
    workspace_id  BIGINT       NOT NULL REFERENCES workspace(id),
    created_by    BIGINT       NOT NULL REFERENCES "user"(id),
    assigned_to   BIGINT       REFERENCES "user"(id)            ON DELETE SET NULL,
    milestone_id  BIGINT       REFERENCES milestone(id)         ON DELETE SET NULL,  -- nullable
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 10. TASK_HISTORY
CREATE TABLE task_history (
    id             BIGSERIAL    PRIMARY KEY,
    task_id        BIGINT       NOT NULL REFERENCES task(id)   ON DELETE CASCADE,
    changed_by     BIGINT       NOT NULL REFERENCES "user"(id),
    field_changed  VARCHAR(100) NOT NULL,
    old_value      TEXT,
    new_value      TEXT,
    changed_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 11. DASHBOARD_CONFIG
CREATE TABLE dashboard_config (
    id             BIGSERIAL    PRIMARY KEY,
    user_id        BIGINT       NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    layout_config  JSONB        NOT NULL DEFAULT '{}',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 12. RANK_CONFIG  (lookup / seed table)
CREATE TABLE rank_config (
    id                  BIGSERIAL    PRIMARY KEY,
    rank_level          SMALLINT     NOT NULL UNIQUE CHECK (rank_level BETWEEN 1 AND 5),
    rank_name           VARCHAR(50)  NOT NULL,   -- Rookie | Contributor | Performer | Expert | Legend
    min_points          INT          NOT NULL,
    max_points          INT          NOT NULL,
    benefit_description TEXT,
    point_multiplier    NUMERIC(4,2) NOT NULL DEFAULT 1.0  -- 1.0 | 1.1 | 1.25 | 1.5 | 2.0
);

-- 13. USER_RANK
CREATE TABLE user_rank (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    rank_level    SMALLINT     NOT NULL DEFAULT 1 CHECK (rank_level BETWEEN 1 AND 5),
    rank_name     VARCHAR(50)  NOT NULL,
    total_points  INT          NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 14. USER_POINTS
CREATE TABLE user_points (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    task_id      BIGINT       NOT NULL REFERENCES task(id)   ON DELETE CASCADE,
    base_points  INT          NOT NULL,
    multiplier   NUMERIC(4,2) NOT NULL DEFAULT 1.0,  -- early_bonus | rank_mult
    final_points INT          NOT NULL,               -- computed: base × multiplier; negative = penalty
    reason       VARCHAR(50)  NOT NULL
                     CHECK (reason IN ('task_completed', 'early_bonus', 'penalty_overdue')),
    earned_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 15. BADGE  (catalog)
CREATE TABLE badge (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url    VARCHAR(500),
    condition   VARCHAR(100) NOT NULL,  -- machine-readable rule key
    threshold   INT          NOT NULL,  -- numeric trigger value
    active      BOOLEAN      NOT NULL DEFAULT TRUE
);

-- 16. USER_BADGE
CREATE TABLE user_badge (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    badge_id   BIGINT       NOT NULL REFERENCES badge(id)  ON DELETE CASCADE,
    earned_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, badge_id)
);

-- 17. REWARD  (catalog)
CREATE TABLE reward (
    id               BIGSERIAL    PRIMARY KEY,
    name             VARCHAR(100) NOT NULL UNIQUE,
    description      TEXT,
    points_required  INT          NOT NULL,
    active           BOOLEAN      NOT NULL DEFAULT TRUE
);

-- 18. USER_REWARD
CREATE TABLE user_reward (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES "user"(id)  ON DELETE CASCADE,
    reward_id    BIGINT       NOT NULL REFERENCES reward(id)  ON DELETE CASCADE,
    redeemed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 19. REQUIREMENT_DOCUMENT
--    project_id is NULLABLE – set after project is created from doc.
CREATE TABLE requirement_document (
    id           BIGSERIAL    PRIMARY KEY,
    session_id   BIGINT       NOT NULL REFERENCES ai_session(id) ON DELETE CASCADE,
    project_id   BIGINT       REFERENCES project(id)              ON DELETE SET NULL,  -- nullable
    file_name    VARCHAR(255) NOT NULL,
    storage_url  VARCHAR(500) NOT NULL,
    raw_text     TEXT,
    uploaded_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 20. AI_GENERATED_TASK
--    task_id is NULLABLE – set only after the user accepts the suggestion.
CREATE TABLE ai_generated_task (
    id              BIGSERIAL    PRIMARY KEY,
    session_id      BIGINT       NOT NULL REFERENCES ai_session(id) ON DELETE CASCADE,
    task_id         BIGINT       REFERENCES task(id)                 ON DELETE SET NULL,  -- nullable
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    priority        VARCHAR(10)  NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    estimated_days  INT,
    accepted        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 21. AI_RECOMMENDATION
CREATE TABLE ai_recommendation (
    id                    BIGSERIAL    PRIMARY KEY,
    session_id            BIGINT       NOT NULL REFERENCES ai_session(id) ON DELETE CASCADE,
    project_id            BIGINT       NOT NULL REFERENCES project(id)    ON DELETE CASCADE,
    recommendation_type   VARCHAR(20)  NOT NULL
                              CHECK (recommendation_type IN ('scope', 'timeline', 'resource', 'risk')),
    content               TEXT         NOT NULL,
    confidence            NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0.0 AND 1.0),
    acknowledged          BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 22. RISK_ANALYSIS
CREATE TABLE risk_analysis (
    id              BIGSERIAL    PRIMARY KEY,
    session_id      BIGINT       NOT NULL REFERENCES ai_session(id) ON DELETE CASCADE,
    project_id      BIGINT       NOT NULL REFERENCES project(id)    ON DELETE CASCADE,
    risk_type       VARCHAR(20)  NOT NULL
                        CHECK (risk_type IN ('delay', 'overload', 'scope_creep', 'attrition')),
    severity        VARCHAR(10)  NOT NULL
                        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    likelihood      NUMERIC(4,3) NOT NULL CHECK (likelihood BETWEEN 0.0 AND 1.0),
    description     TEXT,
    based_on_logs   BOOLEAN      NOT NULL DEFAULT FALSE,  -- true = derived from task_history patterns
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 23. PROJECT_ANALYTIC_SNAPSHOT
CREATE TABLE project_analytic_snapshot (
    id                    BIGSERIAL    PRIMARY KEY,
    project_id            BIGINT       NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    snapshot_date         DATE         NOT NULL,
    total_tasks           INT          NOT NULL DEFAULT 0,
    completed_tasks       INT          NOT NULL DEFAULT 0,
    overdue_tasks         INT          NOT NULL DEFAULT 0,
    avg_completion_days   NUMERIC(6,2),
    team_velocity         NUMERIC(6,2),  -- tasks completed per day in the period
    risk_score            NUMERIC(5,3),  -- aggregated from risk_analysis
    UNIQUE (project_id, snapshot_date)
);


-- INDEXES

-- User lookups
CREATE INDEX idx_user_email              ON "user"(email);
CREATE INDEX idx_user_status             ON "user"(status);

-- Project
CREATE INDEX idx_project_workspace       ON project(workspace_id);
CREATE INDEX idx_project_created_by      ON project(created_by);
CREATE INDEX idx_project_status          ON project(status);

-- Task (most queried table)
CREATE INDEX idx_task_project            ON task(project_id);
CREATE INDEX idx_task_assigned_to        ON task(assigned_to);
CREATE INDEX idx_task_status             ON task(status);
CREATE INDEX idx_task_due_date           ON task(due_date);
CREATE INDEX idx_task_milestone          ON task(milestone_id);
CREATE INDEX idx_task_workspace          ON task(workspace_id);

-- Task history – audit queries
CREATE INDEX idx_task_history_task       ON task_history(task_id);
CREATE INDEX idx_task_history_changed_at ON task_history(changed_at);

-- Gamification
CREATE INDEX idx_user_points_user        ON user_points(user_id);
CREATE INDEX idx_user_points_task        ON user_points(task_id);
CREATE INDEX idx_user_badge_user         ON user_badge(user_id);
CREATE INDEX idx_user_reward_user        ON user_reward(user_id);

-- AI
CREATE INDEX idx_ai_session_user         ON ai_session(user_id);
CREATE INDEX idx_ai_session_project      ON ai_session(project_id);
CREATE INDEX idx_ai_rec_project          ON ai_recommendation(project_id);
CREATE INDEX idx_risk_analysis_project   ON risk_analysis(project_id);
CREATE INDEX idx_req_doc_session         ON requirement_document(session_id);
CREATE INDEX idx_ai_gen_task_session     ON ai_generated_task(session_id);

-- Analytics
CREATE INDEX idx_snapshot_project_date   ON project_analytic_snapshot(project_id, snapshot_date DESC);

-- Milestone
CREATE INDEX idx_milestone_project       ON milestone(project_id);


-- SEED DATA – Lookup / Config Tables

-- Roles
INSERT INTO role (name, description) VALUES
    ('ADMIN',  'Full access to workspace settings and all projects'),
    ('MEMBER', 'Can create and manage tasks within assigned projects'),
    ('VIEWER', 'Read-only access to projects they are added to');

-- Rank configs  (1=Rookie … 5=Legend)
INSERT INTO rank_config (rank_level, rank_name, min_points, max_points, benefit_description, point_multiplier) VALUES
    (1, 'Rookie',      0,     499,   'Welcome aboard! Start completing tasks to level up.',   1.00),
    (2, 'Contributor', 500,   1499,  '10 % point bonus on every completed task.',             1.10),
    (3, 'Performer',   1500,  3999,  '25 % point bonus and early access to new features.',    1.25),
    (4, 'Expert',      4000,  9999,  '50 % point bonus and priority support.',                1.50),
    (5, 'Legend',      10000, 99999, 'Double points and exclusive Legend badge.',             2.00);