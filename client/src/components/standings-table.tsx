import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Users, User } from "lucide-react";
import { HandicapBadge } from "./handicap-badge";
import type { StandingsEntry, BowlerWithStats, League } from "@shared/schema";
import { cn } from "@/lib/utils";

interface TeamStandingsTableProps {
  standings: StandingsEntry[];
  league: League;
}

export function TeamStandingsTable({ standings, league }: TeamStandingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">W-L-T</TableHead>
            <TableHead className="text-right">Scratch</TableHead>
            {league.useHandicap && (
              <TableHead className="text-right">Handicap</TableHead>
            )}
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right font-bold">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((entry, index) => (
            <TableRow 
              key={entry.team.id}
              className={cn(index < 3 && "bg-muted/30")}
              data-testid={`row-team-standing-${entry.team.id}`}
            >
              <TableCell className="text-center">
                <div className="flex items-center justify-center">
                  {entry.rank === 1 && (
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  )}
                  {entry.rank === 2 && (
                    <Medal className="w-5 h-5 text-gray-400" />
                  )}
                  {entry.rank === 3 && (
                    <Medal className="w-5 h-5 text-amber-600" />
                  )}
                  {entry.rank > 3 && (
                    <span className="font-mono font-bold text-muted-foreground">
                      {entry.rank}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{entry.team.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {entry.team.bowlers.length} bowlers
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-center font-mono">
                {entry.team.wins}-{entry.team.losses}-{entry.team.ties}
              </TableCell>
              <TableCell className="text-right font-mono">
                {entry.scratchTotal.toLocaleString()}
              </TableCell>
              {league.useHandicap && (
                <TableCell className="text-right font-mono text-muted-foreground">
                  +{entry.handicapTotal.toLocaleString()}
                </TableCell>
              )}
              <TableCell className="text-right font-mono font-bold">
                {(entry.scratchTotal + (league.useHandicap ? entry.handicapTotal : 0)).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <span className="font-mono font-bold text-lg text-primary">
                  {entry.points}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface IndividualStandingsTableProps {
  bowlers: BowlerWithStats[];
  league: League;
}

export function IndividualStandingsTable({ bowlers, league }: IndividualStandingsTableProps) {
  const sortedBowlers = [...bowlers].sort((a, b) => b.average - a.average);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>Bowler</TableHead>
            <TableHead className="text-center">Games</TableHead>
            <TableHead className="text-right">Average</TableHead>
            {league.useHandicap && (
              <TableHead className="text-center">Handicap</TableHead>
            )}
            <TableHead className="text-right">High Game</TableHead>
            <TableHead className="text-right">High Series</TableHead>
            <TableHead className="text-right">Total Pins</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBowlers.map((bowler, index) => (
            <TableRow 
              key={bowler.id}
              className={cn(index < 3 && "bg-muted/30")}
              data-testid={`row-individual-standing-${bowler.id}`}
            >
              <TableCell className="text-center">
                <div className="flex items-center justify-center">
                  {index === 0 && (
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  )}
                  {index === 1 && (
                    <Medal className="w-5 h-5 text-gray-400" />
                  )}
                  {index === 2 && (
                    <Medal className="w-5 h-5 text-amber-600" />
                  )}
                  {index > 2 && (
                    <span className="font-mono font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">{bowler.name}</span>
              </TableCell>
              <TableCell className="text-center font-mono">
                {bowler.gamesPlayed}
              </TableCell>
              <TableCell className="text-right font-mono font-bold text-lg">
                {bowler.average.toFixed(1)}
              </TableCell>
              {league.useHandicap && (
                <TableCell className="text-center">
                  <HandicapBadge 
                    handicap={bowler.handicap}
                    basis={league.handicapBasis}
                    average={bowler.average}
                    percentage={league.handicapPercentage}
                  />
                </TableCell>
              )}
              <TableCell className="text-right font-mono">
                {bowler.highGame}
              </TableCell>
              <TableCell className="text-right font-mono">
                {bowler.highSeries}
              </TableCell>
              <TableCell className="text-right font-mono">
                {bowler.totalPins.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface StandingsProps {
  teamStandings: StandingsEntry[];
  individualStandings: BowlerWithStats[];
  league: League;
}

export function Standings({ teamStandings, individualStandings, league }: StandingsProps) {
  return (
    <Tabs defaultValue="teams" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="teams" className="gap-2" data-testid="tab-team-standings">
          <Users className="w-4 h-4" />
          Team Standings
        </TabsTrigger>
        <TabsTrigger value="individual" className="gap-2" data-testid="tab-individual-standings">
          <User className="w-4 h-4" />
          Individual
        </TabsTrigger>
      </TabsList>

      <TabsContent value="teams" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Team Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamStandings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No standings data yet. Enter some scores to see standings.
              </p>
            ) : (
              <TeamStandingsTable standings={teamStandings} league={league} />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="individual" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Individual Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {individualStandings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No individual data yet. Enter some scores to see statistics.
              </p>
            ) : (
              <IndividualStandingsTable bowlers={individualStandings} league={league} />
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
