-- +migrate Up
-- Create ReservationWithPrice view
CREATE OR REPLACE VIEW ReservationWithPrice AS
SELECT
    r.reservation_id,
    r.customer_id,
    r.room_id,
    r.staff_id,
    r.check_in_date,
    r.check_out_date,
    r.number_of_guests,
    r.status,
    r.booking_date,
    rm.room_number,
    rm.room_type,
    rm.price_per_night,
    DATEDIFF(r.check_out_date, r.check_in_date) AS nights,
    ROUND(rm.price_per_night * DATEDIFF(r.check_out_date, r.check_in_date), 2) AS total_price
FROM Reservation r
INNER JOIN Room rm ON rm.room_id = r.room_id;

-- +migrate Down
DROP VIEW IF EXISTS ReservationWithPrice;
