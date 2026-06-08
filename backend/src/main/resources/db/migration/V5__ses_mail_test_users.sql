CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(80) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    link_path VARCHAR(500),
    metadata JSONB NOT NULL DEFAULT '{}',
    read_at TIMESTAMPTZ,
    email_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (email_status IN ('pending', 'disabled', 'sent', 'failed')),
    ses_message_id VARCHAR(255),
    error_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
    ON notifications(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
    ON notifications(recipient_id, read_at)
    WHERE read_at IS NULL;

WITH seeded_users(name, email, role_name) AS (
    VALUES
        ('SES Success Tester', 'success@simulator.amazonses.com', 'DEVELOPER'),
        ('SES Bounce Tester', 'bounce@simulator.amazonses.com', 'DEVELOPER'),
        ('SES Complaint Tester', 'complaint@simulator.amazonses.com', 'DEVELOPER'),
        ('Fernando Camou B', 'fernandocamoub@gmail.com', 'ADMIN'),
        ('Luis Carlos Mares', 'luiscarlospikachu@gmail.com', 'TEAM_LEAD'),
        ('Marco Ibarra', 'a01253370@tec.mx', 'TEAM_LEAD'),
        ('Antonio Calderon', 'a01255264@tec.mx', 'TEAM_LEAD'),
        ('Fernando Camou', 'a01255376@tec.mx', 'TEAM_LEAD')
)
    INSERT INTO users (name, email, password_hash, status, preferences)
    SELECT
        name,
        lower(email),
        '$2b$10$l0uYOsRM4szdJD3MJrmNUOL2VCEgeSELuUsB5NwN6AiBb7cXSQzAe',
        'active',
        '{"notifications":{"issuesAssigned":true,"mentions":true,"projectUpdates":true,"dailySummary":true}}'::jsonb
    FROM seeded_users
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        status = 'active',
        preferences = users.preferences || EXCLUDED.preferences
;

WITH seeded_users(email, role_name) AS (
    VALUES
        ('success@simulator.amazonses.com', 'DEVELOPER'),
        ('bounce@simulator.amazonses.com', 'DEVELOPER'),
        ('complaint@simulator.amazonses.com', 'DEVELOPER'),
        ('fernandocamoub@gmail.com', 'ADMIN'),
        ('luiscarlospikachu@gmail.com', 'TEAM_LEAD'),
        ('a01253370@tec.mx', 'TEAM_LEAD'),
        ('a01255264@tec.mx', 'TEAM_LEAD'),
        ('a01255376@tec.mx', 'TEAM_LEAD')
)
INSERT INTO user_role (user_id, role_id)
SELECT u.id, r.id
FROM seeded_users su
JOIN users u ON lower(su.email) = u.email
JOIN role r ON r.name = su.role_name
ON CONFLICT (user_id, role_id) DO NOTHING;
