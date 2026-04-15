-- Seed global roles referenced by user_role (ADMIN | MEMBER | VIEWER).

INSERT INTO role (name, description) VALUES
    ('ADMIN', 'Workspace administrator'),
    ('MEMBER', 'Standard member'),
    ('VIEWER', 'Read-only')
ON CONFLICT (name) DO NOTHING;
