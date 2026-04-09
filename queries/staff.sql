-- name: GetStaffByEmail :one
SELECT * FROM Staff WHERE email = ?;
