-- CREATE IF NOT EXISTS preserves records when the application restarts.
-- Prices are stored as whole paise so money does not suffer floating-point rounding.
CREATE TABLE IF NOT EXISTS chefs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    city TEXT NOT NULL,
    fee_paise INTEGER NOT NULL CHECK(fee_paise BETWEEN 10000 AND 10000000),
    available INTEGER NOT NULL CHECK(available IN (0, 1))
);

CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT NOT NULL,
    salary_paise INTEGER NOT NULL CHECK(salary_paise BETWEEN 100 AND 100000000)
);
