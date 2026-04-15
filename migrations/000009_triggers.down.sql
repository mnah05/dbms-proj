-- +migrate Down
DROP TRIGGER IF EXISTS prevent_double_booking_insert;
DROP TRIGGER IF EXISTS prevent_double_booking_update;