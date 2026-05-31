ALTER TABLE board_column_options
    ADD COLUMN IF NOT EXISTS workflow_meaning VARCHAR(20) NOT NULL DEFAULT 'none';

UPDATE board_column_options
SET workflow_meaning = 'none'
WHERE workflow_meaning IS NULL OR workflow_meaning NOT IN ('none', 'new', 'in_progress', 'done');

UPDATE board_column_options option
SET workflow_meaning = CASE option.key
    WHEN 'todo' THEN 'new'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'done' THEN 'done'
    ELSE option.workflow_meaning
END
FROM board_columns column_def
WHERE option.column_id = column_def.id
  AND column_def.type = 'status'
  AND option.key IN ('todo', 'in_progress', 'done');

UPDATE board_views
SET name = 'Insights',
    type = 'insights'
WHERE type = 'chart';

ALTER TABLE task
    DROP CONSTRAINT IF EXISTS task_status_check;

ALTER TABLE task
    DROP CONSTRAINT IF EXISTS task_priority_check;

ALTER TABLE task
    ALTER COLUMN status TYPE VARCHAR(100);

ALTER TABLE task
    ALTER COLUMN priority TYPE VARCHAR(100);
