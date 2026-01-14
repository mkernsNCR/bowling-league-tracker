import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Layout, PageHeader, LoadingState } from "@/components/layout";
import { TeamForm } from "@/components/team-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { League, Team, Bowler } from "@shared/schema";

export default function CreateTeam() {
  const params = useParams<{ id: string }>();
  const leagueId = params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: league, isLoading } = useQuery<League>({
    queryKey: ["/api/leagues", leagueId, "info"],
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; bowlers: { name: string; startingAverage: number }[] }) => {
      const teamResponse = await apiRequest("POST", "/api/teams", {
        name: data.name,
        leagueId,
      });
      const team = await teamResponse.json() as Team;

      for (const bowler of data.bowlers) {
        await apiRequest("POST", "/api/bowlers", {
          ...bowler,
          teamId: team.id,
          leagueId,
        });
      }

      return team;
    },
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Team created",
        description: `${team.name} has been added to the league.`,
      });
      navigate(`/league/${leagueId}/teams`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading..." />
      </Layout>
    );
  }

  if (!league) {
    return (
      <Layout>
        <PageHeader title="League not found" />
      </Layout>
    );
  }

  return (
    <Layout leagueName={league.name} leagueId={league.id}>
      <PageHeader
        title="Add Team"
        description={`Add a new team with bowlers to ${league.name}`}
      />

      <div className="max-w-2xl">
        <TeamForm
          onSubmit={(data) => createTeamMutation.mutate(data)}
          isSubmitting={createTeamMutation.isPending}
          teamSize={league.teamSize}
        />
      </div>
    </Layout>
  );
}
