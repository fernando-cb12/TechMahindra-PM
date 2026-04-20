-- V5__add_view_only_role
-- Role id 4: read-only global role (fits between DEVELOPER and sparse DELETED_USER id 6).
-- Id 4 is unused after V1–V4 on a typical fresh database (1–3 seeded, 6 added in V4).

INSERT INTO role (id, name, description)
VALUES (4, 'VIEW_ONLY', 'Read-only access; cannot mutate protected resources')
ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description;

SELECT setval(pg_get_serial_sequence('role', 'id'), (SELECT COALESCE(MAX(id), 1) FROM role));
