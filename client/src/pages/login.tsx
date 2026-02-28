import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setIsLoading(false);
          return;
        }
        await register(username, password);
        toast({
          title: "Account created",
          description: "Welcome to Bowling League Tracker!",
        });
      } else {
        await login(username, password);
      }
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast({
        title: "Authentication failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function toggleMode() {
    setIsRegister(!isRegister);
    setError("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">
            {isRegister ? "Create an account" : "Sign in"}
          </CardTitle>
          <CardDescription>
            {isRegister
              ? "Enter your details to create a new account"
              : "Enter your credentials to access your account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <a href="/api/auth/google" className="flex items-center justify-center gap-2">
                <Chrome className="h-5 w-5" />
                Sign in with Google
              </a>
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
            </div>
            {isRegister && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary hover:underline font-medium"
              >
                {isRegister ? "Sign in" : "Create one"}
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
