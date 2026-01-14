import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout, PageHeader } from "@/components/layout";
import { LeagueForm } from "@/components/league-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertLeague, League } from "@shared/schema";

export default function CreateLeague() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const createLeagueMutation = useMutation({
    mutationFn: async (data: InsertLeague) => {
      const response = await apiRequest("POST", "/api/leagues", data);
      return await response.json() as League;
    },
    onSuccess: (league) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      toast({
        title: "League created",
        description: `${league.name} has been created successfully.`,
      });
      navigate(`/league/${league.id}/teams/new`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create league. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Layout>
      <PageHeader
        title="Create League"
        description="Set up a new bowling league with your preferred settings"
      />

      <div className="max-w-3xl">
        <LeagueForm
          onSubmit={(data) => createLeagueMutation.mutate(data)}
          isSubmitting={createLeagueMutation.isPending}
        />
      </div>
    </Layout>
  );
}
