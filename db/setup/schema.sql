-- Reset db.
DROP TABLE IF EXISTS races;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS runners;
DROP TABLE IF EXISTS wagers;

-- Create resources! Woo
CREATE TABLE users
  (
    id           SERIAL PRIMARY KEY,
    slack_id     VARCHAR(255) NOT NULL UNIQUE,
    name         VARCHAR(50),
    cash_balance INT DEFAULT 100,
    admin        BOOLEAN DEFAULT false
  );

CREATE TABLE races
  (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(255) NOT NULL,
    active  BOOLEAN DEFAULT false,
    tax     NUMERIC DEFAULT 0.1
  );

CREATE TABLE runners
  (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(255) NOT NULL,
    color   VARCHAR(50),
    race_id INT REFERENCES races ON DELETE CASCADE
  );

CREATE TABLE wagers
  (
    id        SERIAL PRIMARY KEY,
    amount    INT,
    user_id   INT REFERENCES users ON DELETE CASCADE,
    runner_id INT REFERENCES runners ON DELETE CASCADE
  );
