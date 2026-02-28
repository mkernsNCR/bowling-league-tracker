import { describe, it, expect } from "vitest";
import {
  leagueSchema,
  teamSchema,
  bowlerSchema,
  gameSchema,
  scoreSchema,
  insertLeagueSchema,
  insertTeamSchema,
  insertBowlerSchema,
  insertGameSchema,
  insertScoreSchema,
  updateLeagueSchema,
  updateTeamSchema,
  updateBowlerSchema,
  updateGameSchema,
  updateScoreSchema,
} from "../shared/schema";

describe("Zod Schema Validation", () => {
  describe("League Schema", () => {
    it("should validate a correct league", () => {
      const validLeague = {
        id: "test-id",
        name: "Saturday Night League",
        teamSize: 4,
        gamesPerSession: 3,
        totalWeeks: 10,
        handicapBasis: 200,
        handicapPercentage: 80,
        maxHandicap: 25,
        useHandicap: true,
        pointSystemType: "matchup",
        pointsPerWin: 2,
        pointsPerTie: 1,
        pointsPerLoss: 0,
        pointsPerIndividualGame: 1,
        pointsPerTeamGame: 1,
        pointsPerTeamSeries: 2,
        bonusPointsForSeries: true,
        status: "active",
        userId: 1,
      };

      const result = leagueSchema.safeParse(validLeague);
      expect(result.success).toBe(true);
    });

    it("should reject league with invalid name", () => {
      const invalidLeague = {
        id: "test-id",
        name: "", // Empty name
        teamSize: 4,
        gamesPerSession: 3,
        totalWeeks: 10,
        handicapBasis: 200,
        handicapPercentage: 80,
        maxHandicap: 25,
        useHandicap: true,
        pointSystemType: "matchup",
        pointsPerWin: 2,
        pointsPerTie: 1,
        pointsPerLoss: 0,
        pointsPerIndividualGame: 1,
        pointsPerTeamGame: 1,
        pointsPerTeamSeries: 2,
        bonusPointsForSeries: true,
        status: "active",
        userId: 1,
      };

      const result = leagueSchema.safeParse(invalidLeague);
      expect(result.success).toBe(false);
    });

    it("should reject league with invalid team size", () => {
      const invalidLeague = {
        id: "test-id",
        name: "Test League",
        teamSize: 15, // Too large
        gamesPerSession: 3,
        totalWeeks: 10,
        handicapBasis: 200,
        handicapPercentage: 80,
        maxHandicap: 25,
        useHandicap: true,
        pointSystemType: "matchup",
        pointsPerWin: 2,
        pointsPerTie: 1,
        pointsPerLoss: 0,
        pointsPerIndividualGame: 1,
        pointsPerTeamGame: 1,
        pointsPerTeamSeries: 2,
        bonusPointsForSeries: true,
        status: "active",
        userId: 1,
      };

      const result = leagueSchema.safeParse(invalidLeague);
      expect(result.success).toBe(false);
    });

    it("should reject invalid point system type", () => {
      const invalidLeague = {
        id: "test-id",
        name: "Test League",
        teamSize: 4,
        gamesPerSession: 3,
        totalWeeks: 10,
        handicapBasis: 200,
        handicapPercentage: 80,
        maxHandicap: 25,
        useHandicap: true,
        pointSystemType: "invalid", // Invalid enum
        pointsPerWin: 2,
        pointsPerTie: 1,
        pointsPerLoss: 0,
        pointsPerIndividualGame: 1,
        pointsPerTeamGame: 1,
        pointsPerTeamSeries: 2,
        bonusPointsForSeries: true,
        status: "active",
        userId: 1,
      };

      const result = leagueSchema.safeParse(invalidLeague);
      expect(result.success).toBe(false);
    });

    it("should reject invalid handicap basis", () => {
      const invalidLeague = {
        id: "test-id",
        name: "Test League",
        teamSize: 4,
        gamesPerSession: 3,
        totalWeeks: 10,
        handicapBasis: 100, // Too low (min is 180)
        handicapPercentage: 80,
        maxHandicap: 25,
        useHandicap: true,
        pointSystemType: "matchup",
        pointsPerWin: 2,
        pointsPerTie: 1,
        pointsPerLoss: 0,
        pointsPerIndividualGame: 1,
        pointsPerTeamGame: 1,
        pointsPerTeamSeries: 2,
        bonusPointsForSeries: true,
        status: "active",
        userId: 1,
      };

      const result = leagueSchema.safeParse(invalidLeague);
      expect(result.success).toBe(false);
    });

    it("should allow nullable userId", () => {
      const leagueWithNullUser = {
        id: "test-id",
        name: "Test League",
        teamSize: 4,
        gamesPerSession: 3,
        totalWeeks: 10,
        handicapBasis: 200,
        handicapPercentage: 80,
        maxHandicap: 25,
        useHandicap: true,
        pointSystemType: "matchup",
        pointsPerWin: 2,
        pointsPerTie: 1,
        pointsPerLoss: 0,
        pointsPerIndividualGame: 1,
        pointsPerTeamGame: 1,
        pointsPerTeamSeries: 2,
        bonusPointsForSeries: true,
        status: "active",
        userId: null,
      };

      const result = leagueSchema.safeParse(leagueWithNullUser);
      expect(result.success).toBe(true);
    });
  });

  describe("Insert League Schema", () => {
    it("should not require id and status for insertion", () => {
      const validInsert = {
        name: "New League",
        teamSize: 4,
        gamesPerSession: 3,
        totalWeeks: 10,
        handicapBasis: 200,
        handicapPercentage: 80,
        maxHandicap: 25,
        useHandicap: true,
        pointSystemType: "matchup",
        pointsPerWin: 2,
        pointsPerTie: 1,
        pointsPerLoss: 0,
        pointsPerIndividualGame: 1,
        pointsPerTeamGame: 1,
        pointsPerTeamSeries: 2,
        bonusPointsForSeries: true,
        userId: 1,
      };

      const result = insertLeagueSchema.safeParse(validInsert);
      expect(result.success).toBe(true);
    });
  });

  describe("Team Schema", () => {
    it("should validate a correct team", () => {
      const validTeam = {
        id: "team-1",
        leagueId: "league-1",
        name: "Team Alpha",
      };

      const result = teamSchema.safeParse(validTeam);
      expect(result.success).toBe(true);
    });

    it("should reject team with empty name", () => {
      const invalidTeam = {
        id: "team-1",
        leagueId: "league-1",
        name: "",
      };

      const result = teamSchema.safeParse(invalidTeam);
      expect(result.success).toBe(false);
    });
  });

  describe("Bowler Schema", () => {
    it("should validate a correct bowler", () => {
      const validBowler = {
        id: "bowler-1",
        teamId: "team-1",
        leagueId: "league-1",
        name: "John Doe",
        startingAverage: 180,
      };

      const result = bowlerSchema.safeParse(validBowler);
      expect(result.success).toBe(true);
    });

    it("should reject bowler with invalid average (negative)", () => {
      const invalidBowler = {
        id: "bowler-1",
        teamId: "team-1",
        leagueId: "league-1",
        name: "John Doe",
        startingAverage: -10,
      };

      const result = bowlerSchema.safeParse(invalidBowler);
      expect(result.success).toBe(false);
    });

    it("should reject bowler with average over 300", () => {
      const invalidBowler = {
        id: "bowler-1",
        teamId: "team-1",
        leagueId: "league-1",
        name: "John Doe",
        startingAverage: 350,
      };

      const result = bowlerSchema.safeParse(invalidBowler);
      expect(result.success).toBe(false);
    });

    it("should reject bowler with empty name", () => {
      const invalidBowler = {
        id: "bowler-1",
        teamId: "team-1",
        leagueId: "league-1",
        name: "",
        startingAverage: 180,
      };

      const result = bowlerSchema.safeParse(invalidBowler);
      expect(result.success).toBe(false);
    });
  });

  describe("Game Schema", () => {
    it("should validate a correct game", () => {
      const validGame = {
        id: "game-1",
        leagueId: "league-1",
        week: 1,
        team1Id: "team-1",
        team2Id: "team-2",
        completed: false,
      };

      const result = gameSchema.safeParse(validGame);
      expect(result.success).toBe(true);
    });

    it("should reject game with week less than 1", () => {
      const invalidGame = {
        id: "game-1",
        leagueId: "league-1",
        week: 0,
        team1Id: "team-1",
        team2Id: "team-2",
        completed: false,
      };

      const result = gameSchema.safeParse(invalidGame);
      expect(result.success).toBe(false);
    });
  });

  describe("Score Schema", () => {
    it("should validate a correct score", () => {
      const validScore = {
        id: "score-1",
        gameId: "game-1",
        bowlerId: "bowler-1",
        teamId: "team-1",
        gameNumber: 1,
        score: 200,
      };

      const result = scoreSchema.safeParse(validScore);
      expect(result.success).toBe(true);
    });

    it("should reject score over 300", () => {
      const invalidScore = {
        id: "score-1",
        gameId: "game-1",
        bowlerId: "bowler-1",
        teamId: "team-1",
        gameNumber: 1,
        score: 350,
      };

      const result = scoreSchema.safeParse(invalidScore);
      expect(result.success).toBe(false);
    });

    it("should reject negative score", () => {
      const invalidScore = {
        id: "score-1",
        gameId: "game-1",
        bowlerId: "bowler-1",
        teamId: "team-1",
        gameNumber: 1,
        score: -50,
      };

      const result = scoreSchema.safeParse(invalidScore);
      expect(result.success).toBe(false);
    });

    it("should reject game number less than 1", () => {
      const invalidScore = {
        id: "score-1",
        gameId: "game-1",
        bowlerId: "bowler-1",
        teamId: "team-1",
        gameNumber: 0,
        score: 200,
      };

      const result = scoreSchema.safeParse(invalidScore);
      expect(result.success).toBe(false);
    });

    it("should reject game number greater than 5", () => {
      const invalidScore = {
        id: "score-1",
        gameId: "game-1",
        bowlerId: "bowler-1",
        teamId: "team-1",
        gameNumber: 10,
        score: 200,
      };

      const result = scoreSchema.safeParse(invalidScore);
      expect(result.success).toBe(false);
    });
  });

  describe("Update Schemas", () => {
    it("should allow partial updates with updateLeagueSchema", () => {
      const partialUpdate = {
        name: "Updated Name",
      };

      const result = updateLeagueSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it("should allow partial updates with updateBowlerSchema", () => {
      const partialUpdate = {
        name: "New Name",
        startingAverage: 190,
      };

      const result = updateBowlerSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it("should allow empty updates", () => {
      const emptyUpdate = {};

      const result = updateLeagueSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe("Type Inference", () => {
    it("should correctly infer League type", () => {
      const league: typeof import("../shared/schema").League = {
        id: "test",
        name: "Test",
        teamSize: 4,
        gamesPerSession: 3,
        totalWeeks: 10,
        handicapBasis: 200,
        handicapPercentage: 80,
        maxHandicap: 25,
        useHandicap: true,
        pointSystemType: "matchup",
        pointsPerWin: 2,
        pointsPerTie: 1,
        pointsPerLoss: 0,
        pointsPerIndividualGame: 1,
        pointsPerTeamGame: 1,
        pointsPerTeamSeries: 2,
        bonusPointsForSeries: true,
        status: "active",
        userId: 1,
      };

      expect(league.name).toBe("Test");
    });
  });
});
