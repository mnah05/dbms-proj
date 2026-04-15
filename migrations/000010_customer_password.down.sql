-- +migrate Down
ALTER TABLE Customer DROP COLUMN password_hash;