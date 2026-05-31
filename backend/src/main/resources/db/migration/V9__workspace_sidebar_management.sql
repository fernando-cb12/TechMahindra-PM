ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS deleted_by BIGINT REFERENCES users(id);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS purge_after TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_workspaces_deleted_created ON workspaces(deleted_at, created_at DESC);
