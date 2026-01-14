import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Layout, PageHeader, LoadingState, EmptyState } from "@/components/layout";
import { MatchScoreEntry } from "@/components/score-entry";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Target, Plus, Check, Users } from "lucide-react";
import { useState } from "react";
import type { League, Team, Bowler, Game, Score } from "@shared/schema";

interface ScoresData {
  league: League;
  teams: Team[];
  bowlers: Bowler[];
  games: Game[];
  scores: Score[];
  currentWeek: number;
}

export default function Scores() {
  const params = useParams<{ id: string }>();
  const leagueId = params.id;
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const { data, isLoading } = useQuery<ScoresData>({
    queryKey: ["/api/leagues", leagueId, "scores"],
  });

  const saveScoresMutation = useMutation({
    mutationFn: async ({ 
      gameId, 
      scores 
    }: { 
      gameId: string; 
      scores: { bowlerId: string; teamId: string; gameNumber: number; score: number }[] 
    }) => {
      await apiRequest("POST", `/api/games/${gameId}/scores`, { scores });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "standings"] });
      toast({
        title: "Scores saved",
        description: "Match scores have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save scores. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createGameMutation = useMutation({
    mutationFn: async ({ team1Id, team2Id, week }: { team1Id: string; team2Id: string; week: number }) => {
      await apiRequest("POST", "/api/games", {
        leagueId,
        team1Id,
        team2Id,
        week,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "scores"] });
      toast({
        title: "Match created",
        description: "New match has been created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create match. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading scores..." />
      </Layout>
    );
  }

  const league = data?.league;
  const teams = data?.teams || [];
  const bowlers = data?.bowlers || [];
  const games = data?.games || [];
  const scores = data?.scores || [];
  const currentWeek = data?.currentWeek || 1;

  if (!league) {
    return (
      <Layout>
        <EmptyState
          icon={Target}
          title="League not found"
          description="The league you're looking for doesn't exist"
          action={
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
          }
        />
      </Layout>
    );
  }

  if (teams.length < 2) {
    return (
      <Layout leagueName={league.name} leagueId={league.id}>
        <PageHeader
          title="Enter Scores"
          description="Enter match scores for your bowling league"
        />
        <EmptyState
          icon={Users}
          title="Not enough teams"
          description="You need at least 2 teams to enter match scores"
          action={
            <Link href={`/league/${leagueId}/teams/new`}>
              <Button data-testid="button-add-team">
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </Link>
          }
        />
      </Layout>
    );
  }

  const activeWeek = selectedWeek ?? currentWeek;
  const weekGames = games.filter(g => g.week === activeWeek);

  const weeks = Array.from({ length: league.totalWeeks }, (_, i) => i + 1);

  return (
    <Layout leagueName={league.name} leagueId={league.id}>
      <PageHeader
        title="Enter Scores"
        description={`Enter match scores for Week ${activeWeek}`}
        action={
          <Select
            value={activeWeek.toString()}
            onValueChange={(v) => setSelectedWeek(parseInt(v))}
          >
            <SelectTrigger className="w-40" data-testid="select-week">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              {weeks.map((week) => (
                <SelectItem key={week} value={week.toString()}>
                  Week {week}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {weekGames.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Target}
              title="No matches this week"
              description="Create a match to start entering scores"
              action={
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select two teams to create a match
                  </p>
                  <QuickMatchCreator
                    teams={teams}
                    week={activeWeek}
                    onCreate={(team1Id, team2Id) => 
                      createGameMutation.mutate({ team1Id, team2Id, week: activeWeek })
                    }
                    isCreating={createGameMutation.isPending}
                  />
                </div>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {weekGames.map((game) => {
            const team1 = teams.find(t => t.id === game.team1Id);
            const team2 = teams.find(t => t.id === game.team2Id);
            const team1Bowlers = bowlers.filter(b => b.teamId === game.team1Id);
            const team2Bowlers = bowlers.filter(b => b.teamId === game.team2Id);
            const gameScores = scores.filter(s => s.gameId === game.id);

            if (!team1 || !team2) return null;

            return (
              <div key={game.id}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {team1.name} vs {team2.name}
                  </h2>
                  {game.completed && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="w-3 h-3" />
                      Completed
                    </Badge>
                  )}
                </div>
                <MatchScoreEntry
                  team1={team1}
                  team2={team2}
                  team1Bowlers={team1Bowlers}
                  team2Bowlers={team2Bowlers}
                  league={league}
                  existingScores={gameScores}
                  gameId={game.id}
                  onSave={(gameId, newScores) => 
                    saveScoresMutation.mutate({ gameId, scores: newScores })
                  }
                  isSaving={saveScoresMutation.isPending}
                />
              </div>
            );
          })}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Another Match</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickMatchCreator
                teams={teams}
                week={activeWeek}
                existingGames={weekGames}
                onCreate={(team1Id, team2Id) => 
                  createGameMutation.mutate({ team1Id, team2Id, week: activeWeek })
                }
                isCreating={createGameMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
}

function QuickMatchCreator({
  teams,
  week,
  existingGames = [],
  onCreate,
  isCreating,
}: {
  teams: Team[];
  week: number;
  existingGames?: Game[];
  onCreate: (team1Id: string, team2Id: string) => void;
  isCreating: boolean;
}) {
  const [team1Id, setTeam1Id] = useState<string>("");
  const [team2Id, setTeam2Id] = useState<string>("");

  const usedTeamIds = new Set(
    existingGames.flatMap(g => [g.team1Id, g.team2Id])
  );

  const availableTeams = teams.filter(t => !usedTeamIds.has(t.id));

  const handleCreate = () => {
    if (team1Id && team2Id && team1Id !== team2Id) {
      onCreate(team1Id, team2Id);
      setTeam1Id("");
      setTeam2Id("");
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[150px]">
        <label className="text-sm text-muted-foreground mb-2 block">Team 1</label>
        <Select value={team1Id} onValueChange={setTeam1Id}>
          <SelectTrigger data-testid="select-team1">
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent>
            {availableTeams
              .filter(t => t.id !== team2Id)
              .map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <span className="text-muted-foreground font-medium pb-2">vs</span>

      <div className="flex-1 min-w-[150px]">
        <label className="text-sm text-muted-foreground mb-2 block">Team 2</label>
        <Select value={team2Id} onValueChange={setTeam2Id}>
          <SelectTrigger data-testid="select-team2">
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent>
            {availableTeams
              .filter(t => t.id !== team1Id)
              .map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleCreate}
        disabled={!team1Id || !team2Id || team1Id === team2Id || isCreating}
        data-testid="button-create-match"
      >
        <Plus className="w-4 h-4 mr-2" />
        {isCreating ? "Creating..." : "Create Match"}
      </Button>
    </div>
  );
}
