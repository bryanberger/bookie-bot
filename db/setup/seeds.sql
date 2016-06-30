-- users
INSERT INTO users (slack_id, name, admin) VALUES ('U06BVLK8F', 'Anna', true);
INSERT INTO users (slack_id, name, admin) VALUES ('U0E8J127R', 'Bryan', true);
INSERT INTO users (slack_id, name, admin) VALUES ('U0HNWMZJ7', 'Zach', true);

-- horsies
INSERT INTO horses (name, color) VALUES ('Seabiscuit', '#D52B3F');
INSERT INTO horses (name, color) VALUES ('Secretariat', '#7ED321');
INSERT INTO horses (name, color) VALUES ('Man O War', '#4A90E2');
INSERT INTO horses (name, color) VALUES ('Ruffian', '#9641E1');
INSERT INTO horses (name, color) VALUES ('Seattle Slew', '#EA8114');

-- first race
INSERT INTO races (name, active) VALUES ('Kentucky Derby', true);