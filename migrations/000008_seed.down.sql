-- +migrate Down
DELETE FROM Staff WHERE email IN ('admin@gmail.com', 'john@hotel.com', 'jane@hotel.com');
DELETE FROM Room WHERE room_number IN ('101', '102', '103', '201', '202', '203', '301', '302', '401');
