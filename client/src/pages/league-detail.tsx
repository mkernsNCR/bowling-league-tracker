import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Layout, PageHeader, LoadingState, StatCard, EmptyState } from "@/components/layout";
import { Standings } from "@/components/standings-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Trophy, 
  Users, 
  Target, 
  TrendingUp,
  Calendar,
  Settings,
  ArrowRight
} from "lucide-react";
import type { League, StandingsEntry, BowlerWithStats, Team, Game } from "@shared/schema";

interface LeagueDetailData {
  league: League;
  teams: Team[];
  teamStandings: StandingsEntry[];
  individualStandings: BowlerWithStats[];
  recentGames: Game[];
  weeksCompleted: number;
}

export default function LeagueDetail() {
  const params = useParams<{ id: string }>();
  const leagueId = params.id;

  const { data, isLoading } = useQuery<LeagueDetailData>({
    queryKey: ["/api/leagues", leagueId],
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading league..." />
      </Layout>
    );
  }

  if (!data?.league) {
    return (
      <Layout>
        <EmptyState
          icon={Trophy}
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

  const { league, teams, teamStandings, individualStandings, weeksCompleted } = data;
  const progress = (weeksCompleted / league.totalWeeks) * 100;
  const totalBowlers = individualStandings.length;

  return (
    <Layout leagueName={league.name} leagueId={league.id}>
      <PageHeader
        title={league.name}
        description={
          <div className="flex items-center gap-3">
            <Badge variant={league.status === "active" ? "default" : "secondary"}>
              {league.status === "active" ? "Active" : "Completed"}
            </Badge>
            {league.useHandicap && (
              <Badge variant="outline">
                Handicap: {league.handicapPercentage}% of {league.handicapBasis}
              </Badge>
            )}
          </div>
        }
        action={
          <div className="flex gap-2">
            <Link href={`/league/${league.id}/scores`}>
              <Button data-testid="button-enter-scores">
                <Target className="w-4 h-4 mr-2" />
                Enter Scores
              </Button>
            </Link>
            <Link href={`/league/${league.id}/settings`}>
              <Button variant="outline" data-testid="button-league-settings">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Teams"
          value={teams.length}
          icon={Users}
        />
        <StatCard
          label="Bowlers"
          value={totalBowlers}
          icon={Target}
        />
        <StatCard
          label="Week"
          value={`${weeksCompleted} / ${league.totalWeeks}`}
          icon={Calendar}
        />
        <StatCard
          label="Games/Session"
          value={league.gamesPerSession}
          icon={TrendingUp}
        />
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Season Progress</span>
            <span className="text-sm font-mono">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Add teams and bowlers to start tracking scores"
          action={
            <Link href={`/league/${league.id}/teams/new`}>
              <Button data-testid="button-add-first-team">
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Standings</h2>
            <Link href={`/league/${league.id}/standings`}>
              <Button variant="outline" size="sm" data-testid="button-view-full-standings">
                View Full Standings
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <Standings
            teamStandings={teamStandings}
            individualStandings={individualStandings}
            league={league}
          />

          <div className="flex justify-center gap-4">
            <Link href={`/league/${league.id}/teams`}>
              <Button variant="outline" data-testid="button-manage-teams">
                <Users className="w-4 h-4 mr-2" />
                Manage Teams
              </Button>
            </Link>
            <Link href={`/league/${league.id}/teams/new`}>
              <Button variant="outline" data-testid="button-add-team">
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Layout>
  );
}
