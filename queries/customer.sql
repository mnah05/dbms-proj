-- name: GetCustomerByEmail :one
SELECT * FROM Customer WHERE email = ?;

-- name: GetCustomerByID :one
SELECT * FROM Customer WHERE customer_id = ?;

-- name: CreateCustomer :execresult
INSERT INTO Customer (first_name, last_name, email, phone, address) VALUES (?, ?, ?, ?, ?);

-- name: ListCustomers :many
SELECT * FROM Customer ORDER BY customer_id;

-- name: SearchCustomersByName :many
SELECT * FROM Customer WHERE first_name LIKE ? OR last_name LIKE ? ORDER BY customer_id;

-- name: UpdateCustomerLoyaltyPoints :exec
UPDATE Customer SET loyalty_points = ? WHERE customer_id = ?;
