-- Query to find odds on all horses based on bets

WITH individual_stats AS (
SELECT
  runners.name       AS runner_name,
  SUM(wagers.amount) AS runner_pool
  FROM wagers
  INNER JOIN runners
    ON runners.id = wagers.runner_id
  INNER JOIN races
    ON  runners.race_id = races.id
    AND races.id = 1
  GROUP BY runners.name
)

SELECT
  runner_name,
  runner_pool,
  SUM(wagers.amount) AS total_pool
FROM individual_stats
INNER JOIN races    ON races.id = 1
INNER JOIN runners  ON runners.race_id = races.id
INNER JOIN wagers   ON wagers.runner_id = runners.id
  GROUP BY runner_name, runner_pool;