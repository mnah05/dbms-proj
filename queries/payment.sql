-- name: CreatePayment :execresult
INSERT INTO Payment (reservation_id, amount, method, transaction_id, status, billing_name, billing_email, billing_address)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- name: GetPaymentByReservation :one
SELECT * FROM Payment WHERE reservation_id = ?;

-- name: ListAllPayments :many
SELECT * FROM Payment ORDER BY payment_date DESC;

-- name: GetTotalRevenue :one
SELECT CAST(COALESCE(SUM(amount), 0) AS CHAR) AS total_revenue FROM Payment WHERE status = 'completed';

-- name: RefundPayment :exec
UPDATE Payment SET status = 'refunded' WHERE reservation_id = ?;
