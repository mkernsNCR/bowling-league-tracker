import { eq, and, desc, sql, like, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './index';
import { leagues, teams, bowlers, games, scores, users } from './schema';
import type { User } from './schema';
import type { IStorage } from '../server/storage';
import type {
  League,
  InsertLeague,
  Team,
  InsertTeam,
  Bowler,
  InsertBowler,
  Game,
  InsertGame,
  Score,
  InsertScore,
  BowlerWithStats,
  TeamWithStats,
  StandingsEntry,
} from '@shared/schema';
import type { NewUser } from './schema';

export class DbStorage implements IStorage {
  // Users
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0];
  }

  async createUser(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.insert(users).values({ username, password: hashedPassword }).returning();
    return result[0];
  }

  async createUserWithGoogle(googleId: string, username: string, email: string): Promise<User> {
    // Check if user with this email already exists
    const existingUser = await this.getUserByUsername(email);
    if (existingUser) {
      // Link Google ID to existing user
      const result = await db.update(users).set({ googleId }).where(eq(users.id, existingUser.id)).returning();
      return result[0];
    }
    // Create new user with Google
    const result = await db.insert(users).values({ username, googleId }).returning();
    return result[0];
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  // Leagues
  async getLeagues(): Promise<League[]> {
    const result = await db.select().from(leagues).orderBy(desc(leagues.createdAt));
    return result as League[];
  }

  async getLeaguesByUser(userId: number): Promise<League[]> {
    const result = await db.select().from(leagues).where(eq(leagues.userId, userId)).orderBy(desc(leagues.createdAt));
    return result as League[];
  }

  async getLeague(id: string): Promise<League | undefined> {
    const result = await db.select().from(leagues).where(eq(leagues.id, id)).limit(1);
    return result[0] as League | undefined;
    return result[0];
  }

  async createLeague(league: InsertLeague): Promise<League> {
    const id = randomUUID();
    const newLeague: League = { ...league, id, status: 'active' };
    const result = await db.insert(leagues).values(newLeague).returning();
    return result[0];
  }

  async updateLeague(id: string, updates: Partial<League>): Promise<League | undefined> {
    const result = await db
      .update(leagues)
      .set(updates)
      .where(eq(leagues.id, id))
      .returning();
    return result[0];
  }

  async deleteLeague(id: string): Promise<boolean> {
    // Delete related data (cascade should handle most, but being explicit)
    const leagueTeams = await db.select().from(teams).where(eq(teams.leagueId, id));
    for (const team of leagueTeams) {
      await this.deleteTeam(team.id);
    }
    
    const leagueGames = await db.select().from(games).where(eq(games.leagueId, id));
    for (const game of leagueGames) {
      await this.deleteGame(game.id);
    }

    const result = await db.delete(leagues).where(eq(leagues.id, id)).returning();
    return result.length > 0;
  }

  // Teams
  async getTeams(leagueId?: string): Promise<Team[]> {
    if (leagueId) {
      const result = await db.select().from(teams).where(eq(teams.leagueId, leagueId));
      return result;
    }
    const result = await db.select().from(teams);
    return result;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    return result[0];
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const newTeam: Team = { ...team, id };
    const result = await db.insert(teams).values(newTeam).returning();
    return result[0];
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const result = await db
      .update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning();
    return result[0];
  }

  async deleteTeam(id: string): Promise<boolean> {
    // Delete all bowlers in the team
    const teamBowlers = await db.select().from(bowlers).where(eq(bowlers.teamId, id));
    for (const bowler of teamBowlers) {
      await this.deleteBowler(bowler.id);
    }
    const result = await db.delete(teams).where(eq(teams.id, id)).returning();
    return result.length > 0;
  }

  // Bowlers
  async getBowlers(leagueId?: string, teamId?: string): Promise<Bowler[]> {
    let conditions = [];
    if (leagueId) {
      conditions.push(eq(bowlers.leagueId, leagueId));
    }
    if (teamId) {
      conditions.push(eq(bowlers.teamId, teamId));
    }
    
    if (conditions.length > 0) {
      const result = await db.select().from(bowlers).where(and(...conditions));
      return result;
    }
    const result = await db.select().from(bowlers);
    return result;
  }

  async getBowler(id: string): Promise<Bowler | undefined> {
    const result = await db.select().from(bowlers).where(eq(bowlers.id, id)).limit(1);
    return result[0];
  }

  async createBowler(bowler: InsertBowler): Promise<Bowler> {
    const id = randomUUID();
    const newBowler: Bowler = { ...bowler, id };
    const result = await db.insert(bowlers).values(newBowler).returning();
    return result[0];
  }

  async updateBowler(id: string, updates: Partial<Bowler>): Promise<Bowler | undefined> {
    const result = await db
      .update(bowlers)
      .set(updates)
      .where(eq(bowlers.id, id))
      .returning();
    return result[0];
  }

  async deleteBowler(id: string): Promise<boolean> {
    // Delete all scores for this bowler
    await db.delete(scores).where(eq(scores.bowlerId, id));
    const result = await db.delete(bowlers).where(eq(bowlers.id, id)).returning();
    return result.length > 0;
  }

  // Games
  async getGames(leagueId?: string): Promise<Game[]> {
    if (leagueId) {
      const result = await db.select().from(games).where(eq(games.leagueId, leagueId)).orderBy(desc(games.week));
      return result;
    }
    const result = await db.select().from(games).orderBy(desc(games.week));
    return result;
  }

  async getGame(id: string): Promise<Game | undefined> {
    const result = await db.select().from(games).where(eq(games.id, id)).limit(1);
    return result[0];
  }

  async createGame(game: InsertGame): Promise<Game> {
    const id = randomUUID();
    const newGame: Game = { ...game, id, completed: false };
    const result = await db.insert(games).values(newGame).returning();
    return result[0];
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const result = await db
      .update(games)
      .set(updates)
      .where(eq(games.id, id))
      .returning();
    return result[0];
  }

  async deleteGame(id: string): Promise<boolean> {
    await this.deleteScoresByGame(id);
    const result = await db.delete(games).where(eq(games.id, id)).returning();
    return result.length > 0;
  }

  // Scores
  async getScores(gameId?: string): Promise<Score[]> {
    if (gameId) {
      const result = await db.select().from(scores).where(eq(scores.gameId, gameId));
      return result;
    }
    const result = await db.select().from(scores);
    return result;
  }

  async getScoresByBowler(bowlerId: string): Promise<Score[]> {
    const result = await db.select().from(scores).where(eq(scores.bowlerId, bowlerId));
    return result;
  }

  async createScore(score: InsertScore): Promise<Score> {
    const id = randomUUID();
    const newScore: Score = { ...score, id };
    const result = await db.insert(scores).values(newScore).returning();
    return result[0];
  }

  async updateScore(id: string, updates: Partial<Score>): Promise<Score | undefined> {
    const result = await db
      .update(scores)
      .set(updates)
      .where(eq(scores.id, id))
      .returning();
    return result[0];
  }

  async deleteScore(id: string): Promise<boolean> {
    const result = await db.delete(scores).where(eq(scores.id, id)).returning();
    return result.length > 0;
  }

  async deleteScoresByGame(gameId: string): Promise<boolean> {
    await db.delete(scores).where(eq(scores.gameId, gameId));
    return true;
  }

  // Computed methods
  private calculateHandicap(average: number, league: League): number {
    if (!league.useHandicap) return 0;
    const diff = league.handicapBasis - average;
    if (diff <= 0) return 0;
    const handicap = Math.floor(diff * (league.handicapPercentage / 100));
    return Math.min(handicap, league.maxHandicap);
  }

  async getBowlerWithStats(bowlerId: string, league: League): Promise<BowlerWithStats | undefined> {
    const bowler = await this.getBowler(bowlerId);
    if (!bowler) return undefined;

    const scoresData = await this.getScoresByBowler(bowlerId);
    const gamesPlayed = scoresData.length;
    const totalPins = scoresData.reduce((sum, s) => sum + s.score, 0);
    const average = gamesPlayed > 0 ? totalPins / gamesPlayed : bowler.startingAverage;
    const handicap = this.calculateHandicap(average, league);
    const highGame = scoresData.length > 0 ? Math.max(...scoresData.map(s => s.score)) : 0;

    // Calculate high series (best 3 consecutive games)
    let highSeries = 0;
    if (scoresData.length >= 3) {
      const sortedScores = [...scoresData].sort((a, b) => b.score - a.score);
      highSeries = sortedScores.slice(0, 3).reduce((sum, s) => sum + s.score, 0);
    } else if (scoresData.length > 0) {
      highSeries = totalPins;
    }

    return {
      ...bowler,
      gamesPlayed,
      totalPins,
      average,
      handicap,
      highGame,
      highSeries,
    };
  }

  async getTeamWithStats(teamId: string, league: League): Promise<TeamWithStats | undefined> {
    const team = await this.getTeam(teamId);
    if (!team) return undefined;

    const teamBowlers = await this.getBowlers(undefined, teamId);
    const bowlersWithStats: BowlerWithStats[] = [];

    for (const bowler of teamBowlers) {
      const stats = await this.getBowlerWithStats(bowler.id, league);
      if (stats) bowlersWithStats.push(stats);
    }

    // Calculate team stats from games
    const allGames = await this.getGames(league.id);
    const teamGames = allGames.filter(g =>
      (g.team1Id === teamId || g.team2Id === teamId) && g.completed
    );

    let wins = 0, losses = 0, ties = 0;
    let totalPins = 0, handicapPins = 0;
    let totalPoints = 0;

    // Get all bowlers with stats for handicap calculation (cache)
    const bowlerStatsCache = new Map<string, BowlerWithStats>();
    for (const b of bowlersWithStats) {
      bowlerStatsCache.set(b.id, b);
    }

    for (const game of teamGames) {
      const gameScores = await this.getScores(game.id);
      const teamScoresData = gameScores.filter(s => s.teamId === teamId);
      const opponentId = game.team1Id === teamId ? game.team2Id : game.team1Id;
      const opponentScoresData = gameScores.filter(s => s.teamId === opponentId);

      // Get opponent bowlers with stats
      const opponentBowlers = await this.getBowlers(undefined, opponentId);
      for (const ob of opponentBowlers) {
        if (!bowlerStatsCache.has(ob.id)) {
          const stats = await this.getBowlerWithStats(ob.id, league);
          if (stats) bowlerStatsCache.set(ob.id, stats);
        }
      }

      // Accumulate total pins and handicap pins
      for (const score of teamScoresData) {
        totalPins += score.score;
        const bowlerStats = bowlerStatsCache.get(score.bowlerId);
        if (bowlerStats && league.useHandicap) {
          handicapPins += bowlerStats.handicap;
        }
      }

      // Calculate points based on point system type
      const pointSystemType = league.pointSystemType || "matchup";
      const pointsPerIndividualGame = league.pointsPerIndividualGame ?? 1;
      const pointsPerTeamGame = league.pointsPerTeamGame ?? 1;
      const pointsPerTeamSeries = league.pointsPerTeamSeries ?? 2;

      if (pointSystemType === "matchup") {
        // Matchup system: bowler vs bowler for each game number, then team totals

        // Group scores by game number
        const teamScoresByGame: Record<number, { bowlerId: string; score: number; handicap: number }[]> = {};
        const oppScoresByGame: Record<number, { bowlerId: string; score: number; handicap: number }[]> = {};

        for (let gameNum = 1; gameNum <= league.gamesPerSession; gameNum++) {
          teamScoresByGame[gameNum] = [];
          oppScoresByGame[gameNum] = [];
        }

        for (const score of teamScoresData) {
          const bowlerStats = bowlerStatsCache.get(score.bowlerId);
          const hcp = league.useHandicap ? (bowlerStats?.handicap || 0) : 0;
          teamScoresByGame[score.gameNumber]?.push({
            bowlerId: score.bowlerId,
            score: score.score,
            handicap: hcp
          });
        }

        for (const score of opponentScoresData) {
          const bowlerStats = bowlerStatsCache.get(score.bowlerId);
          const hcp = league.useHandicap ? (bowlerStats?.handicap || 0) : 0;
          oppScoresByGame[score.gameNumber]?.push({
            bowlerId: score.bowlerId,
            score: score.score,
            handicap: hcp
          });
        }

        let teamSeriesTotal = 0;
        let oppSeriesTotal = 0;

        // For each game, match bowlers by position and compare
        for (let gameNum = 1; gameNum <= league.gamesPerSession; gameNum++) {
          const teamGameScores = teamScoresByGame[gameNum] || [];
          const oppGameScores = oppScoresByGame[gameNum] || [];

          let teamGameTotal = 0;
          let oppGameTotal = 0;

          // Individual matchups (position-based)
          const maxBowlers = Math.max(teamGameScores.length, oppGameScores.length);
          for (let pos = 0; pos < maxBowlers; pos++) {
            const teamScore = teamGameScores[pos];
            const oppScore = oppGameScores[pos];

            if (teamScore) {
              const teamWithHcp = teamScore.score + teamScore.handicap;
              teamGameTotal += teamWithHcp;

              if (oppScore) {
                const oppWithHcp = oppScore.score + oppScore.handicap;
                oppGameTotal += oppWithHcp;

                // Award point if team bowler wins
                if (teamWithHcp > oppWithHcp) {
                  totalPoints += pointsPerIndividualGame;
                }
              } else {
                // No opponent - team bowler wins by default (vacant spot)
                totalPoints += pointsPerIndividualGame;
              }
            } else if (oppScore) {
              // Team has vacant spot - opponent wins this matchup
              oppGameTotal += oppScore.score + oppScore.handicap;
            }
          }

          teamSeriesTotal += teamGameTotal;
          oppSeriesTotal += oppGameTotal;

          // Team game total point
          if (teamGameTotal > oppGameTotal) {
            totalPoints += pointsPerTeamGame;
          }
        }

        // Team series point
        if (teamSeriesTotal > oppSeriesTotal) {
          totalPoints += pointsPerTeamSeries;
          wins++;
        } else if (teamSeriesTotal < oppSeriesTotal) {
          losses++;
        } else {
          ties++;
        }

      } else {
        // Simple system: just overall series win/loss/tie
        let teamSeriesTotal = 0;
        let oppSeriesTotal = 0;

        for (const score of teamScoresData) {
          const bowlerStats = bowlerStatsCache.get(score.bowlerId);
          const hcp = league.useHandicap ? (bowlerStats?.handicap || 0) : 0;
          teamSeriesTotal += score.score + hcp;
        }

        for (const score of opponentScoresData) {
          const bowlerStats = bowlerStatsCache.get(score.bowlerId);
          const hcp = league.useHandicap ? (bowlerStats?.handicap || 0) : 0;
          oppSeriesTotal += score.score + hcp;
        }

        if (teamSeriesTotal > oppSeriesTotal) {
          wins++;
          totalPoints += league.pointsPerWin;
        } else if (teamSeriesTotal < oppSeriesTotal) {
          losses++;
          totalPoints += league.pointsPerLoss;
        } else {
          ties++;
          totalPoints += league.pointsPerTie;
        }
      }
    }

    return {
      ...team,
      bowlers: bowlersWithStats,
      totalPoints,
      wins,
      losses,
      ties,
      totalPins,
      handicapPins,
      gamesPlayed: teamGames.length,
    };
  }

  async getTeamStandings(leagueId: string): Promise<StandingsEntry[]> {
    const league = await this.getLeague(leagueId);
    if (!league) return [];

    // Use batch query to get all teams with stats at once (avoids N+1)
    const teamsWithStats = await this.getTeamsWithStatsForLeague(leagueId);

    const standings: StandingsEntry[] = teamsWithStats.map(team => ({
      rank: 0,
      team,
      scratchTotal: team.totalPins,
      handicapTotal: team.handicapPins,
      points: team.totalPoints,
    }));

    // Sort by points, then by total (scratch + handicap)
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aTotalWithHandicap = a.scratchTotal + (league.useHandicap ? a.handicapTotal : 0);
      const bTotalWithHandicap = b.scratchTotal + (league.useHandicap ? b.handicapTotal : 0);
      return bTotalWithHandicap - aTotalWithHandicap;
    });

    // Assign ranks
    standings.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return standings;
  }

  // Batch query for individual standings (avoids N+1)
  async getIndividualStandings(leagueId: string): Promise<BowlerWithStats[]> {
    const league = await this.getLeague(leagueId);
    if (!league) return [];

    // Batch fetch: bowlers and all scores
    const [bowlersData, allScores] = await Promise.all([
      this.getBowlers(leagueId),
      this.getScores(),
    ]);

    // Build scores lookup
    const scoresByBowler = new Map<string, Score[]>();
    for (const score of allScores) {
      const bowlerScores = scoresByBowler.get(score.bowlerId) || [];
      bowlerScores.push(score);
      scoresByBowler.set(score.bowlerId, bowlerScores);
    }

    // Calculate stats for each bowler
    const bowlersWithStats: BowlerWithStats[] = [];
    for (const bowler of bowlersData) {
      const bowlerScores = scoresByBowler.get(bowler.id) || [];
      const gamesPlayed = bowlerScores.length;
      const totalPins = bowlerScores.reduce((sum, s) => sum + s.score, 0);
      const average = gamesPlayed > 0 ? totalPins / gamesPlayed : bowler.startingAverage;
      const handicap = this.calculateHandicap(average, league);
      const highGame = bowlerScores.length > 0 ? Math.max(...bowlerScores.map(s => s.score)) : 0;

      let highSeries = 0;
      if (bowlerScores.length >= 3) {
        const sortedScores = [...bowlerScores].sort((a, b) => b.score - a.score);
        highSeries = sortedScores.slice(0, 3).reduce((sum, s) => sum + s.score, 0);
      } else if (bowlerScores.length > 0) {
        highSeries = totalPins;
      }

      bowlersWithStats.push({
        ...bowler,
        gamesPlayed,
        totalPins,
        average,
        handicap,
        highGame,
        highSeries,
      });
    }

    // Sort by average
    bowlersWithStats.sort((a, b) => b.average - a.average);

    return bowlersWithStats;
  }

  async getWeeksCompleted(leagueId: string): Promise<number> {
    const gamesData = await this.getGames(leagueId);
    const completedGames = gamesData.filter(g => g.completed);
    if (completedGames.length === 0) return 0;
    return Math.max(...completedGames.map(g => g.week));
  }

  // Batch query to get weeks completed for multiple leagues (avoids N+1)
  async getWeeksCompletedForLeagues(leagueIds: string[]): Promise<Record<string, number>> {
    if (leagueIds.length === 0) return {};
    
    // Fetch all games for all leagues in one query
    const allGames = await db
      .select()
      .from(games)
      .where(and(
        sql`${games.leagueId} IN ${leagueIds}`,
        eq(games.completed, true)
      ));
    
    // Group by leagueId and find max week
    const weeksMap: Record<string, number> = {};
    for (const leagueId of leagueIds) {
      weeksMap[leagueId] = 0;
    }
    
    for (const game of allGames) {
      if (game.week > (weeksMap[game.leagueId] || 0)) {
        weeksMap[game.leagueId] = game.week;
      }
    }
    
    return weeksMap;
  }

  // Get teams with stats for a league in one query (avoids N+1)
  async getTeamsWithStatsForLeague(leagueId: string): Promise<TeamWithStats[]> {
    const league = await this.getLeague(leagueId);
    if (!league) return [];

    // Batch fetch: teams, bowlers, games, scores
    const [teamsData, bowlersData, gamesData, allScores] = await Promise.all([
      this.getTeams(leagueId),
      this.getBowlers(leagueId),
      this.getGames(leagueId),
      this.getScores(),
    ]);

    // Build lookup maps
    const bowlersByTeam = new Map<string, Bowler[]>();
    const scoresByGame = new Map<string, Score[]>();
    const gamesById = new Map<string, Game>();

    for (const bowler of bowlersData) {
      const teamBowlers = bowlersByTeam.get(bowler.teamId) || [];
      teamBowlers.push(bowler);
      bowlersByTeam.set(bowler.teamId, teamBowlers);
    }

    for (const score of allScores) {
      const gameScores = scoresByGame.get(score.gameId) || [];
      gameScores.push(score);
      scoresByGame.set(score.gameId, gameScores);
    }

    for (const game of gamesData) {
      gamesById.set(game.id, game);
    }

    // Calculate stats for each team
    const teamsWithStats: TeamWithStats[] = [];

    for (const team of teamsData) {
      const teamBowlers = bowlersByTeam.get(team.id) || [];
      
      // Calculate bowler stats
      const bowlersWithStats: BowlerWithStats[] = [];
      for (const bowler of teamBowlers) {
        const bowlerScores = allScores.filter(s => s.bowlerId === bowler.id);
        const gamesPlayed = bowlerScores.length;
        const totalPins = bowlerScores.reduce((sum, s) => sum + s.score, 0);
        const average = gamesPlayed > 0 ? totalPins / gamesPlayed : bowler.startingAverage;
        const handicap = this.calculateHandicap(average, league);
        const highGame = bowlerScores.length > 0 ? Math.max(...bowlerScores.map(s => s.score)) : 0;

        let highSeries = 0;
        if (bowlerScores.length >= 3) {
          const sortedScores = [...bowlerScores].sort((a, b) => b.score - a.score);
          highSeries = sortedScores.slice(0, 3).reduce((sum, s) => sum + s.score, 0);
        } else if (bowlerScores.length > 0) {
          highSeries = totalPins;
        }

        bowlersWithStats.push({
          ...bowler,
          gamesPlayed,
          totalPins,
          average,
          handicap,
          highGame,
          highSeries,
        });
      }

      // Calculate team stats from games
      const teamGames = gamesData.filter(g =>
        (g.team1Id === team.id || g.team2Id === team.id) && g.completed
      );

      let wins = 0, losses = 0, ties = 0;
      let totalPins = 0, handicapPins = 0;
      let totalPoints = 0;

      for (const game of teamGames) {
        const gameScores = scoresByGame.get(game.id) || [];
        const teamScoresData = gameScores.filter(s => s.teamId === team.id);
        const opponentId = game.team1Id === team.id ? game.team2Id : game.team1Id;
        const opponentScoresData = gameScores.filter(s => s.teamId === opponentId);

        // Accumulate total pins and handicap pins
        for (const score of teamScoresData) {
          totalPins += score.score;
          const bowlerStats = bowlersWithStats.find(b => b.id === score.bowlerId);
          if (bowlerStats && league.useHandicap) {
            handicapPins += bowlerStats.handicap;
          }
        }

        // Calculate points based on point system type
        const pointSystemType = league.pointSystemType || "matchup";
        const pointsPerIndividualGame = league.pointsPerIndividualGame ?? 1;
        const pointsPerTeamGame = league.pointsPerTeamGame ?? 1;
        const pointsPerTeamSeries = league.pointsPerTeamSeries ?? 2;

        if (pointSystemType === "matchup") {
          // Group scores by game number
          const teamScoresByGame: Record<number, { score: number; handicap: number }[]> = {};
          const oppScoresByGame: Record<number, { score: number; handicap: number }[]> = {};

          for (let gameNum = 1; gameNum <= league.gamesPerSession; gameNum++) {
            teamScoresByGame[gameNum] = [];
            oppScoresByGame[gameNum] = [];
          }

          for (const score of teamScoresData) {
            const bowlerStats = bowlersWithStats.find(b => b.id === score.bowlerId);
            const hcp = league.useHandicap ? (bowlerStats?.handicap || 0) : 0;
            teamScoresByGame[score.gameNumber]?.push({ score: score.score, handicap: hcp });
          }

          for (const score of opponentScoresData) {
            const bowlerStats = bowlersWithStats.find(b => b.id === score.bowlerId);
            const hcp = league.useHandicap ? (bowlerStats?.handicap || 0) : 0;
            oppScoresByGame[score.gameNumber]?.push({ score: score.score, handicap: hcp });
          }

          let teamSeriesTotal = 0;
          let oppSeriesTotal = 0;

          for (let gameNum = 1; gameNum <= league.gamesPerSession; gameNum++) {
            const teamGameScores = teamScoresByGame[gameNum] || [];
            const oppGameScores = oppScoresByGame[gameNum] || [];

            let teamGameTotal = 0;
            let oppGameTotal = 0;

            const maxBowlers = Math.max(teamGameScores.length, oppGameScores.length);
            for (let pos = 0; pos < maxBowlers; pos++) {
              const teamScore = teamGameScores[pos];
              const oppScore = oppGameScores[pos];

              if (teamScore) {
                const teamWithHcp = teamScore.score + teamScore.handicap;
                teamGameTotal += teamWithHcp;

                if (oppScore) {
                  const oppWithHcp = oppScore.score + oppScore.handicap;
                  oppGameTotal += oppWithHcp;

                  if (teamWithHcp > oppWithHcp) {
                    totalPoints += pointsPerIndividualGame;
                  }
                } else {
                  totalPoints += pointsPerIndividualGame;
                }
              } else if (oppScore) {
                oppGameTotal += oppScore.score + oppScore.handicap;
              }
            }

            teamSeriesTotal += teamGameTotal;
            oppSeriesTotal += oppGameTotal;

            if (teamGameTotal > oppGameTotal) {
              totalPoints += pointsPerTeamGame;
            }
          }

          if (teamSeriesTotal > oppSeriesTotal) {
            totalPoints += pointsPerTeamSeries;
            wins++;
          } else if (teamSeriesTotal < oppSeriesTotal) {
            losses++;
          } else {
            ties++;
          }

        } else {
          // Simple system
          let teamSeriesTotal = 0;
          let oppSeriesTotal = 0;

          for (const score of teamScoresData) {
            const bowlerStats = bowlersWithStats.find(b => b.id === score.bowlerId);
            const hcp = league.useHandicap ? (bowlerStats?.handicap || 0) : 0;
            teamSeriesTotal += score.score + hcp;
          }

          for (const score of opponentScoresData) {
            const bowlerStats = bowlersWithStats.find(b => b.id === score.bowlerId);
            const hcp = league.useHandicap ? (bowlerStats?.handicap || 0) : 0;
            oppSeriesTotal += score.score + hcp;
          }

          if (teamSeriesTotal > oppSeriesTotal) {
            wins++;
            totalPoints += league.pointsPerWin;
          } else if (teamSeriesTotal < oppSeriesTotal) {
            losses++;
            totalPoints += league.pointsPerLoss;
          } else {
            ties++;
            totalPoints += league.pointsPerTie;
          }
        }
      }

      teamsWithStats.push({
        ...team,
        bowlers: bowlersWithStats,
        totalPoints,
        wins,
        losses,
        ties,
        totalPins,
        handicapPins,
        gamesPlayed: teamGames.length,
      });
    }

    // Sort by points
    teamsWithStats.sort((a, b) => b.totalPoints - a.totalPoints);

    return teamsWithStats;
  }
}

export const storage = new DbStorage();
