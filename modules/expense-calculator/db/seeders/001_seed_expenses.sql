INSERT INTO expenses (name, amount, category, date)
VALUES
  ('Grocery shopping', 45.50, 'Food', '2024-06-15'),
  ('Gas station', 30.00, 'Transport', '2024-06-14'),
  ('Internet bill', 50.00, 'Utilities', '2024-06-10'),
  ('Restaurant', 25.75, 'Food', '2024-06-13')
ON CONFLICT DO NOTHING;
