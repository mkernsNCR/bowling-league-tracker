import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HandicapBadgeProps {
  handicap: number;
  basis?: number;
  average?: number;
  percentage?: number;
  className?: string;
}

export function HandicapBadge({ 
  handicap, 
  basis, 
  average, 
  percentage,
  className 
}: HandicapBadgeProps) {
  const hasDetails = basis !== undefined && average !== undefined && percentage !== undefined;

  const badge = (
    <Badge 
      variant="secondary" 
      className={cn("font-mono text-xs", className)}
      data-testid="badge-handicap"
    >
      +{handicap}
    </Badge>
  );

  if (!hasDetails) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-1">
          <p>Handicap Calculation:</p>
          <p className="font-mono">({basis} - {average}) × {percentage}% = {handicap}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface ScoreBreakdownProps {
  scratch: number;
  handicap: number;
  className?: string;
}

export function ScoreBreakdown({ scratch, handicap, className }: ScoreBreakdownProps) {
  const total = scratch + handicap;
  
  return (
    <div className={cn("flex items-center gap-2 font-mono", className)}>
      <span className="text-lg font-bold">{scratch}</span>
      <span className="text-muted-foreground">+</span>
      <span className="text-sm text-muted-foreground">{handicap}</span>
      <span className="text-muted-foreground">=</span>
      <span className="text-lg font-bold text-primary">{total}</span>
    </div>
  );
}
