import { describe, it, expect, beforeEach } from "vitest";
import { MemStorage } from "../server/storage";
import type { League, Team, Bowler, Score, Game } from "../shared/schema";

describe("Score Calculation", () => {
  let storage: MemStorage;
  let testLeague: League;
  let testTeam1: Team;
  let testTeam2: Team;
  let testBowler1: Bowler;
  let testBowler2: Bowler;

  beforeEach(async () => {
    storage = new MemStorage();
    
    // Create test league with handicap enabled
    testLeague = await storage.createLeague({
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
      userId: 1,
    });

    // Create teams
    testTeam1 = await storage.createTeam({
      leagueId: testLeague.id,
      name: "Team Alpha",
    });
    testTeam2 = await storage.createTeam({
      leagueId: testLeague.id,
      name: "Team Beta",
    });

    // Create bowlers
    testBowler1 = await storage.createBowler({
      teamId: testTeam1.id,
      leagueId: testLeague.id,
      name: "John Doe",
      startingAverage: 180,
    });
    testBowler2 = await storage.createBowler({
      teamId: testTeam2.id,
      leagueId: testLeague.id,
      name: "Jane Smith",
      startingAverage: 200,
    });
  });

  describe("Handicap Calculation", () => {
    it("should calculate handicap correctly", async () => {
      // Create a game with scores
      const game = await storage.createGame({
        leagueId: testLeague.id,
        week: 1,
        team1Id: testTeam1.id,
        team2Id: testTeam2.id,
      });

      // Add scores for bowler 1 (average 180)
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 1,
        score: 200,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 2,
        score: 180,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 3,
        score: 190,
      });

      // Get bowler stats
      const bowlerStats = await storage.getBowlerWithStats(testBowler1.id, testLeague);
      
      expect(bowlerStats).toBeDefined();
      expect(bowlerStats!.gamesPlayed).toBe(3);
      expect(bowlerStats!.totalPins).toBe(570);
      expect(bowlerStats!.average).toBe(190);
      
      // Handicap: (200 - 190) * 0.80 = 8 (capped at maxHandicap 25)
      expect(bowlerStats!.handicap).toBe(8);
    });

    it("should return 0 handicap when average is above basis", async () => {
      // Create a high-average bowler
      const highAvgBowler = await storage.createBowler({
        teamId: testTeam1.id,
        leagueId: testLeague.id,
        name: "Pro Bowler",
        startingAverage: 220,
      });

      const bowlerStats = await storage.getBowlerWithStats(highAvgBowler.id, testLeague);
      
      expect(bowlerStats).toBeDefined();
      expect(bowlerStats!.handicap).toBe(0);
    });

    it("should cap handicap at maxHandicap", async () => {
      // League with low max handicap
      const lowMaxLeague = await storage.createLeague({
        name: "Low Max League",
        teamSize: 4,
        gamesPerSession: 3,
        totalWeeks: 10,
        handicapBasis: 220,
        handicapPercentage: 100,
        maxHandicap: 10, // Low cap
        useHandicap: true,
        pointSystemType: "simple",
        pointsPerWin: 2,
        pointsPerTie: 1,
        pointsPerLoss: 0,
        pointsPerIndividualGame: 1,
        pointsPerTeamGame: 1,
        pointsPerTeamSeries: 2,
        bonusPointsForSeries: false,
        userId: 1,
      });

      // Create bowler with low average
      const lowAvgBowler = await storage.createBowler({
        teamId: testTeam1.id,
        leagueId: lowMaxLeague.id,
        name: "New Bowler",
        startingAverage: 150,
      });

      // Add scores to get average below basis
      const game = await storage.createGame({
        leagueId: lowMaxLeague.id,
        week: 1,
        team1Id: testTeam1.id,
        team2Id: testTeam2.id,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: lowAvgBowler.id,
        teamId: testTeam1.id,
        gameNumber: 1,
        score: 150,
      });

      const bowlerStats = await storage.getBowlerWithStats(lowAvgBowler.id, lowMaxLeague);
      
      // Handicap: (220 - 150) * 1.0 = 70, capped at 10
      expect(bowlerStats!.handicap).toBe(10);
    });

    it("should return 0 handicap when useHandicap is false", async () => {
      const noHandicapLeague = await storage.createLeague({
        name: "No Handicap League",
        teamSize: 4,
        gamesPerSession: 3,
        totalWeeks: 10,
        handicapBasis: 200,
        handicapPercentage: 80,
        maxHandicap: 25,
        useHandicap: false,
        pointSystemType: "simple",
        pointsPerWin: 2,
        pointsPerTie: 1,
        pointsPerLoss: 0,
        pointsPerIndividualGame: 1,
        pointsPerTeamGame: 1,
        pointsPerTeamSeries: 2,
        bonusPointsForSeries: false,
        userId: 1,
      });

      const lowAvgBowler = await storage.createBowler({
        teamId: testTeam1.id,
        leagueId: noHandicapLeague.id,
        name: "Any Bowler",
        startingAverage: 150,
      });

      const bowlerStats = await storage.getBowlerWithStats(lowAvgBowler.id, noHandicapLeague);
      expect(bowlerStats!.handicap).toBe(0);
    });
  });

  describe("Average Calculation", () => {
    it("should calculate average from scores", async () => {
      const game = await storage.createGame({
        leagueId: testLeague.id,
        week: 1,
        team1Id: testTeam1.id,
        team2Id: testTeam2.id,
      });

      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 1,
        score: 150,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 2,
        score: 180,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 3,
        score: 210,
      });

      const bowlerStats = await storage.getBowlerWithStats(testBowler1.id, testLeague);
      
      expect(bowlerStats!.average).toBe(180);
    });

    it("should use startingAverage when no scores exist", async () => {
      const bowlerStats = await storage.getBowlerWithStats(testBowler1.id, testLeague);
      
      expect(bowlerStats!.average).toBe(testBowler1.startingAverage);
    });
  });

  describe("High Game/Series", () => {
    it("should track high game", async () => {
      const game = await storage.createGame({
        leagueId: testLeague.id,
        week: 1,
        team1Id: testTeam1.id,
        team2Id: testTeam2.id,
      });

      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 1,
        score: 200,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 2,
        score: 150,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 3,
        score: 225,
      });

      const bowlerStats = await storage.getBowlerWithStats(testBowler1.id, testLeague);
      expect(bowlerStats!.highGame).toBe(225);
    });

    it("should calculate high series from best 3 games", async () => {
      const game = await storage.createGame({
        leagueId: testLeague.id,
        week: 1,
        team1Id: testTeam1.id,
        team2Id: testTeam2.id,
      });

      // Scores: 200, 150, 225, 180 (4 games)
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 1,
        score: 200,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 2,
        score: 150,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 3,
        score: 225,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 4,
        score: 180,
      });

      const bowlerStats = await storage.getBowlerWithStats(testBowler1.id, testLeague);
      // Best 3: 225 + 200 + 180 = 605
      expect(bowlerStats!.highSeries).toBe(605);
    });
  });

  describe("Team Standings", () => {
    it("should calculate team standings by points", async () => {
      // Create and complete a game
      const game = await storage.createGame({
        leagueId: testLeague.id,
        week: 1,
        team1Id: testTeam1.id,
        team2Id: testTeam2.id,
      });

      // Team 1 scores
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 1,
        score: 200,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 2,
        score: 200,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler1.id,
        teamId: testTeam1.id,
        gameNumber: 3,
        score: 200,
      });

      // Team 2 scores (lower)
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler2.id,
        teamId: testTeam2.id,
        gameNumber: 1,
        score: 150,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler2.id,
        teamId: testTeam2.id,
        gameNumber: 2,
        score: 150,
      });
      await storage.createScore({
        gameId: game.id,
        bowlerId: testBowler2.id,
        teamId: testTeam2.id,
        gameNumber: 3,
        score: 150,
      });

      // Mark game as complete
      await storage.updateGame(game.id, { completed: true });

      const standings = await storage.getTeamStandings(testLeague.id);
      
      expect(standings).toHaveLength(2);
      expect(standings[0].rank).toBe(1);
      expect(standings[0].team.name).toBe("Team Alpha"); // Won
      expect(standings[0].points).toBeGreaterThan(standings[1].points);
    });
  });
});
