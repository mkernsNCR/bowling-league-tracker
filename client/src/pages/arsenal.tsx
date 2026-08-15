import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout, PageHeader, LoadingState } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CircleDot, Layers3, Pencil, Plus, Save, PackageOpen } from "lucide-react";
import type { Arsenal, Ball } from "@shared/schema";

function ballLabel(ball: Ball) {
  return ball.brand ? `${ball.brand} · ${ball.name}` : ball.name;
}

export default function ArsenalPage() {
  const { toast } = useToast();
  const [ballName, setBallName] = useState("");
  const [ballBrand, setBallBrand] = useState("");
  const [arsenalName, setArsenalName] = useState("");
  const [selectedBallIds, setSelectedBallIds] = useState<string[]>([]);
  const [editingArsenalId, setEditingArsenalId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingBallIds, setEditingBallIds] = useState<string[]>([]);

  const { data: balls = [], isLoading: ballsLoading } = useQuery<Ball[]>({
    queryKey: ["/api/balls"],
  });
  const { data: arsenals = [], isLoading: arsenalsLoading } = useQuery<Arsenal[]>({
    queryKey: ["/api/arsenals"],
  });

  const createBallMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/balls", {
        name: ballName.trim(),
        brand: ballBrand.trim(),
      });
    },
    onSuccess: () => {
      setBallName("");
      setBallBrand("");
      queryClient.invalidateQueries({ queryKey: ["/api/balls"] });
      toast({ title: "Ball added", description: "It is now available to add to an arsenal." });
    },
    onError: () => {
      toast({ title: "Could not add ball", description: "Check the ball name and try again.", variant: "destructive" });
    },
  });

  const createArsenalMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/arsenals", {
        name: arsenalName.trim(),
        ballIds: selectedBallIds,
      });
    },
    onSuccess: () => {
      setArsenalName("");
      setSelectedBallIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/arsenals"] });
      toast({ title: "Arsenal saved", description: "You can select it when entering a match." });
    },
    onError: () => {
      toast({ title: "Could not save arsenal", description: "Add a name and try again.", variant: "destructive" });
    },
  });

  const updateArsenalMutation = useMutation({
    mutationFn: async ({ id, name, ballIds }: { id: string; name: string; ballIds: string[] }) => {
      await apiRequest("PATCH", `/api/arsenals/${id}`, { name, ballIds });
    },
    onSuccess: () => {
      setEditingArsenalId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/arsenals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      toast({ title: "Arsenal updated" });
    },
    onError: () => {
      toast({ title: "Could not update arsenal", description: "Try again.", variant: "destructive" });
    },
  });

  const toggleBall = (ballId: string, currentIds: string[], setIds: (ids: string[]) => void) => {
    setIds(
      currentIds.includes(ballId)
        ? currentIds.filter((id) => id !== ballId)
        : [...currentIds, ballId],
    );
  };

  const startEditing = (arsenal: Arsenal) => {
    setEditingArsenalId(arsenal.id);
    setEditingName(arsenal.name);
    setEditingBallIds(arsenal.ballIds);
  };

  if (ballsLoading || arsenalsLoading) {
    return (
      <Layout>
        <LoadingState message="Loading your ball setup..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Ball Arsenal"
        description="Keep your full inventory here, then build smaller kits for each session."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleDot className="w-5 h-5 text-primary" />
                Your balls
              </CardTitle>
              <CardDescription>
                Add every ball you own. Arsenals decide which ones appear during score entry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (ballName.trim()) createBallMutation.mutate();
                }}
              >
                <div>
                  <label htmlFor="ball-name" className="text-sm font-medium mb-2 block">Ball name</label>
                  <Input
                    id="ball-name"
                    value={ballName}
                    onChange={(event) => setBallName(event.target.value)}
                    placeholder="Phaze II"
                    data-testid="input-ball-name"
                  />
                </div>
                <div>
                  <label htmlFor="ball-brand" className="text-sm font-medium mb-2 block">Brand <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Input
                    id="ball-brand"
                    value={ballBrand}
                    onChange={(event) => setBallBrand(event.target.value)}
                    placeholder="Storm"
                    data-testid="input-ball-brand"
                  />
                </div>
                <Button type="submit" disabled={!ballName.trim() || createBallMutation.isPending} data-testid="button-add-ball">
                  <Plus className="w-4 h-4" />
                  Add ball
                </Button>
              </form>

              {balls.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-4 py-8 text-center">
                  <PackageOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">Your inventory is empty</p>
                  <p className="text-sm text-muted-foreground mt-1">Add your first ball above to start building a kit.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {balls.map((ball) => (
                    <div key={ball.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{ball.name}</p>
                        {ball.brand && <p className="text-xs text-muted-foreground">{ball.brand}</p>}
                      </div>
                      <Badge variant="outline" className="shrink-0">Owned</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/30 bg-primary/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers3 className="w-5 h-5 text-primary" />
                Create an arsenal
              </CardTitle>
              <CardDescription>Pack only the balls you brought to the lanes today.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="arsenal-name" className="text-sm font-medium mb-2 block">Arsenal name</label>
                <Input
                  id="arsenal-name"
                  value={arsenalName}
                  onChange={(event) => setArsenalName(event.target.value)}
                  placeholder="Wednesday league"
                  data-testid="input-arsenal-name"
                />
              </div>

              <BallChecklist
                balls={balls}
                selectedIds={selectedBallIds}
                onToggle={(ballId) => toggleBall(ballId, selectedBallIds, setSelectedBallIds)}
                emptyMessage="Add balls to your inventory before creating an arsenal."
              />

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">{selectedBallIds.length} ball{selectedBallIds.length === 1 ? "" : "s"} selected</span>
                <Button
                  onClick={() => createArsenalMutation.mutate()}
                  disabled={!arsenalName.trim() || createArsenalMutation.isPending}
                  data-testid="button-create-arsenal"
                >
                  <Save className="w-4 h-4" />
                  {createArsenalMutation.isPending ? "Saving..." : "Save arsenal"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Saved arsenals</h2>
                <p className="text-sm text-muted-foreground">Choose one from the score-entry screen.</p>
              </div>
              <Badge variant="secondary">{arsenals.length}</Badge>
            </div>

            {arsenals.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Layers3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">No arsenals yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Your first session kit will show up here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {arsenals.map((arsenal) => (
                  <Card key={arsenal.id}>
                    {editingArsenalId === arsenal.id ? (
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <label htmlFor={`edit-arsenal-${arsenal.id}`} className="text-sm font-medium mb-2 block">Arsenal name</label>
                          <Input
                            id={`edit-arsenal-${arsenal.id}`}
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            data-testid={`input-edit-arsenal-${arsenal.id}`}
                          />
                        </div>
                        <BallChecklist
                          balls={balls}
                          selectedIds={editingBallIds}
                          onToggle={(ballId) => toggleBall(ballId, editingBallIds, setEditingBallIds)}
                          emptyMessage="Add balls to your inventory to edit this arsenal."
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => setEditingArsenalId(null)}>Cancel</Button>
                          <Button
                            onClick={() => updateArsenalMutation.mutate({ id: arsenal.id, name: editingName.trim(), ballIds: editingBallIds })}
                            disabled={!editingName.trim() || updateArsenalMutation.isPending}
                            data-testid={`button-save-arsenal-${arsenal.id}`}
                          >
                            <Save className="w-4 h-4" />
                            Save changes
                          </Button>
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent className="flex items-center justify-between gap-4 py-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{arsenal.name}</p>
                            <Badge variant="outline">{arsenal.ballIds.length} ball{arsenal.ballIds.length === 1 ? "" : "s"}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {arsenal.ballIds.map((id) => balls.find((ball) => ball.id === id)).filter(Boolean).map((ball) => ballLabel(ball as Ball)).join(", ") || "No balls selected"}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => startEditing(arsenal)} data-testid={`button-edit-arsenal-${arsenal.id}`}>
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>

          <p className="text-sm text-muted-foreground">
            Arsenals are optional. If you skip one while entering scores, every ball in your inventory remains available.
            <Link href="/" className="text-primary hover:underline ml-1">Back to dashboard</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}

function BallChecklist({
  balls,
  selectedIds,
  onToggle,
  emptyMessage,
}: {
  balls: Ball[];
  selectedIds: string[];
  onToggle: (ballId: string) => void;
  emptyMessage: string;
}) {
  if (balls.length === 0) {
    return <p className="text-sm text-muted-foreground rounded-md border border-dashed border-border p-4">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {balls.map((ball) => (
        <label
          key={ball.id}
          className="flex items-start gap-3 rounded-md border border-border bg-background px-3 py-2.5 cursor-pointer hover-elevate"
        >
          <Checkbox
            checked={selectedIds.includes(ball.id)}
            onCheckedChange={() => onToggle(ball.id)}
            data-testid={`checkbox-arsenal-ball-${ball.id}`}
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium truncate">{ball.name}</span>
            {ball.brand && <span className="block text-xs text-muted-foreground truncate">{ball.brand}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}
