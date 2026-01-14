import { randomUUID } from "crypto";
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
} from "@shared/schema";

export interface IStorage {
  // Leagues
  getLeagues(): Promise<League[]>;
  getLeague(id: string): Promise<League | undefined>;
  createLeague(league: InsertLeague): Promise<League>;
  updateLeague(id: string, updates: Partial<League>): Promise<League | undefined>;
  deleteLeague(id: string): Promise<boolean>;

  // Teams
  getTeams(leagueId?: string): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;

  // Bowlers
  getBowlers(leagueId?: string, teamId?: string): Promise<Bowler[]>;
  getBowler(id: string): Promise<Bowler | undefined>;
  createBowler(bowler: InsertBowler): Promise<Bowler>;
  updateBowler(id: string, updates: Partial<Bowler>): Promise<Bowler | undefined>;
  deleteBowler(id: string): Promise<boolean>;

  // Games
  getGames(leagueId?: string): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined>;
  deleteGame(id: string): Promise<boolean>;

  // Scores
  getScores(gameId?: string): Promise<Score[]>;
  getScoresByBowler(bowlerId: string): Promise<Score[]>;
  createScore(score: InsertScore): Promise<Score>;
  updateScore(id: string, updates: Partial<Score>): Promise<Score | undefined>;
  deleteScore(id: string): Promise<boolean>;
  deleteScoresByGame(gameId: string): Promise<boolean>;

