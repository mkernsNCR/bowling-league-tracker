import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Layout, PageHeader, LoadingState, EmptyState } from "@/components/layout";
import { Standings } from "@/components/standings-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Trophy, Calculator, Download } from "lucide-react";
import type { League, StandingsEntry, BowlerWithStats } from "@shared/schema";

interface StandingsData {
  league: League;
  teamStandings: StandingsEntry[];
  individualStandings: BowlerWithStats[];
}

export default function StandingsPage() {
  const params = useParams<{ id: string }>();
  const leagueId = params.id;
  const { toast } = useToast();

  const { data, isLoading } = useQuery<StandingsData>({
    queryKey: ["/api/leagues", leagueId, "standings"],
  });

  const calculateFinalsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/leagues/${leagueId}/calculate-finals`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "standings"] });
      toast({
        title: "Finals calculated",
        description: "Final standings and points have been calculated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to calculate finals. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading standings..." />
      </Layout>
    );
  }

  const league = data?.league;
  const teamStandings = data?.teamStandings || [];
  const individualStandings = data?.individualStandings || [];

  if (!league) {
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

  return (
    <Layout leagueName={league.name} leagueId={league.id}>
      <PageHeader
        title="Standings"
        description={`Current standings for ${league.name}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => calculateFinalsMutation.mutate()}
              disabled={calculateFinalsMutation.isPending}
              data-testid="button-calculate-finals"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {calculateFinalsMutation.isPending ? "Calculating..." : "Calculate Finals"}
            </Button>
          </div>
        }
      />

      {league.useHandicap && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Handicap Basis:</span>{" "}
                <span className="font-mono font-bold">{league.handicapBasis}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Handicap %:</span>{" "}
                <span className="font-mono font-bold">{league.handicapPercentage}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Max Handicap:</span>{" "}
                <span className="font-mono font-bold">{league.maxHandicap}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Points:</span>{" "}
                <span className="font-mono font-bold">
                  Win {league.pointsPerWin} / Tie {league.pointsPerTie} / Loss {league.pointsPerLoss}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {teamStandings.length === 0 && individualStandings.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No standings yet"
          description="Enter some scores to see standings"
          action={
            <Link href={`/league/${leagueId}/scores`}>
              <Button data-testid="button-enter-scores">
                Enter Scores
              </Button>
            </Link>
          }
        />
      ) : (
        <Standings
          teamStandings={teamStandings}
          individualStandings={individualStandings}
          league={league}
        />
      )}
    </Layout>
  );
}
