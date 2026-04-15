-- +migrate Up
-- Add password_hash column to Customer table
ALTER TABLE Customer ADD COLUMN password_hash VARCHAR(255) NULL;

-- Set a default password hash for existing customers (password: "changeme")
UPDATE Customer SET password_hash = '$2a$10$XALZ1Y.Q./QnHrUfC7Bqj.zpF.5Jz.7qK9z1NcK8Z8L9bV1cK8Z8L' WHERE password_hash IS NULL;

-- Make column NOT NULL after setting defaults
ALTER TABLE Customer MODIFY COLUMN password_hash VARCHAR(255) NOT NULL;