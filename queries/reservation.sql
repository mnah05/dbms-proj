-- name: CreateReservation :execresult
INSERT INTO Reservation (customer_id, room_id, staff_id, check_in_date, check_out_date, number_of_guests, status)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: GetReservationByID :one
SELECT * FROM Reservation WHERE reservation_id = ?;

-- name: ListReservationsByCustomer :many
SELECT * FROM ReservationWithPrice WHERE customer_id = ? ORDER BY booking_date DESC;

-- name: ListAllReservations :many
SELECT * FROM ReservationWithPrice ORDER BY booking_date DESC;

-- name: ListReservationsByStatus :many
SELECT * FROM ReservationWithPrice WHERE status = ? ORDER BY booking_date DESC;

-- name: UpdateReservationStatus :exec
UPDATE Reservation SET status = ? WHERE reservation_id = ?;

-- name: CancelReservation :exec
UPDATE Reservation SET status = 'cancelled' WHERE reservation_id = ? AND customer_id = ?;

-- name: CheckRoomAvailabilityForUpdate :one
SELECT COUNT(*) AS count FROM Reservation
WHERE room_id = ?
AND status NOT IN ('cancelled', 'checked_out')
AND check_in_date < ? AND check_out_date > ?
FOR UPDATE;
