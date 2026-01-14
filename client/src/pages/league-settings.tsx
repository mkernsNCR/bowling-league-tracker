import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Layout, PageHeader, LoadingState, EmptyState } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Save, Trash2, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import type { League } from "@shared/schema";

export default function LeagueSettings() {
  const params = useParams<{ id: string }>();
  const leagueId = params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: league, isLoading } = useQuery<League>({
    queryKey: ["/api/leagues", leagueId, "info"],
  });

  const [formData, setFormData] = useState<Partial<League>>({});

  useEffect(() => {
    if (league) {
      setFormData(league);
    }
  }, [league]);

  const updateLeagueMutation = useMutation({
    mutationFn: async (data: Partial<League>) => {
      await apiRequest("PATCH", `/api/leagues/${leagueId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId, "info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Settings saved",
        description: "League settings have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteLeagueMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/leagues/${leagueId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      toast({
        title: "League deleted",
        description: "The league has been permanently deleted.",
      });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete league. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading settings..." />
      </Layout>
    );
  }

  if (!league) {
    return (
      <Layout>
        <EmptyState
          icon={Settings}
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

  const handleSave = () => {
    updateLeagueMutation.mutate(formData);
  };

  return (
    <Layout leagueName={league.name} leagueId={league.id}>
      <PageHeader
        title="League Settings"
        description={`Configure settings for ${league.name}`}
        action={
          <Button
            onClick={handleSave}
            disabled={updateLeagueMutation.isPending}
            data-testid="button-save-settings"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateLeagueMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic league configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">League Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-league-name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.teamSize || ""}
                  onChange={(e) => setFormData({ ...formData, teamSize: parseInt(e.target.value) || 1 })}
                  data-testid="input-team-size"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gamesPerSession">Games Per Session</Label>
                <Input
                  id="gamesPerSession"
                  type="number"
                  min={1}
                  max={5}
                  value={formData.gamesPerSession || ""}
                  onChange={(e) => setFormData({ ...formData, gamesPerSession: parseInt(e.target.value) || 1 })}
                  data-testid="input-games-per-session"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalWeeks">Total Weeks</Label>
                <Input
                  id="totalWeeks"
                  type="number"
                  min={1}
                  max={52}
                  value={formData.totalWeeks || ""}
                  onChange={(e) => setFormData({ ...formData, totalWeeks: parseInt(e.target.value) || 1 })}
                  data-testid="input-total-weeks"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Handicap Settings</CardTitle>
            <CardDescription>Configure handicap calculation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Handicap</Label>
                <p className="text-sm text-muted-foreground">
                  Calculate and apply handicaps to scores
                </p>
              </div>
              <Switch
                checked={formData.useHandicap}
                onCheckedChange={(checked) => setFormData({ ...formData, useHandicap: checked })}
                data-testid="switch-use-handicap"
              />
            </div>

            {formData.useHandicap && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="handicapBasis">Basis Average</Label>
                  <Input
                    id="handicapBasis"
                    type="number"
                    min={180}
                    max={250}
                    value={formData.handicapBasis || ""}
                    onChange={(e) => setFormData({ ...formData, handicapBasis: parseInt(e.target.value) || 220 })}
                    data-testid="input-handicap-basis"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handicapPercentage">Handicap %</Label>
                  <Input
                    id="handicapPercentage"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.handicapPercentage || ""}
                    onChange={(e) => setFormData({ ...formData, handicapPercentage: parseInt(e.target.value) || 80 })}
                    data-testid="input-handicap-percentage"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxHandicap">Max Handicap</Label>
                  <Input
                    id="maxHandicap"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.maxHandicap || ""}
                    onChange={(e) => setFormData({ ...formData, maxHandicap: parseInt(e.target.value) || 50 })}
                    data-testid="input-max-handicap"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Point System</CardTitle>
            <CardDescription>How points are awarded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pointsPerWin">Points Per Win</Label>
                <Input
                  id="pointsPerWin"
                  type="number"
                  min={0}
                  value={formData.pointsPerWin || ""}
                  onChange={(e) => setFormData({ ...formData, pointsPerWin: parseInt(e.target.value) || 0 })}
                  data-testid="input-points-per-win"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pointsPerTie">Points Per Tie</Label>
                <Input
                  id="pointsPerTie"
                  type="number"
                  min={0}
                  value={formData.pointsPerTie || ""}
                  onChange={(e) => setFormData({ ...formData, pointsPerTie: parseInt(e.target.value) || 0 })}
                  data-testid="input-points-per-tie"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pointsPerLoss">Points Per Loss</Label>
                <Input
                  id="pointsPerLoss"
                  type="number"
                  min={0}
                  value={formData.pointsPerLoss || ""}
                  onChange={(e) => setFormData({ ...formData, pointsPerLoss: parseInt(e.target.value) || 0 })}
                  data-testid="input-points-per-loss"
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bonus Points for Series Win</Label>
                <p className="text-sm text-muted-foreground">
                  Award extra points for winning the overall series
                </p>
              </div>
              <Switch
                checked={formData.bonusPointsForSeries}
                onCheckedChange={(checked) => setFormData({ ...formData, bonusPointsForSeries: checked })}
                data-testid="switch-bonus-points"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" data-testid="button-delete-league">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete League
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete League?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{league.name}" and all associated teams, 
                    bowlers, games, and scores. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteLeagueMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirm-delete"
                  >
                    Delete League
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
