import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { HandicapBadge } from "./handicap-badge";
import { ChevronDown, ChevronUp, Edit, Trash2, Users } from "lucide-react";
import { useState } from "react";
import type { TeamWithStats, League } from "@shared/schema";
import { cn } from "@/lib/utils";

interface TeamCardProps {
  team: TeamWithStats;
  league: League;
  rank?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TeamCard({ team, league, rank, onEdit, onDelete }: TeamCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="hover-elevate" data-testid={`card-team-${team.id}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {rank !== undefined && (
                <div className={cn(
                  "w-10 h-10 rounded-md flex items-center justify-center font-bold text-lg",
                  rank === 1 && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
                  rank === 2 && "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                  rank === 3 && "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
                  rank > 3 && "bg-muted text-muted-foreground"
                )}>
                  {rank}
                </div>
              )}
              <div>
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {team.bowlers.length} bowlers
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {team.wins}W - {team.losses}L - {team.ties}T
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onEdit}
                  data-testid={`button-edit-team-${team.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onDelete}
                  data-testid={`button-delete-team-${team.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Points</p>
              <p className="text-2xl font-bold font-mono text-primary">{team.totalPoints}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Pins</p>
              <p className="text-xl font-bold font-mono">{team.totalPins.toLocaleString()}</p>
            </div>
            {league.useHandicap && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">With Handicap</p>
                <p className="text-xl font-bold font-mono">
                  {(team.totalPins + team.handicapPins).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Games</p>
              <p className="text-xl font-bold font-mono">{team.gamesPlayed}</p>
            </div>
          </div>

          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              data-testid={`button-expand-team-${team.id}`}
            >
              {isOpen ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide Bowlers
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show Bowlers
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </CardContent>

        <CollapsibleContent>
          <div className="px-6 pb-4 space-y-2">
            {team.bowlers.map((bowler) => (
              <div 
                key={bowler.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{bowler.name}</span>
                  {league.useHandicap && (
                    <HandicapBadge 
                      handicap={bowler.handicap}
                      basis={league.handicapBasis}
                      average={bowler.average}
                      percentage={league.handicapPercentage}
                    />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-muted-foreground">Avg</p>
                    <p className="font-mono font-bold">{bowler.average.toFixed(1)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Games</p>
                    <p className="font-mono">{bowler.gamesPlayed}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">High</p>
                    <p className="font-mono">{bowler.highGame}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
