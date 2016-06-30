-- users
INSERT INTO users (slack_id, name, admin) VALUES ('U06BVLK8F', 'Anna', true);
INSERT INTO users (slack_id, name, admin) VALUES ('U0E8J127R', 'Bryan', true);
INSERT INTO users (slack_id, name, admin) VALUES ('U0HNWMZJ7', 'Zach', true);

-- first race
INSERT INTO races (name, active) VALUES ('Kentucky Derby', true);

-- runners
INSERT INTO runners (name, color, race_id) VALUES ('Seabiscuit', '#D52B3F', (SELECT id FROM races LIMIT 1));
INSERT INTO runners (name, color, race_id) VALUES ('Secretariat', '#7ED321', (SELECT id FROM races LIMIT 1));
INSERT INTO runners (name, color, race_id) VALUES ('Man O War', '#4A90E2', (SELECT id FROM races LIMIT 1));
INSERT INTO runners (name, color, race_id) VALUES ('Ruffian', '#9641E1', (SELECT id FROM races LIMIT 1));

