import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeagueSchema, type InsertLeague } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface LeagueFormProps {
  onSubmit: (data: InsertLeague) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<InsertLeague>;
}

export function LeagueForm({ onSubmit, isSubmitting, defaultValues }: LeagueFormProps) {
  const form = useForm<InsertLeague>({
    resolver: zodResolver(insertLeagueSchema),
    defaultValues: {
      name: "",
      teamSize: 5,
      gamesPerSession: 3,
      totalWeeks: 36,
      handicapBasis: 210,
      handicapPercentage: 90,
      maxHandicap: 63,
      useHandicap: true,
      pointSystemType: "matchup",
      pointsPerWin: 2,
      pointsPerTie: 1,
      pointsPerLoss: 0,
      pointsPerIndividualGame: 1,
      pointsPerTeamGame: 1,
      pointsPerTeamSeries: 2,
      bonusPointsForSeries: true,
      ...defaultValues,
    },
  });

  const useHandicap = form.watch("useHandicap");
  const pointSystemType = form.watch("pointSystemType");
  const teamSize = form.watch("teamSize");
  const gamesPerSession = form.watch("gamesPerSession");
  
  // Calculate total possible points per match for matchup system
  const matchupMaxPoints = (
    (teamSize * gamesPerSession * form.watch("pointsPerIndividualGame")) + // Individual games
    (gamesPerSession * form.watch("pointsPerTeamGame")) + // Team games
    form.watch("pointsPerTeamSeries") // Series
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>League Information</CardTitle>
            <CardDescription>Basic settings for your bowling league</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>League Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Thursday Night Mixed League" 
                      {...field} 
                      data-testid="input-league-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Size</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={10}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        data-testid="input-team-size"
                      />
                    </FormControl>
                    <FormDescription>Players per team</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gamesPerSession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Games Per Session</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={5}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        data-testid="input-games-per-session"
                      />
                    </FormControl>
                    <FormDescription>Games bowled per week</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalWeeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Weeks</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={52}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        data-testid="input-total-weeks"
                      />
                    </FormControl>
                    <FormDescription>Length of season</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Handicap Settings</CardTitle>
            <CardDescription>Configure how handicaps are calculated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="useHandicap"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Handicap</FormLabel>
                    <FormDescription>
                      Calculate and apply handicaps to scores
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-use-handicap"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {useHandicap && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <FormField
                  control={form.control}
                  name="handicapBasis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Basis Average</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={180} 
                          max={250}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 220)}
                          data-testid="input-handicap-basis"
                        />
                      </FormControl>
                      <FormDescription>Base score (e.g., 220)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="handicapPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Handicap %</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 80)}
                          data-testid="input-handicap-percentage"
                        />
                      </FormControl>
                      <FormDescription>Percentage applied</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxHandicap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Handicap</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 50)}
                          data-testid="input-max-handicap"
                        />
                      </FormControl>
                      <FormDescription>Maximum handicap pins</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {useHandicap && (
              <div className="bg-muted rounded-md p-4 text-sm">
                <p className="font-medium mb-1">Handicap Formula:</p>
                <p className="font-mono text-muted-foreground">
                  (Basis - Bowler Average) × {form.watch("handicapPercentage")}%
                </p>
                <p className="text-muted-foreground mt-2">
                  Example: A bowler with 180 average would get a handicap of{" "}
                  <span className="font-mono font-medium text-foreground">
                    {Math.min(
                      Math.floor((form.watch("handicapBasis") - 180) * (form.watch("handicapPercentage") / 100)),
                      form.watch("maxHandicap")
                    )}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Point System</CardTitle>
            <CardDescription>How points are awarded each week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="pointSystemType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Point System Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid gap-3"
                    >
                      <div className="flex items-start space-x-3 p-3 border rounded-md">
                        <RadioGroupItem value="matchup" id="matchup" className="mt-1" />
                        <Label htmlFor="matchup" className="flex-1 cursor-pointer">
                          <div className="font-medium">Matchup System</div>
                          <div className="text-sm text-muted-foreground">
                            Points for individual bowler matchups, team game totals, and series
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border rounded-md">
                        <RadioGroupItem value="simple" id="simple" className="mt-1" />
                        <Label htmlFor="simple" className="flex-1 cursor-pointer">
                          <div className="font-medium">Simple Win/Loss</div>
                          <div className="text-sm text-muted-foreground">
                            Points based on overall match result only
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            {pointSystemType === "matchup" && (
              <>
                <div className="bg-muted rounded-md p-4 text-sm space-y-2">
                  <p className="font-medium">Matchup Point Breakdown:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>Individual Games: {teamSize} bowlers x {gamesPerSession} games = {teamSize * gamesPerSession} possible points</li>
                    <li>Team Game Totals: {gamesPerSession} games = {gamesPerSession} possible points</li>
                    <li>Team Series Total: 1 series = points configured below</li>
                  </ul>
                  <p className="font-medium text-foreground pt-2">
                    Maximum points per week: {matchupMaxPoints}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="pointsPerIndividualGame"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Per Individual Game</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-points-per-individual-game"
                          />
                        </FormControl>
                        <FormDescription>When bowler beats opponent</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pointsPerTeamGame"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Per Team Game</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-points-per-team-game"
                          />
                        </FormControl>
                        <FormDescription>Team total each game</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pointsPerTeamSeries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Per Team Series</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-points-per-team-series"
                          />
                        </FormControl>
                        <FormDescription>Team series total</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {pointSystemType === "simple" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="pointsPerWin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Per Win</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-points-per-win"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pointsPerTie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Per Tie</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-points-per-tie"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pointsPerLoss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Per Loss</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-points-per-loss"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Separator />

            <FormField
              control={form.control}
              name="bonusPointsForSeries"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Track Series Wins</FormLabel>
                    <FormDescription>
                      Track wins, losses, and ties in standings
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-bonus-points"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting}
            data-testid="button-create-league"
          >
            {isSubmitting ? "Creating..." : "Create League"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