  // Computed
  getBowlerWithStats(bowlerId: string, league: League): Promise<BowlerWithStats | undefined>;
  getTeamWithStats(teamId: string, league: League): Promise<TeamWithStats | undefined>;
  getTeamStandings(leagueId: string): Promise<StandingsEntry[]>;
  getIndividualStandings(leagueId: string): Promise<BowlerWithStats[]>;
  getWeeksCompleted(leagueId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private leagues: Map<string, League> = new Map();
  private teams: Map<string, Team> = new Map();
  private bowlers: Map<string, Bowler> = new Map();
  private games: Map<string, Game> = new Map();
  private scores: Map<string, Score> = new Map();

  // Leagues
  async getLeagues(): Promise<League[]> {
    return Array.from(this.leagues.values());
  }

  async getLeague(id: string): Promise<League | undefined> {
    return this.leagues.get(id);
  }

  async createLeague(league: InsertLeague): Promise<League> {
    const id = randomUUID();
    const newLeague: League = { ...league, id, status: "active" };
    this.leagues.set(id, newLeague);
    return newLeague;
  }

  async updateLeague(id: string, updates: Partial<League>): Promise<League | undefined> {
    const league = this.leagues.get(id);
    if (!league) return undefined;
    const updated = { ...league, ...updates };
    this.leagues.set(id, updated);
    return updated;
  }

  async deleteLeague(id: string): Promise<boolean> {
    // Delete all related data
    const teams = Array.from(this.teams.values()).filter(t => t.leagueId === id);
    for (const team of teams) {
      await this.deleteTeam(team.id);
    }
    const games = Array.from(this.games.values()).filter(g => g.leagueId === id);
    for (const game of games) {
      await this.deleteGame(game.id);
    }
    return this.leagues.delete(id);
  }

  // Teams
  async getTeams(leagueId?: string): Promise<Team[]> {
    const teams = Array.from(this.teams.values());
    if (leagueId) {
      return teams.filter(t => t.leagueId === leagueId);
    }
    return teams;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const newTeam: Team = { ...team, id };
    this.teams.set(id, newTeam);
    return newTeam;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    const updated = { ...team, ...updates };
    this.teams.set(id, updated);
    return updated;
  }

  async deleteTeam(id: string): Promise<boolean> {
    // Delete all bowlers in the team
    const bowlers = Array.from(this.bowlers.values()).filter(b => b.teamId === id);
    for (const bowler of bowlers) {
      await this.deleteBowler(bowler.id);
    }
    return this.teams.delete(id);
  }

  // Bowlers
  async getBowlers(leagueId?: string, teamId?: string): Promise<Bowler[]> {
    let bowlers = Array.from(this.bowlers.values());
    if (leagueId) {
      bowlers = bowlers.filter(b => b.leagueId === leagueId);
    }
    if (teamId) {
      bowlers = bowlers.filter(b => b.teamId === teamId);
    }
    return bowlers;
  }

  async getBowler(id: string): Promise<Bowler | undefined> {
    return this.bowlers.get(id);
  }

  async createBowler(bowler: InsertBowler): Promise<Bowler> {
    const id = randomUUID();
    const newBowler: Bowler = { ...bowler, id };
    this.bowlers.set(id, newBowler);
    return newBowler;
  }

  async updateBowler(id: string, updates: Partial<Bowler>): Promise<Bowler | undefined> {
    const bowler = this.bowlers.get(id);
    if (!bowler) return undefined;
    const updated = { ...bowler, ...updates };
    this.bowlers.set(id, updated);
    return updated;
  }

  async deleteBowler(id: string): Promise<boolean> {
    // Delete all scores for this bowler
    const scores = Array.from(this.scores.values()).filter(s => s.bowlerId === id);
    for (const score of scores) {
      this.scores.delete(score.id);
    }
    return this.bowlers.delete(id);
  }

  // Games
  async getGames(leagueId?: string): Promise<Game[]> {
    const games = Array.from(this.games.values());
    if (leagueId) {
      return games.filter(g => g.leagueId === leagueId);
    }
    return games;
  }

  async getGame(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async createGame(game: InsertGame): Promise<Game> {
    const id = randomUUID();
    const newGame: Game = { ...game, id, completed: false };
    this.games.set(id, newGame);
    return newGame;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    const updated = { ...game, ...updates };
    this.games.set(id, updated);
    return updated;
  }

  async deleteGame(id: string): Promise<boolean> {
    await this.deleteScoresByGame(id);
    return this.games.delete(id);
  }

  // Scores
  async getScores(gameId?: string): Promise<Score[]> {
    const scores = Array.from(this.scores.values());
    if (gameId) {
      return scores.filter(s => s.gameId === gameId);
    }
    return scores;
  }

  async getScoresByBowler(bowlerId: string): Promise<Score[]> {
    return Array.from(this.scores.values()).filter(s => s.bowlerId === bowlerId);
  }

  async createScore(score: InsertScore): Promise<Score> {
    const id = randomUUID();
    const newScore: Score = { ...score, id };
    this.scores.set(id, newScore);
    return newScore;
  }

  async updateScore(id: string, updates: Partial<Score>): Promise<Score | undefined> {
    const score = this.scores.get(id);
    if (!score) return undefined;
    const updated = { ...score, ...updates };
    this.scores.set(id, updated);
    return updated;
  }

  async deleteScore(id: string): Promise<boolean> {
    return this.scores.delete(id);
  }

  async deleteScoresByGame(gameId: string): Promise<boolean> {
    const scores = Array.from(this.scores.values()).filter(s => s.gameId === gameId);
    for (const score of scores) {
      this.scores.delete(score.id);
    }
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

    const scores = await this.getScoresByBowler(bowlerId);
    const gamesPlayed = scores.length;
    const totalPins = scores.reduce((sum, s) => sum + s.score, 0);
    const average = gamesPlayed > 0 ? totalPins / gamesPlayed : bowler.startingAverage;
    const handicap = this.calculateHandicap(average, league);
    const highGame = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;

    // Calculate high series (best 3 consecutive games)
    let highSeries = 0;
    if (scores.length >= 3) {
      const sortedScores = [...scores].sort((a, b) => b.score - a.score);
      highSeries = sortedScores.slice(0, 3).reduce((sum, s) => sum + s.score, 0);
    } else if (scores.length > 0) {
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
      const teamScores = gameScores.filter(s => s.teamId === teamId);
      const opponentId = game.team1Id === teamId ? game.team2Id : game.team1Id;
      const opponentScores = gameScores.filter(s => s.teamId === opponentId);

      // Get opponent bowlers with stats
      const opponentBowlers = await this.getBowlers(undefined, opponentId);
      for (const ob of opponentBowlers) {
        if (!bowlerStatsCache.has(ob.id)) {
          const stats = await this.getBowlerWithStats(ob.id, league);
          if (stats) bowlerStatsCache.set(ob.id, stats);
        }
      }

      // Accumulate total pins and handicap pins (once per score/game bowled)
      for (const score of teamScores) {
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
        const teamScoresByGame: Record<number, {bowlerId: string; score: number; handicap: number}[]> = {};
        const oppScoresByGame: Record<number, {bowlerId: string; score: number; handicap: number}[]> = {};

        for (let gameNum = 1; gameNum <= league.gamesPerSession; gameNum++) {
          teamScoresByGame[gameNum] = [];
          oppScoresByGame[gameNum] = [];
        }

        for (const score of teamScores) {
          const bowlerStats = bowlerStatsCache.get(score.bowlerId);
          const hcp = league.useHandicap ? (bowlerStats?.handicap || 0) : 0;
          teamScoresByGame[score.gameNumber]?.push({
            bowlerId: score.bowlerId,
            score: score.score,
            handicap: hcp
          });
        }

        for (const score of opponentScores) {
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

        for (const score of teamScores) {
          const bowlerStats = bowlerStatsCache.get(score.bowlerId);
          const hcp = league.useHandicap ? (bowlerStats?.handicap || 0) : 0;
          teamSeriesTotal += score.score + hcp;
        }

        for (const score of opponentScores) {
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

    const teams = await this.getTeams(leagueId);
    const standings: StandingsEntry[] = [];

    for (const team of teams) {
      const teamWithStats = await this.getTeamWithStats(team.id, league);
      if (teamWithStats) {
        standings.push({
          rank: 0,
          team: teamWithStats,
          scratchTotal: teamWithStats.totalPins,
          handicapTotal: teamWithStats.handicapPins,
          points: teamWithStats.totalPoints,
        });
      }
    }

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

  async getIndividualStandings(leagueId: string): Promise<BowlerWithStats[]> {
    const league = await this.getLeague(leagueId);
    if (!league) return [];

    const bowlers = await this.getBowlers(leagueId);
    const bowlersWithStats: BowlerWithStats[] = [];

    for (const bowler of bowlers) {
      const stats = await this.getBowlerWithStats(bowler.id, league);
      if (stats) bowlersWithStats.push(stats);
    }

    // Sort by average
    bowlersWithStats.sort((a, b) => b.average - a.average);

    return bowlersWithStats;
  }

  async getWeeksCompleted(leagueId: string): Promise<number> {
    const games = await this.getGames(leagueId);
    const completedGames = games.filter(g => g.completed);
    if (completedGames.length === 0) return 0;
    return Math.max(...completedGames.map(g => g.week));
  }
}

export const storage = new MemStorage();
