DELETE FROM wagers USING runners
  WHERE wagers.runner_id = runners.id AND runners.race_id = $1;