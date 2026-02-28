import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "./hooks/use-auth";
import ProtectedRoute from "./components/protected-route";
import Dashboard from "@/pages/dashboard";
import CreateLeague from "@/pages/create-league";
import LeagueDetail from "@/pages/league-detail";
import Teams from "@/pages/teams";
import CreateTeam from "@/pages/create-team";
import Standings from "@/pages/standings";
import Scores from "@/pages/scores";
import LeagueSettings from "@/pages/league-settings";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function ProtectedRoutes() {
  return (
    <ProtectedRoute>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/league/new" component={CreateLeague} />
        <Route path="/league/:id" component={LeagueDetail} />
        <Route path="/league/:id/teams" component={Teams} />
        <Route path="/league/:id/teams/new" component={CreateTeam} />
        <Route path="/league/:id/standings" component={Standings} />
        <Route path="/league/:id/scores" component={Scores} />
        <Route path="/league/:id/settings" component={LeagueSettings} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="*">
        <ProtectedRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
