import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Layout, PageHeader, LoadingState, EmptyState } from "@/components/layout";
import { TeamCard } from "@/components/team-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Users } from "lucide-react";
import type { League, TeamWithStats } from "@shared/schema";

interface TeamsData {
  league: League;
  teams: TeamWithStats[];
}

export default function Teams() {
  const params = useParams<{ id: string }>();
  const leagueId = params.id;
  const { toast } = useToast();

  const { data, isLoading } = useQuery<TeamsData>({
    queryKey: ["/api/leagues", leagueId, "teams"],
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await apiRequest("DELETE", `/api/teams/${teamId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId] });
      toast({
        title: "Team deleted",
        description: "The team has been removed from the league.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading teams..." />
      </Layout>
    );
  }

  const league = data?.league;
  const teams = data?.teams || [];

  if (!league) {
    return (
      <Layout>
        <EmptyState
          icon={Users}
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

  return (
    <Layout leagueName={league.name} leagueId={league.id}>
      <PageHeader
        title="Teams"
        description={`Manage teams in ${league.name}`}
        action={
          <Link href={`/league/${leagueId}/teams/new`}>
            <Button data-testid="button-add-team">
              <Plus className="w-4 h-4 mr-2" />
              Add Team
            </Button>
          </Link>
        }
      />

      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Add your first team to get started"
          action={
            <Link href={`/league/${leagueId}/teams/new`}>
              <Button data-testid="button-add-first-team">
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team, index) => (
            <TeamCard
              key={team.id}
              team={team}
              league={league}
              rank={index + 1}
              onDelete={() => deleteTeamMutation.mutate(team.id)}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
