-- Add indexes for frequently queried columns
-- Run this script if indexes aren't applied via Drizzle migration

-- Leagues table indexes
CREATE INDEX IF NOT EXISTS leagues_user_id_idx ON leagues(user_id);
CREATE INDEX IF NOT EXISTS leagues_status_idx ON leagues(status);

-- Teams table index
CREATE INDEX IF NOT EXISTS teams_league_id_idx ON teams(league_id);

-- Bowlers table indexes
CREATE INDEX IF NOT EXISTS bowlers_league_id_idx ON bowlers(league_id);
CREATE INDEX IF NOT EXISTS bowlers_team_id_idx ON bowlers(team_id);

-- Games table indexes
CREATE INDEX IF NOT EXISTS games_league_id_idx ON games(league_id);
CREATE INDEX IF NOT EXISTS games_week_idx ON games(week);

-- Scores table indexes
CREATE INDEX IF NOT EXISTS scores_game_id_idx ON scores(game_id);
CREATE INDEX IF NOT EXISTS scores_bowler_id_idx ON scores(bowler_id);
