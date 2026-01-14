import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertLeagueSchema, 
  insertTeamSchema, 
  insertBowlerSchema, 
  insertGameSchema,
  insertScoreSchema 
} from "@shared/schema";
import { z } from "zod";
import { extractRosterFromImage, extractScoresFromImage } from "./ocr";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Dashboard data
  app.get("/api/dashboard", async (req, res) => {
    try {
      const leagues = await storage.getLeagues();
      const teams = await storage.getTeams();
      const bowlers = await storage.getBowlers();
      
      const weeksCompleted: Record<string, number> = {};
      for (const league of leagues) {
        weeksCompleted[league.id] = await storage.getWeeksCompleted(league.id);
      }

      res.json({ leagues, teams, bowlers, weeksCompleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Leagues
  app.get("/api/leagues", async (req, res) => {
    try {
      const leagues = await storage.getLeagues();
      res.json(leagues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leagues" });
    }
  });

  app.get("/api/leagues/:id", async (req, res) => {
    try {
      const league = await storage.getLeague(req.params.id);
      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }

      const teams = await storage.getTeams(league.id);
      const teamStandings = await storage.getTeamStandings(league.id);
      const individualStandings = await storage.getIndividualStandings(league.id);
      const recentGames = await storage.getGames(league.id);
      const weeksCompleted = await storage.getWeeksCompleted(league.id);

      res.json({
        league,
        teams,
        teamStandings,
        individualStandings,
        recentGames: recentGames.slice(-10),
        weeksCompleted,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch league" });
    }
  });

  app.get("/api/leagues/:id/info", async (req, res) => {
    try {
      const league = await storage.getLeague(req.params.id);
      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }
      res.json(league);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch league" });
    }
  });

  app.get("/api/leagues/:id/teams", async (req, res) => {
    try {
      const league = await storage.getLeague(req.params.id);
      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }

      const teams = await storage.getTeams(league.id);
      const teamsWithStats = [];
      for (const team of teams) {
        const stats = await storage.getTeamWithStats(team.id, league);
        if (stats) teamsWithStats.push(stats);
      }

      // Sort by points
      teamsWithStats.sort((a, b) => b.totalPoints - a.totalPoints);

      res.json({ league, teams: teamsWithStats });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.get("/api/leagues/:id/standings", async (req, res) => {
    try {
      const league = await storage.getLeague(req.params.id);
      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }

      const teamStandings = await storage.getTeamStandings(league.id);
      const individualStandings = await storage.getIndividualStandings(league.id);

      res.json({ league, teamStandings, individualStandings });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch standings" });
    }
  });

  app.get("/api/leagues/:id/scores", async (req, res) => {
    try {
      const league = await storage.getLeague(req.params.id);
      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }

      const teams = await storage.getTeams(league.id);
      const bowlers = await storage.getBowlers(league.id);
      const games = await storage.getGames(league.id);
      
      const allScores = [];
      for (const game of games) {
        const gameScores = await storage.getScores(game.id);
        allScores.push(...gameScores);
      }

      const weeksCompleted = await storage.getWeeksCompleted(league.id);

      res.json({
        league,
        teams,
        bowlers,
        games,
        scores: allScores,
        currentWeek: weeksCompleted + 1,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scores" });
    }
  });

  app.post("/api/leagues", async (req, res) => {
    try {
      const parsed = insertLeagueSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const league = await storage.createLeague(parsed.data);
      res.status(201).json(league);
    } catch (error) {
      res.status(500).json({ error: "Failed to create league" });
    }
  });

  app.patch("/api/leagues/:id", async (req, res) => {
    try {
      const league = await storage.updateLeague(req.params.id, req.body);
      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }
      res.json(league);
    } catch (error) {
      res.status(500).json({ error: "Failed to update league" });
    }
  });

  app.delete("/api/leagues/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteLeague(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "League not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete league" });
    }
  });

  app.post("/api/leagues/:id/calculate-finals", async (req, res) => {
    try {
      const league = await storage.getLeague(req.params.id);
      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }

      // Mark league as completed
      await storage.updateLeague(req.params.id, { status: "completed" });

      // Calculate final standings
      const standings = await storage.getTeamStandings(league.id);

      res.json({ success: true, standings });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate finals" });
    }
  });

  // Teams
  app.post("/api/teams", async (req, res) => {
    try {
      const parsed = insertTeamSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const team = await storage.createTeam(parsed.data);
      res.status(201).json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.patch("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.updateTeam(req.params.id, req.body);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team" });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTeam(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete team" });
    }
  });

  // Bowlers
  app.post("/api/bowlers", async (req, res) => {
    try {
      const parsed = insertBowlerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const bowler = await storage.createBowler(parsed.data);
      res.status(201).json(bowler);
    } catch (error) {
      res.status(500).json({ error: "Failed to create bowler" });
    }
  });

  app.patch("/api/bowlers/:id", async (req, res) => {
    try {
      const bowler = await storage.updateBowler(req.params.id, req.body);
      if (!bowler) {
        return res.status(404).json({ error: "Bowler not found" });
      }
      res.json(bowler);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bowler" });
    }
  });

  app.delete("/api/bowlers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBowler(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Bowler not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bowler" });
    }
  });

  // Games
  app.post("/api/games", async (req, res) => {
    try {
      const parsed = insertGameSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const game = await storage.createGame(parsed.data);
      res.status(201).json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  app.post("/api/games/:id/scores", async (req, res) => {
    try {
      const gameId = req.params.id;
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      // Validate scores array
      const scoresSchema = z.object({
        scores: z.array(z.object({
          bowlerId: z.string().min(1),
          teamId: z.string().min(1),
          gameNumber: z.number().min(1).max(5),
          score: z.number().min(0).max(300),
        })),
      });

      const parsed = scoresSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const { scores } = parsed.data;

      // Validate that all bowlers and teams exist and belong to the game
      for (const scoreData of scores) {
        const bowler = await storage.getBowler(scoreData.bowlerId);
        if (!bowler) {
          return res.status(400).json({ error: `Bowler ${scoreData.bowlerId} not found` });
        }
        if (scoreData.teamId !== game.team1Id && scoreData.teamId !== game.team2Id) {
          return res.status(400).json({ error: `Team ${scoreData.teamId} is not part of this game` });
        }
        if (bowler.teamId !== scoreData.teamId) {
          return res.status(400).json({ error: `Bowler ${bowler.name} is not on team ${scoreData.teamId}` });
        }
      }

      // Delete existing scores for this game
      await storage.deleteScoresByGame(gameId);

      // Create new scores
      for (const scoreData of scores) {
        await storage.createScore({
          gameId,
          bowlerId: scoreData.bowlerId,
          teamId: scoreData.teamId,
          gameNumber: scoreData.gameNumber,
          score: scoreData.score,
        });
      }

      // Mark game as completed
      await storage.updateGame(gameId, { completed: true });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save scores" });
    }
  });

  app.delete("/api/games/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGame(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete game" });
    }
  });

  // OCR Routes for photo scanning
  app.post("/api/ocr/roster", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Remove data URL prefix if present
      const base64Image = image.replace(/^data:image\/\w+;base64,/, "");
      
      const result = await extractRosterFromImage(base64Image);
      res.json(result);
    } catch (error) {
      console.error("OCR roster error:", error);
      res.status(500).json({ error: "Failed to extract roster from image" });
    }
  });

  app.post("/api/ocr/scores", async (req, res) => {
    try {
      const { image, bowlerNames } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Remove data URL prefix if present
      const base64Image = image.replace(/^data:image\/\w+;base64,/, "");
      
      const result = await extractScoresFromImage(base64Image, bowlerNames);
      res.json(result);
    } catch (error) {
      console.error("OCR scores error:", error);
      res.status(500).json({ error: "Failed to extract scores from image" });
    }
  });

  return httpServer;
}
