-- Reset db.
DROP TABLE IF EXISTS bets;
DROP TABLE IF EXISTS horses;
DROP TABLE IF EXISTS users;

-- Create resources! Woo
CREATE TABLE users 
  ( 
    id           SERIAL PRIMARY KEY, 
    slack_id     VARCHAR(255) NOT NULL UNIQUE, 
    name         VARCHAR(50),
    cash_amount  INT DEFAULT 100,
    admin        BOOLEAN DEFAULT false
  ); 

CREATE TABLE horses
  (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(255) NOT NULL UNIQUE,
    color VARCHAR(50)
  );

CREATE TABLE races
  (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(255) NOT NULL,
    active  BOOLEAN DEFAULT false,
    tax     NUMERIC DEFAULT 0.1  
  );

CREATE TABLE bets 
  ( 
    id        SERIAL PRIMARY KEY, 
    amount    INT, 
    user_id   INT REFERENCES users ON DELETE CASCADE,
    horse_id  INT REFERENCES horses ON DELETE CASCADE,
    race_id   INT REFERENCES races ON DELETE CASCADE 
  );
