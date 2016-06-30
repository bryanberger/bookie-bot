SELECT * FROM wagers
  INNER JOIN runners ON runners.id = wagers.runner_id
  INNER JOIN races ON races.id = $1