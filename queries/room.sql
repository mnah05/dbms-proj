-- name: ListRooms :many
SELECT * FROM Room ORDER BY room_number;

-- name: GetRoomByID :one
SELECT * FROM Room WHERE room_id = ?;

-- name: GetAvailableRooms :many
SELECT * FROM Room
WHERE room_id NOT IN (
    SELECT room_id FROM Reservation
    WHERE status NOT IN ('cancelled', 'checked_out')
    AND check_in_date < ? AND check_out_date > ?
)
ORDER BY room_number;

-- name: GetAvailableRoomsByType :many
SELECT * FROM Room
WHERE room_type = ?
AND room_id NOT IN (
    SELECT room_id FROM Reservation
    WHERE status NOT IN ('cancelled', 'checked_out')
    AND check_in_date < ? AND check_out_date > ?
)
ORDER BY room_number;

-- name: CreateRoom :execresult
INSERT INTO Room (room_number, room_type, price_per_night, max_occupancy) VALUES (?, ?, ?, ?);

-- name: UpdateRoom :exec
UPDATE Room SET room_number = ?, room_type = ?, price_per_night = ?, max_occupancy = ? WHERE room_id = ?;
