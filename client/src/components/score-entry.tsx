import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HandicapBadge, ScoreBreakdown } from "./handicap-badge";
import { Check, Save } from "lucide-react";
import type { Bowler, Score, League, Team } from "@shared/schema";
import { cn } from "@/lib/utils";
import { ScoreScanner } from "./photo-scanner";

interface BowlerScoreEntryProps {
  bowler: Bowler;
  scores: number[];
  handicap: number;
  gamesPerSession: number;
  onScoreChange: (gameIndex: number, score: number) => void;
  league: League;
}

function BowlerScoreEntry({ 
  bowler, 
  scores, 
  handicap, 
  gamesPerSession, 
  onScoreChange,
  league 
}: BowlerScoreEntryProps) {
  const scratchTotal = scores.reduce((sum, s) => sum + s, 0);
  const handicapTotal = scratchTotal + (handicap * gamesPerSession);

  return (
    <div className="p-4 border border-border rounded-md bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{bowler.name}</span>
          {league.useHandicap && (
            <HandicapBadge 
              handicap={handicap}
              basis={league.handicapBasis}
              average={bowler.startingAverage}
              percentage={league.handicapPercentage}
            />
          )}
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${gamesPerSession}, 1fr) auto` }}>
        {Array.from({ length: gamesPerSession }).map((_, i) => (
          <div key={i}>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
              Game {i + 1}
            </label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={scores[i] === 0 ? "" : scores[i]}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === undefined) {
                  onScoreChange(i, 0);
                } else {
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num >= 0 && num <= 300) {
                    onScoreChange(i, num);
                  }
                }
              }}
              className="font-mono text-center"
              data-testid={`input-score-${bowler.id}-game-${i}`}
            />
          </div>
        ))}

        <div className="flex flex-col justify-end">
          <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
            Total
          </label>
          <div className="h-9 flex items-center justify-center font-mono font-bold text-lg">
            {league.useHandicap ? (
              <span className="text-primary">{handicapTotal}</span>
            ) : (
              <span>{scratchTotal}</span>
            )}
          </div>
        </div>
      </div>

      {league.useHandicap && scratchTotal > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <ScoreBreakdown 
            scratch={scratchTotal} 
            handicap={handicap * gamesPerSession}
          />
        </div>
      )}
    </div>
  );
}

interface TeamScoreEntryProps {
  team: Team;
  bowlers: Bowler[];
  league: League;
  existingScores: Score[];
  onSave: (scores: { bowlerId: string; gameNumber: number; score: number }[]) => void;
  isSaving?: boolean;
}

export function TeamScoreEntry({
  team,
  bowlers,
  league,
  existingScores,
  onSave,
  isSaving,
}: TeamScoreEntryProps) {
  const [scores, setScores] = useState<Record<string, number[]>>(() => {
    const initial: Record<string, number[]> = {};
    bowlers.forEach((b) => {
      const bowlerScores = Array.from({ length: league.gamesPerSession }).map((_, i) => {
        const existing = existingScores.find(
          (s) => s.bowlerId === b.id && s.gameNumber === i + 1
        );
        return existing?.score || 0;
      });
      initial[b.id] = bowlerScores;
    });
    return initial;
  });

  const calculateHandicap = (average: number) => {
    if (!league.useHandicap) return 0;
    const diff = league.handicapBasis - average;
    if (diff <= 0) return 0;
    const handicap = Math.floor(diff * (league.handicapPercentage / 100));
    return Math.min(handicap, league.maxHandicap);
  };

  const handleScoreChange = (bowlerId: string, gameIndex: number, score: number) => {
    setScores((prev) => ({
      ...prev,
      [bowlerId]: prev[bowlerId].map((s, i) => (i === gameIndex ? score : s)),
    }));
  };

  const handleSave = () => {
    const allScores: { bowlerId: string; gameNumber: number; score: number }[] = [];
    Object.entries(scores).forEach(([bowlerId, games]) => {
      games.forEach((score, index) => {
        if (score > 0) {
          allScores.push({ bowlerId, gameNumber: index + 1, score });
        }
      });
    });
    onSave(allScores);
  };

  const teamScratchTotal = Object.values(scores).flat().reduce((sum, s) => sum + s, 0);
  const teamHandicapTotal = bowlers.reduce((sum, b) => {
    const bowlerScores = scores[b.id] || [];
    const scratchTotal = bowlerScores.reduce((s, score) => s + score, 0);
    const handicap = calculateHandicap(b.startingAverage);
    return sum + scratchTotal + (handicap * league.gamesPerSession);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {team.name}
            <Badge variant="outline">{bowlers.length} bowlers</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {bowlers.map((bowler) => (
          <BowlerScoreEntry
            key={bowler.id}
            bowler={bowler}
            scores={scores[bowler.id] || []}
            handicap={calculateHandicap(bowler.startingAverage)}
            gamesPerSession={league.gamesPerSession}
            onScoreChange={(gameIndex, score) => handleScoreChange(bowler.id, gameIndex, score)}
            league={league}
          />
        ))}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Team Total</p>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold font-mono">{teamScratchTotal}</span>
              {league.useHandicap && (
                <>
                  <span className="text-muted-foreground">with handicap:</span>
                  <span className="text-2xl font-bold font-mono text-primary">
                    {teamHandicapTotal}
                  </span>
                </>
              )}
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-scores">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Scores"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface MatchScoreEntryProps {
  team1: Team;
  team2: Team;
  team1Bowlers: Bowler[];
  team2Bowlers: Bowler[];
  league: League;
  existingScores: Score[];
  gameId: string;
  onSave: (gameId: string, scores: { bowlerId: string; teamId: string; gameNumber: number; score: number }[]) => void;
  isSaving?: boolean;
}

export function MatchScoreEntry({
  team1,
  team2,
  team1Bowlers,
  team2Bowlers,
  league,
  existingScores,
  gameId,
  onSave,
  isSaving,
}: MatchScoreEntryProps) {
  const [team1Scores, setTeam1Scores] = useState<Record<string, number[]>>(() => {
    const initial: Record<string, number[]> = {};
    team1Bowlers.forEach((b) => {
      initial[b.id] = Array.from({ length: league.gamesPerSession }).map((_, i) => {
        const existing = existingScores.find(
          (s) => s.bowlerId === b.id && s.gameNumber === i + 1
        );
        return existing?.score || 0;
      });
    });
    return initial;
  });

  const [team2Scores, setTeam2Scores] = useState<Record<string, number[]>>(() => {
    const initial: Record<string, number[]> = {};
    team2Bowlers.forEach((b) => {
      initial[b.id] = Array.from({ length: league.gamesPerSession }).map((_, i) => {
        const existing = existingScores.find(
          (s) => s.bowlerId === b.id && s.gameNumber === i + 1
        );
        return existing?.score || 0;
      });
    });
    return initial;
  });

  const calculateHandicap = (average: number) => {
    if (!league.useHandicap) return 0;
    const diff = league.handicapBasis - average;
    if (diff <= 0) return 0;
    const handicap = Math.floor(diff * (league.handicapPercentage / 100));
    return Math.min(handicap, league.maxHandicap);
  };

  const calculateTeamTotal = (bowlers: Bowler[], scoresMap: Record<string, number[]>) => {
    let scratch = 0;
    let handicap = 0;
    bowlers.forEach((b) => {
      const bowlerScores = scoresMap[b.id] || [];
      const bowlerScratch = bowlerScores.reduce((sum, s) => sum + s, 0);
      scratch += bowlerScratch;
      handicap += calculateHandicap(b.startingAverage) * league.gamesPerSession;
    });
    return { scratch, handicap, total: scratch + (league.useHandicap ? handicap : 0) };
  };

  const team1Total = calculateTeamTotal(team1Bowlers, team1Scores);
  const team2Total = calculateTeamTotal(team2Bowlers, team2Scores);

  const allBowlerNames = [...team1Bowlers, ...team2Bowlers].map(b => b.name);

  const handleScoresExtracted = (data: { scores: { bowlerName: string; game1?: number; game2?: number; game3?: number }[] }) => {
    data.scores.forEach(extracted => {
      const extractedGames = [extracted.game1, extracted.game2, extracted.game3];
      
      const team1Bowler = team1Bowlers.find(b => 
        b.name.toLowerCase().includes(extracted.bowlerName.toLowerCase()) ||
        extracted.bowlerName.toLowerCase().includes(b.name.toLowerCase())
      );
      const team2Bowler = team2Bowlers.find(b => 
        b.name.toLowerCase().includes(extracted.bowlerName.toLowerCase()) ||
        extracted.bowlerName.toLowerCase().includes(b.name.toLowerCase())
      );

      if (team1Bowler) {
        setTeam1Scores(prev => {
          const existing = prev[team1Bowler.id] || Array(league.gamesPerSession).fill(0);
          const merged = existing.map((existingScore, i) => 
            extractedGames[i] !== undefined ? extractedGames[i] : existingScore
          );
          return { ...prev, [team1Bowler.id]: merged };
        });
      } else if (team2Bowler) {
        setTeam2Scores(prev => {
          const existing = prev[team2Bowler.id] || Array(league.gamesPerSession).fill(0);
          const merged = existing.map((existingScore, i) => 
            extractedGames[i] !== undefined ? extractedGames[i] : existingScore
          );
          return { ...prev, [team2Bowler.id]: merged };
        });
      }
    });
  };

  const handleSave = () => {
    const allScores: { bowlerId: string; teamId: string; gameNumber: number; score: number }[] = [];
    
    Object.entries(team1Scores).forEach(([bowlerId, games]) => {
      games.forEach((score, index) => {
        if (score > 0) {
          allScores.push({ bowlerId, teamId: team1.id, gameNumber: index + 1, score });
        }
      });
    });

    Object.entries(team2Scores).forEach(([bowlerId, games]) => {
      games.forEach((score, index) => {
        if (score > 0) {
          allScores.push({ bowlerId, teamId: team2.id, gameNumber: index + 1, score });
        }
      });
    });

    onSave(gameId, allScores);
  };

  return (
    <div className="space-y-6">
      <ScoreScanner onExtracted={handleScoresExtracted} bowlerNames={allBowlerNames} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={cn(team1Total.total > team2Total.total && "ring-2 ring-primary")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>{team1.name}</CardTitle>
              {team1Total.total > team2Total.total && (
                <Badge className="bg-primary">Leading</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {team1Bowlers.map((bowler) => (
              <BowlerScoreEntry
                key={bowler.id}
                bowler={bowler}
                scores={team1Scores[bowler.id] || []}
                handicap={calculateHandicap(bowler.startingAverage)}
                gamesPerSession={league.gamesPerSession}
                onScoreChange={(gameIndex, score) => {
                  setTeam1Scores((prev) => ({
                    ...prev,
                    [bowler.id]: prev[bowler.id].map((s, i) => (i === gameIndex ? score : s)),
                  }));
                }}
                league={league}
              />
            ))}

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Team Total</span>
                <span className="text-2xl font-bold font-mono">
                  {league.useHandicap ? team1Total.total : team1Total.scratch}
                </span>
              </div>
              {league.useHandicap && (
                <div className="text-sm text-muted-foreground">
                  Scratch: {team1Total.scratch} + Handicap: {team1Total.handicap}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={cn(team2Total.total > team1Total.total && "ring-2 ring-primary")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>{team2.name}</CardTitle>
              {team2Total.total > team1Total.total && (
                <Badge className="bg-primary">Leading</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {team2Bowlers.map((bowler) => (
              <BowlerScoreEntry
                key={bowler.id}
                bowler={bowler}
                scores={team2Scores[bowler.id] || []}
                handicap={calculateHandicap(bowler.startingAverage)}
                gamesPerSession={league.gamesPerSession}
                onScoreChange={(gameIndex, score) => {
                  setTeam2Scores((prev) => ({
                    ...prev,
                    [bowler.id]: prev[bowler.id].map((s, i) => (i === gameIndex ? score : s)),
                  }));
                }}
                league={league}
              />
            ))}

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Team Total</span>
                <span className="text-2xl font-bold font-mono">
                  {league.useHandicap ? team2Total.total : team2Total.scratch}
                </span>
              </div>
              {league.useHandicap && (
                <div className="text-sm text-muted-foreground">
                  Scratch: {team2Total.scratch} + Handicap: {team2Total.handicap}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button size="lg" onClick={handleSave} disabled={isSaving} data-testid="button-save-match">
          <Check className="w-5 h-5 mr-2" />
          {isSaving ? "Saving Match..." : "Save Match Scores"}
        </Button>
      </div>
    </div>
  );
}
