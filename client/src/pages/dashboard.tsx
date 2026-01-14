import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout, PageHeader, EmptyState, StatCard } from "@/components/layout";
import { LeagueCard, LeagueCardSkeleton } from "@/components/league-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trophy, Users, Target, TrendingUp } from "lucide-react";
import type { League, Team, Bowler } from "@shared/schema";

interface DashboardData {
  leagues: League[];
  teams: Team[];
  bowlers: Bowler[];
  weeksCompleted: Record<string, number>;
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const activeLeagues = data?.leagues.filter(l => l.status === "active") || [];
  const totalTeams = data?.teams.length || 0;
  const totalBowlers = data?.bowlers.length || 0;

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        description="Manage your bowling leagues, teams, and scores"
        action={
          <Link href="/league/new">
            <Button data-testid="button-create-league">
              <Plus className="w-4 h-4 mr-2" />
              New League
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Leagues"
          value={activeLeagues.length}
          icon={Trophy}
        />
        <StatCard
          label="Total Teams"
          value={totalTeams}
          icon={Users}
        />
        <StatCard
          label="Total Bowlers"
          value={totalBowlers}
          icon={Target}
        />
        <StatCard
          label="Games This Week"
          value={activeLeagues.reduce((sum, l) => sum + l.gamesPerSession, 0)}
          icon={TrendingUp}
        />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Your Leagues</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <LeagueCardSkeleton key={i} />
            ))}
          </div>
        ) : data?.leagues.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No leagues yet"
            description="Create your first bowling league to start tracking scores and standings"
            action={
              <Link href="/league/new">
                <Button data-testid="button-create-first-league">
                  <Plus className="w-4 h-4 mr-2" />
                  Create League
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.leagues.map((league) => {
              const leagueTeams = data.teams.filter(t => t.leagueId === league.id);
              const leagueBowlers = data.bowlers.filter(b => b.leagueId === league.id);
              return (
                <LeagueCard
                  key={league.id}
                  league={league}
                  teamsCount={leagueTeams.length}
                  bowlersCount={leagueBowlers.length}
                  weeksCompleted={data.weeksCompleted[league.id] || 0}
                />
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}
