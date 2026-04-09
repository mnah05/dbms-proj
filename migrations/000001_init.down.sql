-- +migrate Up
-- Create schema_migrations table for tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT PRIMARY KEY,
    dirty BOOLEAN,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- +migrate Down
-- No down migration needed for init
