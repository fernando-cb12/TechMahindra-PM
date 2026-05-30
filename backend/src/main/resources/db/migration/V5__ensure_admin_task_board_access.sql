-- Ensure the demo admin has explicit board access in existing local databases.

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

