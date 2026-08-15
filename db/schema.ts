import { pgTable, text, boolean, integer, serial, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table for authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password'),
  googleId: text('google_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  leagues: many(leagues),
}));

// Leagues table
export const leagues = pgTable('leagues', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  teamSize: integer('team_size').notNull(),
  gamesPerSession: integer('games_per_session').notNull(),
  totalWeeks: integer('total_weeks').notNull(),
  handicapBasis: integer('handicap_basis').notNull(),
  handicapPercentage: integer('handicap_percentage').notNull(),
  maxHandicap: integer('max_handicap').notNull(),
  useHandicap: boolean('use_handicap').notNull().default(false),
  pointSystemType: text('point_system_type').notNull().default('matchup'),
  pointsPerWin: integer('points_per_win').notNull().default(2),
  pointsPerTie: integer('points_per_tie').notNull().default(1),
  pointsPerLoss: integer('points_per_loss').notNull().default(0),
  pointsPerIndividualGame: integer('points_per_individual_game').notNull().default(1),
  pointsPerTeamGame: integer('points_per_team_game').notNull().default(1),
  pointsPerTeamSeries: integer('points_per_team_series').notNull().default(2),
  bonusPointsForSeries: boolean('bonus_points_for_series').notNull().default(false),
  status: text('status').notNull().default('active'),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('leagues_user_id_idx').on(table.userId),
  statusIdx: index('leagues_status_idx').on(table.status),
}));

export const leaguesRelations = relations(leagues, ({ many, one }) => ({
  teams: many(teams),
  games: many(games),
  user: one(users, {
    fields: [leagues.userId],
    references: [users.id],
  }),
}));

// Teams table
export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  leagueId: text('league_id').notNull().references(() => leagues.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
}, (table) => ({
  leagueIdIdx: index('teams_league_id_idx').on(table.leagueId),
}));

export const teamsRelations = relations(teams, ({ many, one }) => ({
  league: one(leagues, {
    fields: [teams.leagueId],
    references: [leagues.id],
  }),
  bowlers: many(bowlers),
  homeGames: many(games, { relationName: 'homeTeam' }),
  awayGames: many(games, { relationName: 'awayTeam' }),
}));

// Bowlers table
export const bowlers = pgTable('bowlers', {
  id: text('id').primaryKey(),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  leagueId: text('league_id').notNull().references(() => leagues.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  startingAverage: integer('starting_average').notNull().default(150),
}, (table) => ({
  leagueIdIdx: index('bowlers_league_id_idx').on(table.leagueId),
  teamIdIdx: index('bowlers_team_id_idx').on(table.teamId),
}));

export const bowlersRelations = relations(bowlers, ({ many, one }) => ({
  team: one(teams, {
    fields: [bowlers.teamId],
    references: [teams.id],
  }),
  league: one(leagues, {
    fields: [bowlers.leagueId],
    references: [leagues.id],
  }),
  scores: many(scores),
}));

// Bowling ball inventory
export const balls = pgTable('balls', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  brand: text('brand').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('balls_user_id_idx').on(table.userId),
}));

// Named sets of balls that can be brought to a session
export const arsenals = pgTable('arsenals', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('arsenals_user_id_idx').on(table.userId),
}));

export const arsenalBalls = pgTable('arsenal_balls', {
  arsenalId: text('arsenal_id').notNull().references(() => arsenals.id, { onDelete: 'cascade' }),
  ballId: text('ball_id').notNull().references(() => balls.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.arsenalId, table.ballId] }),
  arsenalIdIdx: index('arsenal_balls_arsenal_id_idx').on(table.arsenalId),
  ballIdIdx: index('arsenal_balls_ball_id_idx').on(table.ballId),
}));

// Games table
export const games = pgTable('games', {
  id: text('id').primaryKey(),
  leagueId: text('league_id').notNull().references(() => leagues.id, { onDelete: 'cascade' }),
  week: integer('week').notNull(),
  team1Id: text('team1_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  team2Id: text('team2_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  arsenalId: text('arsenal_id').references(() => arsenals.id, { onDelete: 'set null' }),
  completed: boolean('completed').notNull().default(false),
}, (table) => ({
  leagueIdIdx: index('games_league_id_idx').on(table.leagueId),
  weekIdx: index('games_week_idx').on(table.week),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  league: one(leagues, {
    fields: [games.leagueId],
    references: [leagues.id],
  }),
  team1: one(teams, {
    fields: [games.team1Id],
    references: [teams.id],
    relationName: 'homeTeam',
  }),
  team2: one(teams, {
    fields: [games.team2Id],
    references: [teams.id],
    relationName: 'awayTeam',
  }),
  scores: many(scores),
}));

// Scores table
export const scores = pgTable('scores', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  bowlerId: text('bowler_id').notNull().references(() => bowlers.id, { onDelete: 'cascade' }),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  gameNumber: integer('game_number').notNull(),
  score: integer('score').notNull(),
  ballId: text('ball_id').references(() => balls.id, { onDelete: 'set null' }),
}, (table) => ({
  gameIdIdx: index('scores_game_id_idx').on(table.gameId),
  bowlerIdIdx: index('scores_bowler_id_idx').on(table.bowlerId),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  game: one(games, {
    fields: [scores.gameId],
    references: [games.id],
  }),
  bowler: one(bowlers, {
    fields: [scores.bowlerId],
    references: [bowlers.id],
  }),
  team: one(teams, {
    fields: [scores.teamId],
    references: [teams.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type League = typeof leagues.$inferSelect;
export type NewLeague = typeof leagues.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Bowler = typeof bowlers.$inferSelect;
export type NewBowler = typeof bowlers.$inferInsert;
export type Ball = typeof balls.$inferSelect;
export type NewBall = typeof balls.$inferInsert;
export type Arsenal = typeof arsenals.$inferSelect;
export type NewArsenal = typeof arsenals.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;
