import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "../server/storage";
import { isAuthenticated } from "./auth";
import type { User } from "../db/schema";
import "./auth"; // Load global type augmentations
import { 
  insertLeagueSchema, 
  updateLeagueSchema,
  insertTeamSchema, 
  updateTeamSchema,
  insertBowlerSchema, 
  updateBowlerSchema,
  insertBallSchema,
  updateBallSchema,
  insertArsenalSchema,
  updateArsenalSchema,
  insertGameSchema,
  updateGameSchema,
  insertScoreSchema,
  updateScoreSchema
} from "@shared/schema";
import { z } from "zod";
import { extractRosterFromImage, extractScoresFromImage } from "./ocr";
import rateLimit from "express-rate-limit";

// Rate limiter for OCR endpoints (protects OpenAI credits)
const ocrRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_OCR || "10"), // 10 requests per minute
  message: { error: "Too many requests, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Dashboard data - protected
  app.get("/api/dashboard", isAuthenticated, async (req, res) => {
    try {
      const leagues = await storage.getLeagues();
      const teams = await storage.getTeams();
      const bowlers = await storage.getBowlers();
      
      // Batch fetch weeks completed for all leagues (avoids N+1)
      const leagueIds = leagues.map(l => l.id);
      const weeksCompleted = await storage.getWeeksCompletedForLeagues(leagueIds);

      res.json({ leagues, teams, bowlers, weeksCompleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Leagues - protected for mutations
  app.get("/api/leagues", isAuthenticated, async (req, res) => {
    try {
      // Get leagues for the authenticated user
      const userId = req.user?.id;
      if (userId) {
        const leagues = await storage.getLeaguesByUser(userId);
        return res.json(leagues);
      }
      // Fallback to all leagues if no user (shouldn't happen with isAuthenticated)
      const leagues = await storage.getLeagues();
      res.json(leagues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leagues" });
    }
  });

  app.get("/api/leagues/:id", isAuthenticated, async (req, res) => {
    try {
      const league = await storage.getLeague(req.params.id);
      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }

      // Check ownership
      if (league.userId && league.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
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

  app.get("/api/leagues/:id/info", isAuthenticated, async (req, res) => {
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

  app.get("/api/leagues/:id/teams", isAuthenticated, async (req, res) => {
    try {
      const league = await storage.getLeague(req.params.id);
      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }

      // Use batch query to get all teams with stats at once (avoids N+1)
      const teamsWithStats = await storage.getTeamsWithStatsForLeague(league.id);

      // Sort by points (already sorted in the method, but ensuring)
      teamsWithStats.sort((a, b) => b.totalPoints - a.totalPoints);

      res.json({ league, teams: teamsWithStats });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.get("/api/leagues/:id/standings", isAuthenticated, async (req, res) => {
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

  app.get("/api/leagues/:id/scores", isAuthenticated, async (req, res) => {
    try {
      const league = await storage.getLeague(req.params.id);
      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }

      const [teams, bowlers, games, allScores, weeksCompleted, balls, arsenals] = await Promise.all([
        storage.getTeams(league.id),
        storage.getBowlers(league.id),
        storage.getGames(league.id),
        storage.getScores(), // Fetch all scores, filter in memory
        storage.getWeeksCompleted(league.id),
        storage.getBalls(req.user?.id),
        storage.getArsenals(req.user?.id),
      ]);

      // Filter scores to only include games from this league
      const gameIds = new Set(games.map(g => g.id));
      const leagueScores = allScores.filter(s => gameIds.has(s.gameId));

      res.json({
        league,
        teams,
        bowlers,
        games,
        scores: leagueScores,
        balls,
        arsenals,
        currentWeek: weeksCompleted + 1,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scores" });
    }
  });

  app.post("/api/leagues", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertLeagueSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      // Add userId from authenticated user
      const leagueData = { ...parsed.data, userId: req.user?.id };
      const league = await storage.createLeague(leagueData);
      res.status(201).json(league);
    } catch (error) {
      res.status(500).json({ error: "Failed to create league" });
    }
  });

  app.patch("/api/leagues/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = updateLeagueSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const existingLeague = await storage.getLeague(req.params.id);
      if (!existingLeague) {
        return res.status(404).json({ error: "League not found" });
      }
      // Check ownership
      if (existingLeague.userId && existingLeague.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const league = await storage.updateLeague(req.params.id, parsed.data);
      res.json(league);
    } catch (error) {
      res.status(500).json({ error: "Failed to update league" });
    }
  });

  app.delete("/api/leagues/:id", isAuthenticated, async (req, res) => {
    try {
      const existingLeague = await storage.getLeague(req.params.id);
      if (!existingLeague) {
        return res.status(404).json({ error: "League not found" });
      }
      // Check ownership
      if (existingLeague.userId && existingLeague.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const deleted = await storage.deleteLeague(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete league" });
    }
  });

  app.post("/api/leagues/:id/calculate-finals", isAuthenticated, async (req, res) => {
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

  // Teams - all protected
  app.post("/api/teams", isAuthenticated, async (req, res) => {
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

  app.patch("/api/teams/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = updateTeamSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const team = await storage.updateTeam(req.params.id, parsed.data);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team" });
    }
  });

  app.delete("/api/teams/:id", isAuthenticated, async (req, res) => {
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

  // Bowlers - all protected
  app.post("/api/bowlers", isAuthenticated, async (req, res) => {
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

  app.patch("/api/bowlers/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = updateBowlerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const bowler = await storage.updateBowler(req.params.id, parsed.data);
      if (!bowler) {
        return res.status(404).json({ error: "Bowler not found" });
      }
      res.json(bowler);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bowler" });
    }
  });

  app.delete("/api/bowlers/:id", isAuthenticated, async (req, res) => {
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

  // Bowling ball inventory - scoped to the authenticated user
  app.get("/api/balls", isAuthenticated, async (req, res) => {
    try {
      const balls = await storage.getBalls(req.user?.id);
      res.json(balls);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bowling balls" });
    }
  });

  app.post("/api/balls", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertBallSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const ball = await storage.createBall(parsed.data, req.user!.id);
      res.status(201).json(ball);
    } catch (error) {
      res.status(500).json({ error: "Failed to create bowling ball" });
    }
  });

  app.patch("/api/balls/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = updateBallSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const existingBall = await storage.getBall(req.params.id);
      if (!existingBall) {
        return res.status(404).json({ error: "Bowling ball not found" });
      }
      if (existingBall.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const ball = await storage.updateBall(req.params.id, parsed.data);
      res.json(ball);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bowling ball" });
    }
  });

  app.delete("/api/balls/:id", isAuthenticated, async (req, res) => {
    try {
      const existingBall = await storage.getBall(req.params.id);
      if (!existingBall) {
        return res.status(404).json({ error: "Bowling ball not found" });
      }
      if (existingBall.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteBall(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bowling ball" });
    }
  });

  // Named ball sets used to pack for a session
  app.get("/api/arsenals", isAuthenticated, async (req, res) => {
    try {
      const arsenals = await storage.getArsenals(req.user?.id);
      res.json(arsenals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch arsenals" });
    }
  });

  app.post("/api/arsenals", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertArsenalSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const ownedBallIds = new Set((await storage.getBalls(req.user!.id)).map((ball) => ball.id));
      const hasUnownedBall = parsed.data.ballIds.some((ballId) => !ownedBallIds.has(ballId));
      if (hasUnownedBall) {
        return res.status(400).json({ error: "Every selected ball must be in your inventory" });
      }
      const arsenal = await storage.createArsenal(parsed.data, req.user!.id);
      res.status(201).json(arsenal);
    } catch (error) {
      res.status(500).json({ error: "Failed to create arsenal" });
    }
  });

  app.patch("/api/arsenals/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = updateArsenalSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const existingArsenal = await storage.getArsenal(req.params.id);
      if (!existingArsenal) {
        return res.status(404).json({ error: "Arsenal not found" });
      }
      if (existingArsenal.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (parsed.data.ballIds) {
        const ownedBallIds = new Set((await storage.getBalls(req.user!.id)).map((ball) => ball.id));
        const hasUnownedBall = parsed.data.ballIds.some((ballId) => !ownedBallIds.has(ballId));
        if (hasUnownedBall) {
          return res.status(400).json({ error: "Every selected ball must be in your inventory" });
        }
      }
      const arsenal = await storage.updateArsenal(req.params.id, parsed.data);
      res.json(arsenal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update arsenal" });
    }
  });

  app.delete("/api/arsenals/:id", isAuthenticated, async (req, res) => {
    try {
      const existingArsenal = await storage.getArsenal(req.params.id);
      if (!existingArsenal) {
        return res.status(404).json({ error: "Arsenal not found" });
      }
      if (existingArsenal.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteArsenal(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete arsenal" });
    }
  });

  // Games - all protected
  app.post("/api/games", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertGameSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      if (parsed.data.arsenalId) {
        const arsenal = await storage.getArsenal(parsed.data.arsenalId);
        if (!arsenal) {
          return res.status(400).json({ error: "Arsenal not found" });
        }
        if (arsenal.userId !== req.user?.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      const game = await storage.createGame(parsed.data);
      res.status(201).json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  app.patch("/api/games/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = updateGameSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      if (parsed.data.arsenalId) {
        const arsenal = await storage.getArsenal(parsed.data.arsenalId);
        if (!arsenal) {
          return res.status(400).json({ error: "Arsenal not found" });
        }
        if (arsenal.userId !== req.user?.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      const game = await storage.updateGame(req.params.id, parsed.data);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to update game" });
    }
  });

  app.post("/api/games/:id/scores", isAuthenticated, async (req, res) => {
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
          ballId: z.string().nullable().optional(),
        })),
      });

      const parsed = scoresSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const { scores } = parsed.data;

      const gameArsenal = game.arsenalId ? await storage.getArsenal(game.arsenalId) : undefined;
      if (game.arsenalId && !gameArsenal) {
        return res.status(400).json({ error: "The selected arsenal no longer exists" });
      }
      if (gameArsenal && gameArsenal.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }

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
        if (scoreData.ballId) {
          if (!gameArsenal) {
            return res.status(400).json({ error: "Select an arsenal before recording a ball" });
          }
          if (!gameArsenal.ballIds.includes(scoreData.ballId)) {
            return res.status(400).json({ error: "The selected ball is not in this game's arsenal" });
          }
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
          ballId: scoreData.ballId ?? null,
        });
      }

      // Mark game as completed
      await storage.updateGame(gameId, { completed: true });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save scores" });
    }
  });

  app.delete("/api/games/:id", isAuthenticated, async (req, res) => {
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

  // Scores - all protected
  app.patch("/api/scores/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = updateScoreSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const score = await storage.updateScore(req.params.id, parsed.data);
      if (!score) {
        return res.status(404).json({ error: "Score not found" });
      }
      res.json(score);
    } catch (error) {
      res.status(500).json({ error: "Failed to update score" });
    }
  });

  // OCR Routes for photo scanning - protected with rate limiting
  app.post("/api/ocr/roster", isAuthenticated, ocrRateLimiter, async (req, res) => {
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

  app.post("/api/ocr/scores", isAuthenticated, ocrRateLimiter, async (req, res) => {
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
