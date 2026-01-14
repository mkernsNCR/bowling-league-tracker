import { z } from "zod";

export const leagueSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "League name is required"),
  teamSize: z.number().min(1).max(10),
  gamesPerSession: z.number().min(1).max(5),
  totalWeeks: z.number().min(1).max(52),
  handicapBasis: z.number().min(180).max(250),
  handicapPercentage: z.number().min(0).max(100),
  maxHandicap: z.number().min(0).max(100),
  useHandicap: z.boolean(),
  // Point system configuration
  pointSystemType: z.enum(["simple", "matchup"]).default("matchup"),
  // Simple system: just overall win/tie/loss
  pointsPerWin: z.number().min(0),
  pointsPerTie: z.number().min(0),
  pointsPerLoss: z.number().min(0),
  // Matchup system: individual bowler vs bowler + team totals
  pointsPerIndividualGame: z.number().min(0).default(1), // Point when bowler beats opponent each game
  pointsPerTeamGame: z.number().min(0).default(1), // Point for team total each game
  pointsPerTeamSeries: z.number().min(0).default(2), // Points for team series total
  bonusPointsForSeries: z.boolean(),
  status: z.enum(["active", "completed"]),
});

export const insertLeagueSchema = leagueSchema.omit({ id: true, status: true });
export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type League = z.infer<typeof leagueSchema>;

export const teamSchema = z.object({
  id: z.string(),
  leagueId: z.string(),
  name: z.string().min(1, "Team name is required"),
});

export const insertTeamSchema = teamSchema.omit({ id: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = z.infer<typeof teamSchema>;

export const bowlerSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  leagueId: z.string(),
  name: z.string().min(1, "Bowler name is required"),
  startingAverage: z.number().min(0).max(300),
});

export const insertBowlerSchema = bowlerSchema.omit({ id: true });
export type InsertBowler = z.infer<typeof insertBowlerSchema>;
export type Bowler = z.infer<typeof bowlerSchema>;

export const gameSchema = z.object({
  id: z.string(),
  leagueId: z.string(),
  week: z.number().min(1),
  team1Id: z.string(),
  team2Id: z.string(),
  completed: z.boolean(),
});

export const insertGameSchema = gameSchema.omit({ id: true, completed: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = z.infer<typeof gameSchema>;

export const scoreSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  bowlerId: z.string(),
  teamId: z.string(),
  gameNumber: z.number().min(1).max(5),
  score: z.number().min(0).max(300),
});

export const insertScoreSchema = scoreSchema.omit({ id: true });
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = z.infer<typeof scoreSchema>;

export interface BowlerWithStats extends Bowler {
  gamesPlayed: number;
  totalPins: number;
  average: number;
  handicap: number;
  highGame: number;
  highSeries: number;
}

export interface TeamWithStats extends Team {
  bowlers: BowlerWithStats[];
  totalPoints: number;
  wins: number;
  losses: number;
  ties: number;
  totalPins: number;
  handicapPins: number;
  gamesPlayed: number;
}

export interface StandingsEntry {
  rank: number;
  team: TeamWithStats;
  scratchTotal: number;
  handicapTotal: number;
  points: number;
}

export interface GameWithScores extends Game {
  team1: Team;
  team2: Team;
  scores: Score[];
}

export type User = {
  id: string;
  username: string;
  password: string;
};

export type InsertUser = Omit<User, "id">;
