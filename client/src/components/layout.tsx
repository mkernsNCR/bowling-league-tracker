import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Target,
  Menu,
  X,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  leagueName?: string;
  leagueId?: string;
}

const getNavItems = (leagueId?: string) => [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: leagueId ? `/league/${leagueId}/standings` : "/standings", label: "Standings", icon: Trophy },
  { href: leagueId ? `/league/${leagueId}/teams` : "/teams", label: "Teams", icon: Users },
  { href: leagueId ? `/league/${leagueId}/scores` : "/scores", label: "Enter Scores", icon: Target },
];

export function Layout({ children, leagueName, leagueId }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="hidden sm:inline">BowlTrack</span>
              </Link>
              
              {leagueName && (
                <div className="hidden md:flex items-center gap-2 text-muted-foreground">
                  <ChevronRight className="w-4 h-4" />
                  <span className="font-medium text-foreground">{leagueName}</span>
                </div>
              )}
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {leagueId && getNavItems(leagueId).slice(1).map((item) => {
                const isActive = location === item.href || 
                  (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <Button 
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                      data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              {!leagueId && (
                <Link href="/">
                  <Button 
                    variant={location === "/" ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                    data-testid="nav-dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="flex flex-col p-4 gap-2">
              {(leagueId ? getNavItems(leagueId) : getNavItems().slice(0, 1)).map((item) => {
                const isActive = location === item.href || 
                  (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <Button 
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`mobile-nav-${item.label.toLowerCase().replace(" ", "-")}`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ 
  title, 
  description, 
  action 
}: { 
  title: string; 
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ElementType;
  className?: string;
}) {
  return (
    <div className={cn("bg-card border border-card-border rounded-md p-4", className)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="text-2xl md:text-3xl font-bold font-mono">{value}</div>
      {subValue && (
        <p className="text-sm text-muted-foreground mt-1">{subValue}</p>
      )}
    </div>
  );
}
