-- runs once, the first time the mysql container starts with an empty volume
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL DEFAULT '',
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Other',
    date DATE NOT NULL DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET = utf8mb4;

INSERT INTO expenses (title, description, amount, category) VALUES
('Shopping', 'Groceries', 100.00, 'Food'),
('Car', 'Gas', 50.00, 'Transport'),
('Restaurant', 'Dinner', 100.00, 'Food'),
('Entertainment', 'Movie', 15.00, 'Entertainment'),
('Coffee', 'Coffee', 5.00, 'Food'),
('Restaurant', 'Dinner', 100.00, 'Food'),
('Entertainment', 'Movie', 15.00, 'Entertainment'),
('Coffee', 'Coffee', 5.00, 'Food'),
('Restaurant', 'Dinner', 100.00, 'Food'),
('Entertainment', 'Movie', 15.00, 'Entertainment');
