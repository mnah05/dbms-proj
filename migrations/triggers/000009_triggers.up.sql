-- +migrate Up
-- Prevent double booking for the same room
DELIMITER //
CREATE TRIGGER prevent_double_booking_insert
BEFORE INSERT ON Reservation
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM Reservation
        WHERE room_id = NEW.room_id
        AND status NOT IN ('cancelled', 'checked_out')
        AND check_in_date < NEW.check_out_date
        AND check_out_date > NEW.check_in_date
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Room is already booked for these dates';
    END IF;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER prevent_double_booking_update
BEFORE UPDATE ON Reservation
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM Reservation
        WHERE room_id = NEW.room_id
        AND reservation_id != NEW.reservation_id
        AND status NOT IN ('cancelled', 'checked_out')
        AND check_in_date < NEW.check_out_date
        AND check_out_date > NEW.check_in_date
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Room is already booked for these dates';
    END IF;
END //
DELIMITER ;