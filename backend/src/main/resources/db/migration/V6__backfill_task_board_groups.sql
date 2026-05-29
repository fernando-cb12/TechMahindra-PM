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

