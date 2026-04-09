-- +migrate Up
-- Seed sample rooms
INSERT INTO Room (room_number, room_type, price_per_night, max_occupancy) VALUES
('101', 'Standard', 99.99, 2),
('102', 'Standard', 99.99, 2),
('103', 'Standard', 99.99, 2),
('201', 'Deluxe', 149.99, 2),
('202', 'Deluxe', 149.99, 2),
('203', 'Deluxe', 149.99, 3),
('301', 'Suite', 249.99, 4),
('302', 'Suite', 249.99, 4),
('401', 'Penthouse', 499.99, 6);

-- Seed default staff (password: "admin" for all)
INSERT INTO Staff (first_name, last_name, role, email, phone, password_hash, is_active) VALUES
('Admin', 'User', 'admin', 'admin@gmail.com', '555-0100', '$2a$10$/6BfwTG9jWySd8KFAsS6EeGtREmi8rsd3R.Hm0yAtLZVQzqJZZLHO', TRUE),
('John', 'Smith', 'receptionist', 'john@hotel.com', '555-0101', '$2a$10$/6BfwTG9jWySd8KFAsS6EeGtREmi8rsd3R.Hm0yAtLZVQzqJZZLHO', TRUE),
('Jane', 'Doe', 'manager', 'jane@hotel.com', '555-0102', '$2a$10$/6BfwTG9jWySd8KFAsS6EeGtREmi8rsd3R.Hm0yAtLZVQzqJZZLHO', TRUE);
