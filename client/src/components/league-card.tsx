import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  Calendar, 
  Settings, 
  Target, 
  Trophy, 
  Users 
} from "lucide-react";
import { Link } from "wouter";
import type { League } from "@shared/schema";

interface LeagueCardProps {
  league: League;
  teamsCount: number;
  bowlersCount: number;
  weeksCompleted: number;
}

export function LeagueCard({ league, teamsCount, bowlersCount, weeksCompleted }: LeagueCardProps) {
  const progress = (weeksCompleted / league.totalWeeks) * 100;

  return (
    <Card className="hover-elevate" data-testid={`card-league-${league.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl">{league.name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={league.status === "active" ? "default" : "secondary"}>
                {league.status === "active" ? "Active" : "Completed"}
              </Badge>
              {league.useHandicap && (
                <Badge variant="outline">Handicap</Badge>
              )}
            </div>
          </div>
          <Link href={`/league/${league.id}/settings`}>
            <Button variant="ghost" size="icon" data-testid={`button-league-settings-${league.id}`}>
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Teams</p>
              <p className="font-bold font-mono">{teamsCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Bowlers</p>
              <p className="font-bold font-mono">{bowlersCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Games/Week</p>
              <p className="font-bold font-mono">{league.gamesPerSession}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Season Progress</span>
            <span className="font-mono">
              Week {weeksCompleted} of {league.totalWeeks}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex gap-2">
          <Link href={`/league/${league.id}`} className="flex-1">
            <Button className="w-full gap-2" data-testid={`button-view-league-${league.id}`}>
              <Trophy className="w-4 h-4" />
              View League
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeagueCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              <div className="h-6 w-8 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-2 w-full bg-muted rounded animate-pulse" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}
